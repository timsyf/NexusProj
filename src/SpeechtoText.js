import React, { useState, useEffect } from "react";
import { Button, Container, Row, Col, Form, Card } from "react-bootstrap";
import jsPDF from "jspdf";

function SpeechRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [summarizedText, setSummarizedText] = useState("");
  const [recognition, setRecognition] = useState(null);
  const [showExportButtons, setShowExportButtons] = useState(false);

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
    setTranscript("");
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
              content: "You are an assistant that summarizes long texts into concise summaries.",
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

  const handleSummarizeAndExport = async () => {
    const summary = await summarizeText(transcript);
    exportAsPDF(summary);
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
              content: "You are an assistant that corrects grammar and spelling mistakes in text.",
            },
            { role: "user", content: text },
          ],
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        const correctedText = data.choices[0].message.content;
        setTranscript(correctedText); // Update the transcript with corrected text
      } else {
        console.error("Failed to correct grammar and spelling.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
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
          </Row>

          <Row className="mb-3">
            <Col>
              <h5>Transcribed Text</h5>
              <Form.Control as="textarea" rows="4" value={transcript} readOnly />
            </Col>
          </Row>

          {showExportButtons && (
            <>
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
              </Row>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SpeechRecorder;
