from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import os
import shutil

app = Flask(__name__)
CORS(app)

FACE_DB = "./face_data"

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
        print("[DEBUG] Columns returned:", result[0].columns.tolist())

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

    # Derive person's name from first file path like face_data/timothy/image1.jpg
    first_filename = files[0].filename
    try:
        # Try to parse name from folder path
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
