import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Button, Form, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Home() {
  const [responseText, setResponseText] = useState("");
  const [prompt, setPrompt] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const predefinedPrompts = [
    "Do you see a person wearing a mask in this picture? Yes or No",
    "Is everyone wearing a safety helmet? Yes or No",
    "How many people are there in this picture?",
    "Is there any fire in this picture? Yes or No",
  ];

  useEffect(() => {
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

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

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
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
                  { type: "text", text: prompt || "What is in this image?" },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageData}` } },
                ],
              },
            ],
          }),
        });

        const data = await response.json();
        setResponseText(data.choices[0].message.content);
      } catch (err) {
        console.error("Error analyzing image:", err);
        setResponseText("An error occurred while analyzing the image.");
      }
    }
  };

  const setPromptFromButton = (text) => {
    setPrompt(text);
  };

  return (
    <Container className="py-5">
      <Row>
        <Col md={8} className="mb-4">
          <Card>
            <Card.Header as="h3" className="text-center">
              Image Analyzer
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
              <Form.Group className="mb-3">
                <Form.Label>Custom Prompt</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Enter your custom prompt here"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </Form.Group>
              <Button variant="primary" onClick={captureImageAndAnalyze} block>
                Analyze Image
              </Button>
              {responseText && (
                <Card.Text className="mt-3">
                  <strong>Response:</strong> {responseText}
                </Card.Text>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header as="h5" className="text-center">
              Predefined Prompts
            </Card.Header>
            <Card.Body>
              {predefinedPrompts.map((text, index) => (
                <Button
                  key={index}
                  variant="outline-secondary"
                  onClick={() => setPromptFromButton(text)}
                  className="w-100 mb-2"
                >
                  {text}
                </Button>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
