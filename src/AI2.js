import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Card,
  Spinner,
  Alert,
} from "react-bootstrap";

function AI() {
  const [userInput, setUserInput] = useState("");
  const [imageResponse, setImageResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!userInput.trim()) {
      setError("Please enter a valid prompt.");
      return;
    }

    setLoading(true);
    setError("");
    const predictionKey = process.env.REACT_APP_API_KEY;
    const apiKey = predictionKey;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: userInput.trim(),
            n: 1,
            size: "1024x1024",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error?.message || "Failed to generate image");
        return;
      }

      const data = await response.json();
      if (data.data && data.data[0]) {
        setImageResponse(data.data[0].url);
      } else {
        setImageResponse(null);
        setError("No image generated. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid="md" className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <h1 className="text-center mb-4">Image Generator</h1>
              <Form>
                <Form.Group controlId="userInput">
                  <Form.Control
                    as="textarea"
                    placeholder="Enter your prompt here"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    rows={5}
                    isInvalid={error}
                    className="mb-3"
                  />
                  <Form.Control.Feedback type="invalid">
                    {error}
                  </Form.Control.Feedback>
                </Form.Group>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Generate Image"
                  )}
                </Button>
              </Form>
              {imageResponse && (
                <div className="mt-4">
                  <h3 className="text-center">Generated Image:</h3>
                  <div className="text-center">
                    <img
                      src={imageResponse}
                      alt="Generated"
                      className="img-fluid rounded shadow-sm"
                      style={{ maxWidth: "100%", maxHeight: "auto" }}
                    />
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AI;
