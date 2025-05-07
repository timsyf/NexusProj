// TranslatorWithOpenAI.jsx
import React, { useState, useRef, useEffect } from "react";
import { Button, Container, Row, Col, Form, Card, Spinner } from "react-bootstrap";

function TranslatorWithOpenAI() {
  const [audioFile, setAudioFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState("");
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("zh");
  const [fromLanguage, setFromLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [autoReadAloud, setAutoReadAloud] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [showUpload, setShowUpload] = useState(false);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const transcribingRef = useRef(false);
  const audioRef = useRef(null);

  const languages = [
    { code: "en", name: "English" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "ko", name: "Korean" },
    { code: "ru", name: "Russian" },
  ];

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    setError("");
    setAudioFile(file);
    handleTranscribeAndTranslate(file);
  };

  const handleStartRecording = async () => {
    setTranscript("");
    setTranslatedText("");
    recordedChunksRef.current = [];
    setAudioFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        recordedChunksRef.current = [...recordedChunksRef.current];
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: "audio/webm" });
        setAudioFile(file);
        handleTranscribeAndTranslate(file);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not supported.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribeAndTranslate = async (file = audioFile) => {
    if (transcribingRef.current) return;
    if (!file || !(file instanceof File)) {
      alert("Please upload or record an audio file first.");
      return;
    }
    transcribingRef.current = true;
    setLoading(true);
    setTranscript("");
    setTranslatedText("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "whisper-1");
      formData.append("language", fromLanguage);

      const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
        },
        body: formData,
      });

      if (!whisperRes.ok) {
        const errorData = await whisperRes.json();
        throw new Error(errorData.error?.message || "Whisper transcription failed.");
      }

      const whisperData = await whisperRes.json();
      const text = whisperData.text;
      if (!text) throw new Error("No transcription returned.");
      setTranscript(text);

      const translateRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `Translate this from ${fromLanguage} to ${selectedLanguage} only.`,
            },
            { role: "user", content: text },
          ],
        }),
      });

      if (!translateRes.ok) {
        const errorData = await translateRes.json();
        throw new Error(errorData.error?.message || "Translation failed.");
      }

      const translateData = await translateRes.json();
      const translated = translateData.choices?.[0]?.message?.content?.trim();
      if (!translated) throw new Error("No translation returned.");
      setTranslatedText(translated);

      if (autoReadAloud) {
        await handleReadAloud(translated);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to transcribe or translate.");
    } finally {
      setLoading(false);
      transcribingRef.current = false;
      setAudioFile(null);
    }
  };

  const handleReadAloud = async (textToRead = translatedText) => {
    if (!textToRead) return;

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
          voice: selectedVoice === "auto" ? "nova" : selectedVoice,
          input: textToRead,
          response_format: "mp3",
        }),
      });

      if (!response.ok) throw new Error("TTS generation failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setIsReadingAloud(true);

      audio.onended = () => setIsReadingAloud(false);
      audio.play();
    } catch (error) {
      console.error("Error during TTS playback:", error);
      alert("Text-to-speech failed. Please try again.");
    }
  };

  return (
    <Container className="pt-4">
      <Card>
        <Card.Header as="h3" className="text-center">
          Translator
        </Card.Header>
        <Card.Body>
          {error && (
            <Row className="mb-3">
              <Col>
                <div className="alert alert-danger text-center">{error}</div>
              </Col>
            </Row>
          )}
          <Row className="mb-3">
            <Col>
              {showUpload && (
                <Form.Group>
                  <Form.Label>Upload Audio File (e.g., MP3/WAV)</Form.Label>
                  <Form.Control type="file" accept="audio/*" onChange={handleAudioUpload} />
                </Form.Group>
              )}
              <div className="mt-2">
                <Button onClick={() => setShowUpload(!showUpload)} variant="info" className="me-2">
                  {showUpload ? "Cancel Upload" : "Upload Audio File"}
                </Button>
                {!showUpload && (
                  <Button onClick={isRecording ? handleStopRecording : handleStartRecording} variant={isRecording ? "danger" : "secondary"}>
                    {isRecording ? "Stop Recording" : "Record from Microphone"}
                  </Button>
                )}
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>From Language</Form.Label>
                <Form.Control as="select" value={fromLanguage} onChange={(e) => setFromLanguage(e.target.value)}>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>To Language</Form.Label>
                <Form.Control as="select" value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          

          <Row className="mb-3">
            <Col>
              <h5>Transcript</h5>
              <Form.Control as="textarea" rows={3} value={transcript} readOnly />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <h5>Translated Text</h5>
              <Form.Control as="textarea" rows={3} value={translatedText} readOnly />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Voice</Form.Label>
                <Form.Control as="select" value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)}>
                  {["nova", "alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "sage", "shimmer"].map((voice) => (
                    <option key={voice} value={voice}>{voice}</option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Check
                type="switch"
                id="auto-read-switch"
                label="Auto Read Aloud"
                checked={autoReadAloud}
                onChange={(e) => setAutoReadAloud(e.target.checked)}
              />
            </Col>
          </Row>

          {!autoReadAloud && (
            <Row>
              <Col>
                <Button onClick={() => handleReadAloud()} variant={isReadingAloud ? "warning" : "success"} disabled={!translatedText}>
                  {isReadingAloud ? "Stop Reading" : "Read"}
                </Button>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default TranslatorWithOpenAI;
