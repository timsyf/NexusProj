import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Card, Form } from "react-bootstrap";
const msRest = require("@azure/ms-rest-js");
const PredictionApi = require("@azure/cognitiveservices-customvision-prediction");

function OD() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [results, setResults] = useState("");
  const [minProbability, setMinProbability] = useState(95);
  const [intervalSeconds, setIntervalSeconds] = useState(2);

  const predictionKey = process.env.REACT_APP_PREDICTION_KEY;
  const predictionEndpoint = process.env.REACT_APP_PREDICTION_ENDPOINT;
  const publishIterationName = process.env.REACT_APP_PUBLISH_ITERATION_NAME;

  const predictorCredentials = new msRest.ApiKeyCredentials({
    inHeader: { "Prediction-key": predictionKey },
  });
  const predictor = new PredictionApi.PredictionAPIClient(
    predictorCredentials,
    predictionEndpoint
  );

  useEffect(() => {
    let intervalId;

    const startCamera = () => {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;

            // Set canvas dimensions when video metadata is loaded
            videoRef.current.onloadedmetadata = () => {
              const videoWidth = videoRef.current.videoWidth;
              const videoHeight = videoRef.current.videoHeight;

              if (canvasRef.current) {
                canvasRef.current.width = videoWidth;
                canvasRef.current.height = videoHeight;
              }

              if (overlayCanvasRef.current) {
                overlayCanvasRef.current.width = videoWidth;
                overlayCanvasRef.current.height = videoHeight;
              }
            };
          }
        })
        .catch((err) => {
          console.error("Error accessing webcam:", err);
        });
    };

    const captureImage = async () => {
      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const video = videoRef.current;
      if (canvas && video && overlayCanvas) {
        const context = canvas.getContext("2d");
        const overlayContext = overlayCanvas.getContext("2d");

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL("image/png");

        try {
          const projectId = process.env.REACT_APP_PROJECT_ID;
          const byteCharacters = atob(base64Image.split(",")[1]);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([byteArray], { type: "image/png" });

          const results = await predictor.detectImage(
            projectId,
            publishIterationName,
            blob
          );

          const filteredResults = results.predictions.filter(
            (predictedResult) =>
              predictedResult.probability * 100 >= minProbability
          );

          overlayContext.clearRect(
            0,
            0,
            overlayCanvas.width,
            overlayCanvas.height
          );

          filteredResults.forEach((predictedResult) => {
            const { boundingBox, probability, tagName } = predictedResult;
            const { left, top, width, height } = boundingBox;

            const x = left * overlayCanvas.width;
            const y = top * overlayCanvas.height;
            const w = width * overlayCanvas.width;
            const h = height * overlayCanvas.height;

            overlayContext.strokeStyle = "red";
            overlayContext.lineWidth = 2;
            overlayContext.strokeRect(x, y, w, h);

            overlayContext.fillStyle = "red";
            overlayContext.font = "14px Arial";
            overlayContext.fillText(
              `${tagName} (${(probability * 100).toFixed(2)}%)`,
              x,
              y > 10 ? y - 5 : y + 15
            );
          });

          const resultText = filteredResults
            .map(
              (predictedResult) =>
                `${predictedResult.tagName}: ${(
                  predictedResult.probability * 100.0
                ).toFixed(2)}%`
            )
            .join("\n");

          setResults(resultText);
        } catch (error) {
          console.error("Error during prediction:", error);
        }
      }
    };

    startCamera();

    intervalId = setInterval(captureImage, intervalSeconds * 1000);

    return () => {
      clearInterval(intervalId);
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [minProbability, intervalSeconds]);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <Card.Body>
              <h1 className="text-center mb-4">Webcam Feed</h1>
              <div className="position-relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="border rounded mb-4"
                />
                <canvas
                  ref={overlayCanvasRef}
                  className="position-absolute top-0 start-0"
                  style={{ pointerEvents: "none" }}
                />
              </div>
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <h2>Predictions (Above {minProbability}% probability):</h2>
              <Form.Control
                as="textarea"
                value={results}
                readOnly
                rows={10}
                style={{
                  width: "100%",
                  fontSize: "14px",
                  marginTop: "10px",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "10px",
                }}
              />
              <div className="mt-4">
                <Form.Label>Filter Predictions by Probability:</Form.Label>
                <Form.Range
                  min={0}
                  max={100}
                  step={1}
                  value={minProbability}
                  onChange={(e) => setMinProbability(e.target.value)}
                />
                <div className="text-center mt-2">
                  <strong>{minProbability}%</strong>
                </div>
              </div>
              <div className="mt-4">
                <Form.Label>Set API Call Interval (Seconds):</Form.Label>
                <Form.Range
                  min={1}
                  max={5}
                  step={1}
                  value={intervalSeconds}
                  onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                />
                <div className="text-center mt-2">
                  <strong>{intervalSeconds} Seconds</strong>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default OD;
