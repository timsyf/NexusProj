# Hazard Detector
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

#@app.route('/api/analyzed', methods=['POST'])
@app.route('/api/object_detection', methods=['POST'])

def analyzed():
    data = request.get_json()
    print(f"Result: {data}")
    return jsonify({"status": "received", "message": "Analysis data received"}), 200

if __name__ == '__main__':
    app.run(port=3001, debug=True)