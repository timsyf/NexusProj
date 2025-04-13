from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import os
import shutil
from flask import Flask, request, jsonify
import speech_recognition as sr
import uuid
import ffmpeg
import traceback
from pydub import AudioSegment
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
import jwt
import datetime
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join("src", ".env"))

app = Flask(__name__)
CORS(app)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "defaultfallbackkey")

mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client["auth_db"]
users_collection = db["users"]

CHUNK_MS = 5000
FACE_DB = "./face_data"

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

@app.route("/verify", methods=["POST"])
def verify():
    img = request.files.get("image")
    if not img:
        return jsonify({"error": "No image provided"}), 400

    temp_path = "temp.jpg"
    img.save(temp_path)

    try:
        print("[INFO] Searching for matches in folder:", FACE_DB)

        result = DeepFace.find(
            img_path=temp_path,
            db_path=FACE_DB,
            model_name="Facenet512",
            detector_backend="retinaface",
            enforce_detection=True
        )

        os.remove(temp_path)

        if len(result[0]) == 0:
            print("[WARN] No match found.")
            return jsonify({"matched": False})

        top = result[0].iloc[0]
        identity = os.path.basename(top["identity"])
        distance = float(top["distance"])
        print(f"[MATCH] {identity} | Distance: {distance}")

        return jsonify({
            "matched": True,
            "identity": identity,
            "distance": distance
        })

    except Exception as e:
        print("[ERROR]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/enroll-folder", methods=["POST"])
def enroll_folder():
    files = request.files.getlist("images")
    if not files:
        return jsonify({"error": "No images received"}), 400

    try:
        first_filename = files[0].filename
        parts = first_filename.split("/")
        person_name = parts[-2] if len(parts) > 1 else "unknown"
    except Exception:
        return jsonify({"error": "Unable to determine identity name from file path"}), 400

    person_dir = os.path.join(FACE_DB, person_name)

    try:
        if os.path.exists(person_dir):
            shutil.rmtree(person_dir)
        os.makedirs(person_dir, exist_ok=True)

        for file in files:
            filename = os.path.basename(file.filename)
            save_path = os.path.join(person_dir, filename)
            file.save(save_path)

        print(f"[ENROLL] {len(files)} files saved under {person_name}")
        return jsonify({"message": f"{person_name} enrolled with {len(files)} images."})
    except Exception as e:
        print("[ERROR - ENROLL]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/folders", methods=["GET"])
def list_folders():
    try:
        folders = [
            name for name in os.listdir(FACE_DB)
            if os.path.isdir(os.path.join(FACE_DB, name))
        ]
        return jsonify({"folders": folders})
    except Exception as e:
        print("[ERROR - LIST FOLDERS]", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/delete-folder/<folder_name>", methods=["DELETE"])
def delete_folder(folder_name):
    folder_path = os.path.join(FACE_DB, folder_name)
    try:
        if os.path.exists(folder_path) and os.path.isdir(folder_path):
            shutil.rmtree(folder_path)
            print(f"[DELETE] Folder removed: {folder_name}")
            return jsonify({"message": f"Deleted folder '{folder_name}'."})
        else:
            return jsonify({"error": "Folder does not exist."}), 404
    except Exception as e:
        print("[ERROR - DELETE FOLDER]", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001)