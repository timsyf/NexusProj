import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Button, Form, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Home() {
  const [responseText, setResponseText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startStopRecording = () => {
    setIsRecording((prev) => !prev);
  };

  useEffect(() => {
    if (isRecording) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing webcam:", err);
        });
    } else {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isRecording]);

  const captureImageAndAnalyze = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg").split(",")[1];

      const predictionKey = process.env.REACT_APP_API_KEY;
      const apiKey = predictionKey;

      try {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "What is this sign language gesture?",
                    },
                    {
                      type: "image_url",
                      image_url: { url: `data:image/jpeg;base64,${imageData}` },
                    },
                  ],
                },
              ],
            }),
          }
        );

        const data = await response.json();
        setResponseText(data.choices[0].message.content);
      } catch (err) {
        console.error("Error analyzing image:", err);
        setResponseText("An error occurred while analyzing the image.");
      }
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center">
      <Row className="w-100">
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header as="h3" className="text-center">
              Sign Language Decipher
            </Card.Header>
            <Card.Body>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                width="100%"
                height="auto"
                className="mb-3 rounded"
                style={{ border: "1px solid #dee2e6" }}
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                style={{ display: "none" }}
              />

              <div className="d-flex justify-content-center gap-2">
                <Button
                  variant={isRecording ? "danger" : "success"}
                  onClick={startStopRecording}
                >
                  {isRecording ? "Stop" : "Start"}
                </Button>
                <Button variant="primary" onClick={captureImageAndAnalyze}>
                  Analyze Sign Language
                </Button>
              </div>

              {responseText && (
                <Card.Text className="mt-3">
                  <strong>Decoded Sign Language:</strong> {responseText}
                </Card.Text>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
