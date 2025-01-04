import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
const msRest = require("@azure/ms-rest-js");
const PredictionApi = require("@azure/cognitiveservices-customvision-prediction");

function OD() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [results, setResults] = useState("");
  const [minProbability, setMinProbability] = useState(99.5);
  const [intervalSeconds, setIntervalSeconds] = useState(1.0);
  const [isRunning, setIsRunning] = useState(true);
  const [useEnvKeys, setUseEnvKeys] = useState(true);
  const [manualKeys, setManualKeys] = useState({
    predictionKey: "",
    predictionEndpoint: "",
    publishIterationName: "",
    projectId: "",
  });

  const getKeys = () => {
    if (useEnvKeys) {
      return {
        predictionKey: process.env.REACT_APP_PREDICTION_KEY,
        predictionEndpoint: process.env.REACT_APP_PREDICTION_ENDPOINT,
        publishIterationName: process.env.REACT_APP_PUBLISH_ITERATION_NAME,
        projectId: process.env.REACT_APP_PROJECT_ID,
      };
    }
    return manualKeys;
  };

  const { predictionKey, predictionEndpoint, publishIterationName, projectId } = getKeys();

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

    if (isRunning) {
      startCamera();
      intervalId = setInterval(captureImage, intervalSeconds * 1000);
    } else {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
      clearInterval(intervalId);
      if (overlayCanvasRef.current) {
        const overlayContext = overlayCanvasRef.current.getContext("2d");
        overlayContext.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
      setResults("");
    }

    return () => {
      clearInterval(intervalId);
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [minProbability, intervalSeconds, isRunning, predictionKey, predictionEndpoint, publishIterationName, projectId]);

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const handleManualInputChange = (e) => {
    const { name, value } = e.target;
    setManualKeys((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Container className="d-flex justify-content-center align-items-center">
      <Row className="justify-content-center">
        <Col>
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
                <Form.Label>Toggle Key Source:</Form.Label>
                <Form.Check
                  type="radio"
                  label="Use Environment Variables"
                  name="keySource"
                  checked={useEnvKeys}
                  onChange={() => setUseEnvKeys(true)}
                  disabled={isRunning}
                />
                <Form.Check
                  type="radio"
                  label="Manual Input"
                  name="keySource"
                  checked={!useEnvKeys}
                  onChange={() => setUseEnvKeys(false)}
                  disabled={isRunning}
                />
              </div>
              {!useEnvKeys && (
                <div className="mt-4">
                  <Form.Group>
                    <Form.Label>Prediction Key:</Form.Label>
                    <Form.Control
                      type="text"
                      name="predictionKey"
                      value={manualKeys.predictionKey}
                      onChange={handleManualInputChange}
                      readOnly={isRunning}
                    />
                  </Form.Group>
                  <Form.Group className="mt-2">
                    <Form.Label>Prediction Endpoint:</Form.Label>
                    <Form.Control
                      type="text"
                      name="predictionEndpoint"
                      value={manualKeys.predictionEndpoint}
                      onChange={handleManualInputChange}
                      readOnly={isRunning}
                    />
                  </Form.Group>
                  <Form.Group className="mt-2">
                    <Form.Label>Publish Iteration Name:</Form.Label>
                    <Form.Control
                      type="text"
                      name="publishIterationName"
                      value={manualKeys.publishIterationName}
                      onChange={handleManualInputChange}
                      readOnly={isRunning}
                    />
                  </Form.Group>
                  <Form.Group className="mt-2">
                    <Form.Label>Project ID:</Form.Label>
                    <Form.Control
                      type="text"
                      name="projectId"
                      value={manualKeys.projectId}
                      onChange={handleManualInputChange}
                      readOnly={isRunning}
                    />
                  </Form.Group>
                </div>
              )}
              <div className="mt-4">
                <Form.Label>Filter Predictions by Probability:</Form.Label>
                <Form.Range
                  min={0}
                  max={100}
                  step={0.01}
                  value={minProbability}
                  onChange={(e) => setMinProbability(parseFloat(e.target.value).toFixed(2))}
                  disabled={isRunning}
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
                  step={0.1}
                  value={intervalSeconds}
                  onChange={(e) => setIntervalSeconds(parseFloat(e.target.value).toFixed(1))}
                  disabled={isRunning}
                />
                <div className="text-center mt-2">
                  <strong>{intervalSeconds} Seconds</strong>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Button
                  variant={isRunning ? "danger" : "success"}
                  onClick={toggleRunning}
                >
                  {isRunning ? "Stop" : "Start"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default OD;
