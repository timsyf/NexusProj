from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import os
import shutil
from flask import Flask, request, jsonify
import speech_recognition as sr
import uuid
import base64
import ffmpeg
import traceback
from pydub import AudioSegment
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
import jwt
from io import BytesIO
from PIL import Image
import datetime
from bson import ObjectId
from dotenv import load_dotenv
load_dotenv(dotenv_path=".env")
from scipy.spatial.distance import cosine

app = Flask(__name__)
CORS(app)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "defaultfallbackkey")
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["auth_db"]
users_collection = db["users"]
face_collection = db["face_data"]
prompts_collection = db["prompts"]
TEMP_DB_PATH = "./temp_faces"
TEMP_INPUT_IMAGE = "./temp_input"
os.makedirs(TEMP_INPUT_IMAGE, exist_ok=True)
os.makedirs(TEMP_DB_PATH, exist_ok=True)

CHUNK_MS = 5000
FACE_DB = "./face_data"

@app.route("/prompts", methods=["GET"])
def get_prompts():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Missing username"}), 400

    prompts_doc = prompts_collection.find_one({"username": username})
    if not prompts_doc:
        return jsonify({"prompts": []})

    return jsonify({"prompts": prompts_doc.get("prompts", [])})

@app.route("/prompts", methods=["POST"])
def save_prompts():
    data = request.get_json()
    username = data.get("username")
    prompts = data.get("prompts", [])

    if not username or not isinstance(prompts, list):
        return jsonify({"error": "Invalid input"}), 400

    prompts_collection.update_one(
        {"username": username},
        {"$set": {"prompts": prompts}},
        upsert=True
    )

    return jsonify({"message": "Prompts updated."})

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Missing username or password"}), 400

    if users_collection.find_one({"username": username}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = generate_password_hash(password)
    users_collection.insert_one({
        "username": username,
        "password": hashed_password
    })

    return jsonify({"message": "User registered successfully"}), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = users_collection.find_one({"username": username})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = jwt.encode({
        "id": str(user["_id"]),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config["SECRET_KEY"], algorithm="HS256")

    return jsonify({"message": "Login successful", "token": token}), 200

@app.route("/extract-audio-subtitles", methods=["POST"])
def extract_audio_subtitles():
    file = request.files.get("video")
    if not file:
        return jsonify({"error": "No video uploaded"}), 400

    video_id = str(uuid.uuid4())
    video_path = f"{video_id}.mp4"
    audio_path = f"{video_id}.wav"
    file.save(video_path)

    try:
        ffmpeg.input(video_path).output(audio_path, ac=1, ar=16000).run(overwrite_output=True)

        audio = AudioSegment.from_wav(audio_path)
        duration_ms = len(audio)
        recognizer = sr.Recognizer()

        subtitles = []
        for i in range(0, duration_ms, CHUNK_MS):
            chunk = audio[i:i + CHUNK_MS]
            chunk_path = f"{video_id}_chunk{i}.wav"
            chunk.export(chunk_path, format="wav")

            with sr.AudioFile(chunk_path) as source:
                audio_data = recognizer.record(source)

            try:
                text = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                text = "(Unclear speech)"
            except Exception as e:
                text = f"(Error: {str(e)})"

            subtitles.append({
                "text": text,
                "start": i / 1000,
                "end": (i + CHUNK_MS) / 1000
            })

            os.remove(chunk_path)

        return jsonify({"subtitles": subtitles})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        for path in [video_path, audio_path]:
            if os.path.exists(path):
                os.remove(path)

def save_base64_to_image(base64_str, save_path):
    header, encoded = base64_str.split(",", 1)
    img_data = base64.b64decode(encoded)
    with open(save_path, "wb") as f:
        f.write(img_data)

@app.route("/verify", methods=["POST"])
def verify():
    data = request.get_json()
    base64_img = data.get("image")
    username = data.get("username")

    if not base64_img or not username:
        return jsonify({"error": "Missing image or username"}), 400

    try:
        temp_img_path = f"{TEMP_INPUT_IMAGE}/input_{uuid.uuid4().hex}.jpg"
        save_base64_to_image(base64_img, temp_img_path)

        input_embedding = DeepFace.represent(
            img_path=temp_img_path,
            model_name="Facenet512",
            detector_backend="retinaface",
            enforce_detection=True
        )[0]["embedding"]

        os.remove(temp_img_path)

        best_match = None
        best_distance = float("inf")

        for doc in face_collection.find({"username": username}):
            enrolled_embedding = doc.get("embedding")
            if not enrolled_embedding:
                continue
            dist = cosine(input_embedding, enrolled_embedding)
            if dist < best_distance:
                best_distance = dist
                best_match = doc["person"]

        if best_distance > 0.6:
            return jsonify({"matched": False})

        return jsonify({
            "matched": True,
            "identity": best_match,
            "distance": best_distance
        })

    except Exception as e:
        print("[VERIFY ERROR]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/enroll-folder", methods=["POST"])
def enroll_folder():
    data = request.get_json()
    username = data.get("username")
    images = data.get("images")
    
    if not username or not isinstance(images, list):
        return jsonify({"error": "Invalid input"}), 400
    
    if not images:
        return jsonify({"error": "No images provided"}), 400

    try:
        first_image = images[0]
        name = first_image["name"]
        parts = name.split("/")
        person_name = parts[-2] if len(parts) > 1 else "unknown"

        face_collection.delete_many({"person": person_name, "username": username})

        for img in images:
            file_name = f"temp_{uuid.uuid4().hex}.jpg"
            temp_path = os.path.join(TEMP_DB_PATH, file_name)
            save_base64_to_image(img["base64"], temp_path)

            embedding = DeepFace.represent(
                img_path=temp_path,
                model_name="Facenet512",
                detector_backend="retinaface",
                enforce_detection=True
            )[0]["embedding"]

            os.remove(temp_path)

            face_collection.insert_one({
                "username": username,
                "person": person_name,
                "filename": img["name"],
                "base64": img["base64"],
                "embedding": embedding
            })

        return jsonify({"message": f"{person_name} enrolled with {len(images)} images."})
    except Exception as e:
        print("[ENROLL ERROR]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/folders", methods=["GET"])
def list_folders():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Missing username"}), 400

    try:
        folders = face_collection.distinct("person", {"username": username})
        return jsonify({"folders": folders})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/delete-folder/<folder_name>", methods=["DELETE"])
def delete_folder(folder_name):
    try:
        result = face_collection.delete_many({"person": folder_name})
        return jsonify({"message": f"Deleted folder '{folder_name}' with {result.deleted_count} images."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)