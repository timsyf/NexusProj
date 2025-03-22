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
  const [imageCount, setImageCount] = useState(1);
  const [imageSize, setImageSize] = useState("1024x1024");
  const [imageResponses, setImageResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!userInput.trim()) {
      setError("Please enter a valid prompt.");
      return;
    }

    const apiKey = process.env.REACT_APP_API_KEY;
    if (!apiKey) {
      setError("Missing API key. Please configure REACT_APP_API_KEY.");
      return;
    }

    setLoading(true);
    setError("");
    setImageResponses([]);

    try {
      const newImageUrls = [];

      for (let i = 0; i < imageCount; i++) {
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
              size: imageSize,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to generate image.");
        }

        const data = await response.json();
        const imageUrl = data?.data?.[0]?.url;
        if (imageUrl) {
          newImageUrls.push(imageUrl);
        }
      }

      setImageResponses(newImageUrls);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!userInput.trim()) {
      setError("Please enter a raw idea to enhance.");
      return;
    }

    const apiKey = process.env.REACT_APP_API_KEY;
    if (!apiKey) {
      setError("Missing API key. Please configure REACT_APP_API_KEY.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an expert at writing detailed visual prompts for AI image generation tools like DALL·E. Enhance user prompts to be vivid, specific, and imaginative.",
            },
            {
              role: "user",
              content: `Enhance this prompt for an image generation AI: \"${userInput}\"`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to enhance prompt.");
      }

      const data = await response.json();
      const enhanced = data.choices?.[0]?.message?.content?.trim();

      if (enhanced) {
        setUserInput(enhanced);
      } else {
        setError("No enhancement returned. Try again.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unexpected error during prompt enhancement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid="md" className="py-4">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Header as="h3" className="text-center">
              Image Generator
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" className="text-center">
                  {error}
                </Alert>
              )}

              <Form>
                <Form.Group className="mb-3" controlId="userInput">
                  <Form.Control
                    as="textarea"
                    placeholder="Enter your prompt here"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    rows={5}
                  />
                </Form.Group>

                <Button
                  variant="outline-secondary"
                  onClick={handleEnhancePrompt}
                  disabled={loading}
                  className="w-100 mb-3"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" /> Enhancing Prompt...
                    </>
                  ) : (
                    "Enhance with ChatGPT"
                  )}
                </Button>

                <Form.Group className="mb-3" controlId="imageCount">
                  <Form.Label>Number of images</Form.Label>
                  <Form.Select
                    value={imageCount}
                    onChange={(e) => setImageCount(Number(e.target.value))}
                  >
                    <option value={1}>1 image</option>
                    <option value={2}>2 images</option>
                    <option value={3}>3 images</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="imageSize">
                  <Form.Label>Image size</Form.Label>
                  <Form.Select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                  >
                    <option value="1024x1024">Square (1024x1024)</option>
                    <option value="1024x1792">Portrait (1024x1792)</option>
                    <option value="1792x1024">Landscape (1792x1024)</option>
                  </Form.Select>
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" /> Generating...
                    </>
                  ) : (
                    "Generate Image(s)"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {imageResponses.length > 0 && (
        <Row className="justify-content-center mt-4">
          <Col md={10}>
            <h3 className="text-center mb-3">
              Generated Image{imageResponses.length > 1 ? "s" : ""}
            </h3>
            <Row>
              {imageResponses.map((url, index) => (
                <Col xs={12} md={6} lg={4} key={index} className="mb-4 text-center">
                  <img
                    src={url}
                    alt={`Generated ${index + 1}`}
                    className="img-fluid rounded shadow-sm mb-2"
                    style={{ maxWidth: "100%" }}
                  />
                  <div>
                    <a
                      href={url}
                      download={`image_${index + 1}.png`}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Download
                    </a>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default AI;