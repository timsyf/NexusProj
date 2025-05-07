// SpeechRecorder with Whisper API + OpenAI TTS + Grammar Correction & Translation
import React, { useState, useRef } from "react";
import { Button, Container, Row, Col, Form, Card, Spinner, Alert } from "react-bootstrap";

function SpeechRecorder() {
  const [transcript, setTranscript] = useState("");
  const [summarizedText, setSummarizedText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [loadingButton, setLoadingButton] = useState("");
  const [error, setError] = useState("");

  const audioRef = useRef(null);

  const languageOptions = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "ru", name: "Russian" },
    { code: "pt", name: "Portuguese" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" },
    { code: "it", name: "Italian" },
    { code: "th", name: "Thai" },
    { code: "id", name: "Indonesian" }
  ];

  const handleStartRecording = async () => {
    setTranscript("");
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");
      formData.append("model", "whisper-1");

      try {
        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_API_KEY}`
          },
          body: formData
        });

        const data = await response.json();
        setTranscript(data.text || "");
      } catch (err) {
        console.error("Whisper API error:", err);
      }
    };

    recorder.start();
    setMediaRecorder(recorder);
    setAudioChunks(chunks);
    setIsRecording(true);
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const exportAsPDF = (text) => {
    if (!transcript.trim()) {
      setError("Transcript is empty. Please record something first.");
      return;
    }
    setError("");
    setLoadingButton("export");
    const printWindow = window.open('', '_blank');
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Exported PDF</title>
          <style>
            @media print {
              @page { margin: 20mm; size: A4; }
              body { margin: 0; font-family: 'Arial', sans-serif; font-size: 14pt; line-height: 1.6; }
            }
            body {
              font-family: 'Arial', sans-serif;
              padding: 30px;
              white-space: pre-wrap;
              word-break: break-word;
              font-size: 14pt;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>${escapedText}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setLoadingButton("");
  };

  const summarizeText = async (text) => {
    if (!transcript.trim()) {
      setError("Transcript is empty. Please record something first.");
      return;
    }
    setError("");
    setLoadingButton("summary");
    const apiKey = process.env.REACT_APP_API_KEY;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Summarize this." },
          { role: "user", content: text },
        ],
      }),
    });
    const data = await response.json();
    setSummarizedText(data.choices[0].message.content);
    setLoadingButton("");
    return data.choices[0].message.content;
  };

  const correctGrammar = async () => {
    if (!transcript.trim()) {
      setError("Transcript is empty. Please record something first.");
      return;
    }
    setError("");
    setLoadingButton("grammar");
    const apiKey = process.env.REACT_APP_API_KEY;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Correct the grammar, punctuation, and anything else you can find." },
          { role: "user", content: transcript },
        ],
      }),
    });
    const data = await response.json();
    setTranscript(data.choices[0].message.content);
    setLoadingButton("");
  };

  const translateText = async () => {
    if (!transcript.trim()) {
      setError("Transcript is empty. Please record something first.");
      return;
    }
    setError("");
    setLoadingButton("translate");
    const apiKey = process.env.REACT_APP_API_KEY;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: `Translate this text to ${targetLanguage}` },
          { role: "user", content: transcript },
        ],
      }),
    });
    const data = await response.json();
    setTranscript(data.choices[0].message.content);
    setLoadingButton("");
  };

  const handleReadAloud = async () => {
    if (!transcript.trim()) {
      setError("Transcript is empty. Please record something first.");
      return;
    }
    setError("");
    if (isReadingAloud && audioRef.current) {
      audioRef.current.pause();
      setIsReadingAloud(false);
      return;
    }

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

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    setIsReadingAloud(true);
    audio.onended = () => setIsReadingAloud(false);
    audio.play();
  };

  return (
    <Container className="pt-4">
      <Card>
        <Card.Header as="h3" className="text-center">
          Speech Recorder
        </Card.Header>
        <Card.Body>
          <Row className="mb-3 justify-content-center">
            {error && (
              <Alert variant="danger">
                <strong>Error:</strong> {error}
              </Alert>
            )}
            <Col xs="auto">
              {isRecording ? (
                <Button onClick={handleStopRecording} variant="danger">
                  Stop Recording
                </Button>
              ) : (
                <Button onClick={handleStartRecording} variant="success">
                  Start Recording
                </Button>
              )}
            </Col>
          </Row>
          <Row className="mb-3">
            <Col>
              <h5>Transcribed Text</h5>
              <Form.Control as="textarea" rows="4" value={transcript} readOnly />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs="auto">
              <Button onClick={correctGrammar} variant="primary" disabled={loadingButton === "grammar"}>
                {loadingButton === "grammar" ? <Spinner size="sm" animation="border" /> : "Correct Grammar"}
              </Button>
            </Col>
            <Col xs="auto">
              <Button onClick={translateText} variant="secondary" disabled={loadingButton === "translate"}>
                {loadingButton === "translate" ? <Spinner size="sm" animation="border" /> : "Translate"}
              </Button>
            </Col>
            <Col>
              <Form.Group>
                <Form.Control
                  as="select"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Voice</Form.Label>
                <Form.Control as="select" value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)}>
                  {["nova", "alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "sage", "shimmer"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs="auto">
              <Button onClick={handleReadAloud} variant="success">
                Read
              </Button>
            </Col>
            <Col xs="auto">
              <Button onClick={() => exportAsPDF(transcript)} variant="primary" disabled={loadingButton === "export"}>
                {loadingButton === "export" ? <Spinner size="sm" animation="border" /> : "Export"}
              </Button>
            </Col>
            <Col xs="auto">
              <Button
                onClick={async () => {
                  const summary = await summarizeText(transcript);
                      if (!transcript.trim()) {
                        return;
                      }
                      setError("");
                  const apiKey = process.env.REACT_APP_API_KEY;
                  const translationResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                      model: "gpt-4",
                      messages: [
                        { role: "system", content: `Translate this text to ${targetLanguage}` },
                        { role: "user", content: summary },
                      ],
                    }),
                  });
                  const translatedData = await translationResponse.json();
                  const translatedSummary = translatedData.choices[0].message.content;
                  exportAsPDF(translatedSummary);
                }}
                variant="secondary"
                disabled={loadingButton === "summary"}
              >
                {loadingButton === "summary" ? <Spinner size="sm" animation="border" /> : "Summary Export"}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SpeechRecorder;
