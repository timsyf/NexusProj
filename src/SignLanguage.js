import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import Webcam from "react-webcam";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function SignLanguage() {
  const webcamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState("");
  const intervalRef = useRef(null);

  const captureAndSend = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();

    try {
      const res = await axios.post("http://localhost:5000/predict-asl", {
        image: imageSrc,
      });
      if (res.data && res.data.prediction) {
        setResponseText(res.data.prediction);
      }
    } catch (error) {
      console.error("[ERROR - Predict ASL]", error);
    }
  };

  const startStopRecording = () => {
    if (isRecording) {
      clearInterval(intervalRef.current);
      setIsRecording(false);
    } else {
      captureAndSend(); // immediate first capture
      intervalRef.current = setInterval(captureAndSend, 2000); // every 2 seconds
      setIsRecording(true);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center mt-5">
      <Row className="w-100">
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header as="h3" className="text-center">
              Sign Language Recognition (Image-Based)
            </Card.Header>
            <Card.Body className="text-center">
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={true}
                width={640}
                height={480}
                screenshotFormat="image/jpeg"
                className="border rounded mb-3"
              />
              <div className="d-flex justify-content-center gap-2">
                <Button
                  variant={isRecording ? "danger" : "success"}
                  onClick={startStopRecording}
                >
                  {isRecording ? "Stop" : "Start"}
                </Button>
              </div>
              {responseText && (
                <Card.Text className="mt-3">
                  <strong>Decoded ASL Sign:</strong> {responseText}
                </Card.Text>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default SignLanguage;