import React, { useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import AOS from "aos";
import "aos/dist/aos.css";

const services = [
  {
    title: "Object Detection",
    description: "Real-time detection for safety, retail, and automation scenarios.",
    image: "images/object_detection.png",
    path: "/OD",
  },
  {
    title: "Face Recognition",
    description: "Secure identity verification powered by DeepFace.",
    image: "images/face_recognition.png",
    path: "/FaceVerify",
  },
  {
    title: "Hazard Detector",
    description: "Detect fire, masks, or other safety-related conditions from live video.",
    image: "images/hazard_detector.png",
    path: "/HazardDetector",
  },
  {
    title: "Image Generator",
    description: "Turn your imagination into art using AI-powered image generation.",
    image: "images/image_generator.png",
    path: "/ImageGeneration",
  },
  {
    title: "Speech Recognition",
    description: "Speech-to-text, translation, and voice synthesis in one place.",
    image: "images/speech_tool.png",
    path: "/SpeechtoText",
  },
  {
    title: "Subtitle Generator",
    description: "Provide AI-powered subtitles for your videos.",
    image: "images/subtitle_generator.png",
    path: "/Subtitle",
  },
  {
    title: "Morse Code",
    description: "Convert between Morse code and text with audio playback options.",
    image: "images/morse_code.png",
    path: "/MorseCode",
  },
  {
    title: "Translator",
    description: "Translate between languages with speech and text input support.",
    image: "images/translator.png",
    path: "/Translator",
  },
  {
    title: "Debate",
    description: "Engage in AI-driven argument or discussion sessions interactively.",
    image: "images/debate.png",
    path: "/Debate",
  },
];

const Dashboard = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  return (
    <>
      <div
        style={{
          background: "linear-gradient(to right, #343a40)",
          color: "white",
          padding: "120px 20px",
          textAlign: "center",
        }}
      >
        <Container>
          <h1 className="display-3 fw-bold mb-3" data-aos="fade-down">Welcome to Nexus</h1>
          <p className="lead mb-4 fs-5" data-aos="fade-up">
            A unified platform for advanced AI services including object detection, face recognition, and creative generation.
          </p>
        </Container>
      </div>

      <Container className="py-5">
        <h2 className="text-center mb-5 fw-bold display-6" data-aos="fade-up">AI Services at Your Fingertips</h2>
        <Row xs={1} md={2} lg={3} className="g-5">
          {services.map((service, idx) => (
            <Col key={idx} data-aos="fade-up" data-aos-delay={idx * 100}>
              <Card className="shadow h-100 border-0 rounded-4 overflow-hidden hover-shadow">
                <div style={{ overflow: "hidden" }}>
                  <Card.Img
                    variant="top"
                    src={service.image}
                    alt={service.title}
                    className="img-fluid"
                    style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", transition: "transform 0.3s" }}
                    onMouseOver={e => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                  />
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fw-bold fs-4 text-primary">{service.title}</Card.Title>
                  <Card.Text className="text-muted flex-grow-1">
                    {service.description}
                  </Card.Text>
                  <Button
                    as={Link}
                    to={service.path}
                    variant="outline-primary"
                    className="mt-3 rounded-pill fw-semibold"
                  >
                    Launch
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      <div
        style={{
          background: "#495057", 
          color: "white",
          padding: "40px 20px",
        }}
      >
        <Container>
          <Row className="mt-3 text-center">
            <h2 className="fw-bold">Ready to Get Started?</h2>
            <p className="lead mb-4 fs-4">
              Take your AI projects to the next level with Nexus. Explore our services today and see the future of AI in action.
            </p>
          </Row>
        </Container>
      </div>

      <div
        style={{
          background: "#343a40",
          color: "white",
          padding: "20px 0",
          textAlign: "center",
        }}
      >
        <Container>
          <p className="mb-0">&copy; 2025 Nexus. All rights reserved.</p>
        </Container>
      </div>
    </>
  );
};

export default Dashboard;
