import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Button, Form, Card } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Home() {
  const [responseText, setResponseText] = useState("");
    const [prompt, setPrompt] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [apiCallEnabled, setApiCallEnabled] = useState(true);
  const [apiPort, setApiPort] = useState("3001");
  const [apiRoute, setApiRoute] = useState("analyzed");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const predefinedPrompts = [
    "Is there anyone wearing a medical mask?",
    "Is there any fire?",
    "Is there any towels?",
  ];

  useEffect(() => {
    let stream;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleAnalysisTrigger = async (resultText, base64Image) => {
    try {
      const res = await fetch(`http://localhost:${apiPort}/api/${apiRoute}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          result: resultText,
          image: base64Image,
        }),
      });
      const result = await res.json();
      console.log("Triggered follow-up API:", result);
    } catch (err) {
      console.error("Follow-up API call failed:", err);
    }
  };

  const captureImageAndAnalyze = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL("image/jpeg");
      setCapturedImage(base64Image);
      const imageData = base64Image.split(",")[1];

      const predictionKey = process.env.REACT_APP_API_KEY;
      const apiKey = predictionKey;

      const strictPrompt = `Respond with only a single word: Yes or No. ${prompt || "Is there something in this image?"}`;

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
              model: "gpt-4o",
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: strictPrompt },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:image/jpeg;base64,${imageData}`,
                      },
                    },
                  ],
                },
              ],
            }),
          }
        );

        const data = await response.json();
        let resultText = data.choices[0]?.message?.content || "No response";

        // Normalize response to just Yes or No
        let cleaned = resultText.trim().toLowerCase();
        if (cleaned.includes("yes")) cleaned = "Yes";
        else if (cleaned.includes("no")) cleaned = "No";
        else cleaned = "Unclear";

        setResponseText(cleaned);

        

        setResponseText(cleaned);

        if (apiCallEnabled) {
          await handleAnalysisTrigger(cleaned, base64Image);
        }
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
    <Container className="py-4">
      <Row>
        <Col md={8} className="mb-4">
          <Card>
            <Card.Header as="h3" className="text-center">
              Hazard Detector
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
              <Form.Group className="mb-3">
                <Form.Label>API Port</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="3001"
                  value={apiPort}
                  onChange={(e) => setApiPort(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>API Route</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="analyzed"
                  value={apiRoute}
                  onChange={(e) => setApiRoute(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="api-call-toggle"
                  label="Enable API Call"
                  checked={apiCallEnabled}
                  onChange={() => setApiCallEnabled(!apiCallEnabled)}
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
                  variant={prompt === text ? "secondary" : "outline-secondary"}
                  onClick={() => setPromptFromButton(text)}
                  className="w-100 mb-2"
                >
                  {text}
                </Button>
              ))}
            </Card.Body>
          </Card>
          <br />
          <Card>
            <Card.Header as="h5" className="text-center">
              Captured Image
            </Card.Header>
            <Card.Body>
              {capturedImage && (
                <div className="mt-3">
                  <img
                    src={capturedImage}
                    alt="Captured Preview"
                    className="img-fluid border mt-2 rounded"
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
