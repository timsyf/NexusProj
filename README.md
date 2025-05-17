# Nexus: A Scalable Platform for Accessible AI Solutions

Nexus is a **modular full-stack AI platform** that integrates multiple intelligent tools into a unified web interface. Built with **React**, **Flask**, and **MongoDB**, it allows users to interact with advanced AI services like image generation, face verification, speech processing, object detection, translation, and more — all from a single application.

---

## Key Features

- **Face Verification** – Live or uploaded face comparison using DeepFace
- **Subtitle Generator** – Video-to-subtitle creation using Whisper & ffmpeg
- **Hazard Detection** – Image analysis with GPT-4 Vision
- **Debate Assistant** – Conversational debate generator with voice input/output
- **Image Generation** – Prompt-based image creation via DALL·E
- **Speech-to-Text & Translator** – Real-time transcription, translation & TTS
- **Morse Code Generator** – Text/audio Morse code conversion with playback
- **Object Detection** – Webcam-based object recognition with Azure Custom Vision

---

## Tech Stack
 
| Layer     | Technology                                                   |
|-----------|--------------------------------------------------------------|
| Frontend  | React, Bootstrap                                             |
| Backend   | Flask (Python)                                               |
| Database  | MongoDB (Atlas)                                              |
| AI APIs   | OpenAI (GPT, Whisper, DALL·E), DeepFace, Azure Custom Vision |

---

## Installation Guide

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB
- Open ports: `3000` and `3001`

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/timsyf/NexusProj.git
   cd NexusProj
   ```

2. **Create environment variables in `src/.env`:**
   ```env
   REACT_APP_API_KEY=your_openai_key
   REACT_APP_PREDICTION_KEY=azure_prediction_key
   REACT_APP_PREDICTION_ENDPOINT=https://region.api.cognitive.microsoft.com/
   REACT_APP_PROJECT_ID=your_custom_vision_project_id
   REACT_APP_PUBLISH_ITERATION_NAME=Iteration1
   MONGO_URI=your_mongodb_uri
   SECRET_KEY=your_flask_secret_key
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   python install_ffmpeg.py
   ```

4. **Install Node dependencies:**
   ```bash
   npm install
   ```

5. **Run the application:**
   ```bash
   npm start           # in one terminal
   python app.py       # in another terminal
   ```

---

## Testing

Modules have been manually tested for:

- Functional correctness (e.g., Face match, Transcription)
- Edge case handling (e.g., empty input, invalid files)
- Responsiveness & real-time interaction

---

## Security Highlights

- JWT-based authentication for secure sessions
- Passwords hashed using `scrypt`
- Input validation at both client and server
- API keys managed securely via `.env`

---

## Future Roadmap

- Real-time collaboration
- Role-based access control
- Mobile app version
- Custom model training integration

---

## License

> This project is for **educational purposes** only and is **not yet licensed** for commercial use.

---
