import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Button, Card, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

const morseCodeMap = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
  G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
  M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
  5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
  " ": " / "
};

function textToMorse(text) {
  return text.toUpperCase().split("").map(char => morseCodeMap[char] || "").join(" ");
}

function playMorseAudio(morseCode, speed) {
  const unit = speed;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let time = audioCtx.currentTime;

  for (const symbol of morseCode) {
    if (symbol === ".") {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, time);
      osc.connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + unit / 1000);
      time += unit / 1000 + 0.05;
    } else if (symbol === "-") {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, time);
      osc.connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + 3 * unit / 1000);
      time += 3 * unit / 1000 + 0.05;
    } else if (symbol === " ") {
      time += unit / 1000;
    } else if (symbol === "/") {
      time += 7 * unit / 1000;
    }
  }
}

function MorseCode() {
  const [inputText, setInputText] = useState("");
  const [morseOutput, setMorseOutput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [audioURL, setAudioURL] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(150);
  const audioRef = useRef(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.lang = "en-US";
      recog.interimResults = false;
      recog.maxAlternatives = 1;
      recog.onresult = (event) => {
        const speech = event.results[0][0].transcript;
        setInputText(speech);
        const morse = textToMorse(speech);
        setMorseOutput(morse);
      };
      recog.onend = () => setIsListening(false);
      setRecognition(recog);
    } else {
      alert("Speech recognition not supported in this browser.");
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognition) return;
    setIsListening(true);
    recognition.start();
  };

  const handleReadAloud = async () => {
    if (!inputText.trim()) {
      setError("Text input is empty. Please enter text before reading aloud.");
      return;
    }
    setError("");

    if (isReadingAloud && audioRef.current) {
      audioRef.current.pause();
      setIsReadingAloud(false);
      return;
    }

    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: selectedVoice,
          input: inputText,
          response_format: "mp3",
        }),
      });

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioURL(url);

      const audio = new Audio(url);
      audioRef.current = audio;

      setIsReadingAloud(true);
      audio.onended = () => setIsReadingAloud(false);
      audio.play();
    } catch (err) {
      console.error("TTS API error:", err);
      navigate("/service-unavailable");
    }
  };

  const handleDownloadMorseTxt = () => {
    const blob = new Blob([morseOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "morse_code.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAudio = () => {
    if (!audioURL) return;
    const a = document.createElement("a");
    a.href = audioURL;
    a.download = "tts.mp3";
    a.click();
    URL.revokeObjectURL(audioURL);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isInputFocused) return;
      switch (e.key) {
        case "1":
          setMorseOutput(textToMorse(inputText));
          break;
        case "2":
          playMorseAudio(morseOutput, playbackSpeed);
          break;
        case "3":
          handleReadAloud();
          break;
        case "4":
          if (!isListening) handleVoiceInput();
          break;
        case "5":
          handleDownloadAudio();
          break;
        case "6":
          handleDownloadMorseTxt();
          break;
        case "7": // speed down (faster)
          setPlaybackSpeed((prev) => Math.max(50, prev - 10));
          break;
        case "8": // speed up (slower)
          setPlaybackSpeed((prev) => Math.min(300, prev + 10));
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputText, morseOutput, isListening, isInputFocused, isReadingAloud, recognition, playbackSpeed, audioURL]);

  return (
    <Container className="d-flex justify-content-center align-items-center mt-4">
      <Row className="w-100">
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header as="h3" className="text-center">
              Text/Voice to Morse Code with Audio
            </Card.Header>
            <Card.Body className="text-center">
              {error && (
                <div className="mt-3">
                  <div className="alert alert-danger text-center">
                    <strong>Error:</strong> {error}
                  </div>
                </div>
              )}
              <Form.Group controlId="textInput">
                <Form.Label>Enter or Speak Text</Form.Label>
                <Form.Control
                  type="text"
                  value={inputText}
                  onChange={(e) => {
                    const value = e.target.value;
                    setInputText(value);
                    setMorseOutput(textToMorse(value));
                  }}
                  placeholder="Type something or use voice..."
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                />
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Select Voice</Form.Label>
                <Form.Select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-50 mx-auto"
                >
                  <option value="nova">Nova</option>
                  <option value="alloy">Alloy</option>
                  <option value="ash">Ash</option>
                  <option value="ballad">Ballad</option>
                  <option value="coral">Coral</option>
                  <option value="echo">Echo</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="sage">Sage</option>
                  <option value="shimmer">Shimmer</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Morse Audio Speed: {playbackSpeed}ms (7/8)</Form.Label>
                <Form.Range
                  min={50}
                  max={300}
                  step={10}
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                />
              </Form.Group>
              <div className="mt-3">
                <Button
                  onClick={() => {
                    if (!inputText.trim()) {
                      setError("Text input is empty. Please enter text before playing Morse.");
                      return;
                    }
                    setError("");
                    playMorseAudio(morseOutput, playbackSpeed);
                  }}
                  variant="success"
                  className="me-2"
                >
                  Play Morse (2)
                </Button>
                <Button onClick={handleReadAloud} variant="warning" className="me-2">
                  {isReadingAloud ? "Pause" : "Read Aloud (3)"}
                </Button>
                <Button onClick={handleVoiceInput} variant="info" disabled={isListening}>
                  {isListening ? "Listening..." : "Speak (4)"}
                </Button>
              </div>

              <div className="mt-3">
                <Button onClick={handleDownloadAudio} variant="dark" className="me-2" disabled={!audioURL}>
                  Download Audio (5)
                </Button>
                <Button onClick={handleDownloadMorseTxt} variant="secondary" className="me-2" disabled={!morseOutput}>
                  Download Morse (6)
                </Button>
              </div>

              <Card className="mt-4">
                <Card.Body>
                  <h5>Morse Code Output:</h5>
                  <p className="text-monospace">{morseOutput || "No output yet"}</p>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default MorseCode;
