import React, { useRef, useState, useEffect } from "react";
import { Container, Row, Col, Button, Card, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Subtitle() {
  const videoRef = useRef(null);
  const [videoURL, setVideoURL] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validVideoTypes = ["video/mp4", "video/webm", "video/ogg"];
    if (!validVideoTypes.includes(file.type)) {
      setError("Unsupported file format. Please upload an MP4, WebM, or OGG video.");
      return;
    }

    setError(""); // clear any previous error
    const url = URL.createObjectURL(file);
    setVideoURL(url);
    setSubtitles([]);
    setCurrentSubtitle("");
    setLoading(true);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const res = await axios.post("http://localhost:5001/extract-audio-subtitles", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubtitles(res.data.subtitles);
    } catch (err) {
      console.error("Upload or transcription failed:", err);
      setError("Failed to process the video. Please try again with a valid file.");
      navigate("/service-unavailable");
    }

    setLoading(false);
  };

  // Display subtitle based on current time
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && subtitles.length > 0) {
        const currentTime = videoRef.current.currentTime;
        const current = subtitles.find(
          (s) => currentTime >= s.start && currentTime <= s.end
        );
        setCurrentSubtitle(current ? current.text : "");
      }
    }, 300);

    return () => clearInterval(interval);
  }, [subtitles]);

  return (
    <Container className="mt-4">
      <Row>
        <Col md={8} className="mx-auto">
          <Card>
            {error && (
              <div className="alert alert-danger text-center mt-3">
                <strong>Error:</strong> {error}
              </div>
            )}
            <Card.Header as="h3" className="text-center">
              Subtitles Generator
            </Card.Header>
            <Card.Body className="text-center">
              <Form.Group controlId="videoUpload" className="mb-3">
                <Form.Control type="file" accept="video/*" onChange={handleVideoUpload} />
              </Form.Group>

              {videoURL && (
                <>
                  <video
                    ref={videoRef}
                    src={videoURL}
                    width="100%"
                    className="mb-3"
                    controls={subtitles.length > 0}
                    onPlay={(e) => {
                      if (subtitles.length === 0) {
                        e.preventDefault();
                        e.target.pause();
                      }
                    }}
                    style={{ pointerEvents: subtitles.length > 0 ? "auto" : "none", opacity: subtitles.length > 0 ? 1 : 0.5 }}
                  />
                  <div
                    style={{
                      backgroundColor: "#222",
                      color: "#fff",
                      padding: "8px",
                      borderRadius: "4px",
                      minHeight: "40px",
                    }}
                  >
                    {currentSubtitle || "(No subtitle)"}
                  </div>
                </>
              )}

              {loading && <p className="mt-3">Processing video... This might take a minute.</p>}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Subtitle;