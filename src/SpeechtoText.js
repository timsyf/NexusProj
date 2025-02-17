// Updated SpeechRecorder.jsx with OpenAI TTS integration
import React, { useState, useEffect, useRef } from "react";
import { Button, Container, Row, Col, Form, Card } from "react-bootstrap";
import jsPDF from "jspdf";

function SpeechRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [summarizedText, setSummarizedText] = useState("");
  const [recognition, setRecognition] = useState(null);
  const [showExportButtons, setShowExportButtons] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const audioRef = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onresult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript((prev) => prev + finalTranscript);
    };

    recognitionInstance.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    setRecognition(recognitionInstance);
  }, []);

  const handleStartRecording = () => {
    recognition.start();
    setIsRecording(true);
    setShowExportButtons(false);
  };

  const handleStopRecording = () => {
    recognition.stop();
    setIsRecording(false);
    setShowExportButtons(true);
  };

  const exportAsPDF = (text) => {
    const doc = new jsPDF();
    const margin = 10;
    const pageWidth = doc.internal.pageSize.width;

    doc.setFont("courier");
    doc.setFontSize(10);

    doc.text(text, margin, margin, {
      maxWidth: pageWidth - 2 * margin,
    });

    doc.save("transcription.pdf");
  };

  const summarizeText = async (text) => {
    const apiKey = process.env.REACT_APP_API_KEY;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Summarize the following text in a single, concise paragraph. Only return the summary without any introductions or additional remarks.",
            },
            { role: "user", content: text },
          ],
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        const summary = data.choices[0].message.content;
        setSummarizedText(summary);
        return summary;
      } else {
        console.error("failed to summarize text.");
        return "failed to summarize the text.";
      }
    } catch (error) {
      console.error("Error:", error);
      return "An error occurred while summarizing.";
    }
  };

  const correctGrammarAndSpelling = async (text) => {
    const apiKey = process.env.REACT_APP_API_KEY;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Correct the grammar and spelling in the following text. Only return the corrected version without explanations or extra commentary.",
            },
            { role: "user", content: text },
          ],
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        const correctedText = data.choices[0].message.content;
        setTranscript(correctedText);
      } else {
        console.error("Failed to correct grammar and spelling.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleReadAloud = async () => {
    if (!transcript) return;

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
          input: transcript,
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
    }
  };

  const handleSummarizeAndExport = async () => {
    if (transcript.trim().split(/\s+/).length <= 50) {
      alert("Please provide more than 50 words to summarize.");
      return;
    }
    const summary = await summarizeText(transcript);
    exportAsPDF(summary);
  };

  return (
    <Container style={{ paddingTop: "20px" }}>
      <Card>
        <Card.Body>
          <Card.Title className="text-center">Speech Recorder</Card.Title>

          <Row className="mb-3 justify-content-center">
          <Col xs="auto">
            {isRecording ? (
                <Button onClick={handleStopRecording} variant="danger" size="lg">
                  Stop Recording
                </Button>
              ) : (
                <Button onClick={handleStartRecording} variant="success" size="lg">
                  Start Recording
                </Button>
              )}
            </Col>
          <Col xs="auto">
            <Button onClick={() => setTranscript("")} variant="secondary" size="lg">
              Clear Text
            </Button>
          </Col>
        </Row>

          <Row className="mb-3">
            <Col>
              <h5>Transcribed Text</h5>
              <Form.Control as="textarea" rows="4" value={transcript} readOnly />
            </Col>
          </Row>

          {showExportButtons && (
            <>
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
              <Row className="justify-content-center">
                <Col xs="auto">
                  <Button onClick={() => exportAsPDF(transcript)} variant="primary" size="lg">
                    PDF
                  </Button>
                </Col>
                <Col xs="auto">
                  <Button onClick={handleSummarizeAndExport} variant="primary" size="lg">
                    Summarized PDF
                  </Button>
                </Col>
                <Col xs="auto">
                  <Button onClick={() => correctGrammarAndSpelling(transcript)} variant="primary" size="lg">
                    Correct Grammar & Spelling
                  </Button>
                </Col>
                <Col xs="auto">
                  <Button onClick={handleReadAloud} variant={isReadingAloud ? "warning" : "success"} size="lg">
                    {isReadingAloud ? "Stop Reading" : "Read Aloud"}
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SpeechRecorder;