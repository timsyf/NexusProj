import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Card, Alert, Form } from "react-bootstrap";

function RealTimeSubtitles() {
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimer = useRef(null);
  const translationTimer = useRef(null);

  const [subtitles, setSubtitles] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Start webcam
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => setError("Webcam access denied."));

    // Set up speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Always show current speech (interim or final)
      setSubtitles(finalTranscript || interimTranscript);

      // Only trigger translation for finalized text
      if (finalTranscript) {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        if (translationTimer.current) clearTimeout(translationTimer.current);

        // Clear subtitle after 5s of silence
        silenceTimer.current = setTimeout(() => setSubtitles(""), 5000);

        // Translate after 2s of silence
        translationTimer.current = setTimeout(() => {
          translateText(finalTranscript);
        }, 2000);
      }
    };

    recognition.onerror = (e) => {
      setError("Speech recognition error: " + e.error);
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      clearTimeout(silenceTimer.current);
      clearTimeout(translationTimer.current);
    };
  }, []);

  const translateText = async (text) => {
    if (!text.trim()) return;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "Translate the following English text to simplified Chinese. Output only the translation.",
            },
            {
              role: "user",
              content: text,
            },
          ],
        }),
      });

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content?.trim();
      setTranslatedText(result || "Translation failed.");
    } catch (err) {
      console.error("Translation error:", err);
      setTranslatedText("Error during translation.");
    }
  };

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card>
            <Card.Header as="h3" className="text-center">Real Time Subtitles with Translation</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                width="100%"
                className="rounded border mb-3"
              />

              <div
                style={{
                  backgroundColor: "#000",
                  color: "#0f0",
                  padding: "12px",
                  minHeight: "40px",
                  fontFamily: "monospace",
                  fontSize: "18px",
                  borderRadius: "5px",
                }}
              >
                {subtitles || "(Start speaking...)"}
              </div>

              <Form.Group className="mt-3">
                <Form.Label>Translated (Chinese):</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={translatedText}
                  readOnly
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RealTimeSubtitles;
