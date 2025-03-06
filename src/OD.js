import React, { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
const msRest = require("@azure/ms-rest-js");
const PredictionApi = require("@azure/cognitiveservices-customvision-prediction");

function OD() {
  const [snapshotImage, setSnapshotImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [results, setResults] = useState([]);
  const [minProbability, setMinProbability] = useState(80);
  const [intervalSeconds, setIntervalSeconds] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [useEnvKeys, setUseEnvKeys] = useState(true);
  const [manualKeys, setManualKeys] = useState({
    predictionKey: "",
    predictionEndpoint: "",
    publishIterationName: "",
    projectId: "",
  });
  const [sortBy, setSortBy] = useState("probability");
  const [sortOrder, setSortOrder] = useState("desc");
  const [enableApiCall, setEnableApiCall] = useState(false);
  const [runOnce, setRunOnce] = useState(false);
  useEffect(() => {
    if (!runOnce) setSnapshotImage(null);
  }, [runOnce]);
  const [apiPort, setApiPort] = useState("3001");
  const [apiRoute, setApiRoute] = useState("object_detection");

  const predictionAbortController = useRef(null);

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

    startCamera();
  }, []);

  useEffect(() => {
    let intervalId;

    const captureImage = async () => {
      if (!isRunning) return;

      const canvas = canvasRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const video = videoRef.current;

      if (canvas && video && overlayCanvas) {
        const context = canvas.getContext("2d");
        const overlayContext = overlayCanvas.getContext("2d");

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL("image/png");

        try {
          predictionAbortController.current = new AbortController();

          const byteCharacters = atob(base64Image.split(",")[1]);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteArray[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([byteArray], { type: "image/png" });

          const results = await predictor.detectImage(
            projectId,
            publishIterationName,
            blob,
            { abortSignal: predictionAbortController.current.signal }
          );

          const filteredResults = results.predictions.filter(
            (predictedResult) =>
              predictedResult.probability * 100 >= minProbability
          );

          overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

          filteredResults.forEach((predictedResult) => {
            const { boundingBox, probability, tagName } = predictedResult;
            const { left, top, width, height } = boundingBox;

            const x = left * overlayCanvas.width;
            const y = top * overlayCanvas.height;
            const w = width * overlayCanvas.width;
            const h = height * overlayCanvas.height;

            overlayContext.strokeStyle = probability >= 0.9 ? "lime" : probability >= 0.7 ? "orange" : "red";
            overlayContext.lineWidth = 2;
            overlayContext.strokeRect(x, y, w, h);

            const labelText = `${tagName} (${(probability * 100).toFixed(2)}%)`;
            const textWidth = overlayContext.measureText(labelText).width;
            overlayContext.fillStyle = "rgba(0, 0, 0, 0.6)";
            overlayContext.fillRect(x, y > 10 ? y - 20 : y + 2, textWidth + 6, 16);
            overlayContext.fillStyle = probability >= 0.9 ? "lime" : probability >= 0.7 ? "orange" : "red";
            overlayContext.fillText(labelText, x + 3, y > 10 ? y - 6 : y + 14);
          });

          setResults(filteredResults);

          // If Run Once is active, capture the canvas and display it
          if (runOnce) {
            const snapshotCanvas = document.createElement("canvas");
            snapshotCanvas.width = overlayCanvas.width;
            snapshotCanvas.height = overlayCanvas.height;
            const snapshotCtx = snapshotCanvas.getContext("2d");
            snapshotCtx.drawImage(canvas, 0, 0);
            snapshotCtx.drawImage(overlayCanvas, 0, 0);
            setSnapshotImage(snapshotCanvas.toDataURL("image/png"));
          }

          if (enableApiCall) {
            try {
              await fetch(`http://localhost:${apiPort}/api/${apiRoute}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ predictions: filteredResults })
              });
            } catch (err) {
              console.error("Error sending API call:", err);
            }
          }
        } catch (error) {
          if (error.name !== "AbortError") {
            console.error("Error during prediction:", error);
          }
        }
      }
    };

    if (isRunning) {
    if (runOnce) {
      (async () => {
        await captureImage();
        setIsRunning(false);
      })();
    } else {
      intervalId = setInterval(captureImage, intervalSeconds * 1000);
    }
    } else {
      if (predictionAbortController.current) {
        predictionAbortController.current.abort();
      }
      clearInterval(intervalId);
      if (overlayCanvasRef.current) {
        const overlayContext = overlayCanvasRef.current.getContext("2d");
        overlayContext.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      }
      setResults([]);
    }

    return () => {
      if (predictionAbortController.current) {
        predictionAbortController.current.abort();
      }
      clearInterval(intervalId);
    };
  }, [minProbability, intervalSeconds, isRunning, predictionKey, predictionEndpoint, publishIterationName, projectId, enableApiCall, apiPort, apiRoute]);

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const handleManualInputChange = (e) => {
    const { name, value } = e.target;
    setManualKeys((prev) => ({ ...prev, [name]: value }));
  };

  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === "probability") {
      return sortOrder === "asc"
        ? a.probability - b.probability
        : b.probability - a.probability;
    } else {
      return sortOrder === "asc"
        ? a.tagName.localeCompare(b.tagName)
        : b.tagName.localeCompare(a.tagName);
    }
  });

  return (
    <Container className="py-4 d-flex justify-content-center align-items-center">
      <Row className="justify-content-center">
        <Col>
          <Card>
            <Card.Header as="h3" className="text-center">
              Object Detection
            </Card.Header>
            <Card.Body>
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
              <Form.Select
                className="mb-2"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="probability">Sort by Probability</option>
                <option value="tagName">Sort by Name</option>
              </Form.Select>
              <Form.Select
                className="mb-3"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Form.Select>
              <Form.Control
                as="textarea"
                value={sortedResults
                  .map((predictedResult) =>
                    `${predictedResult.tagName}: ${(
                      predictedResult.probability * 100.0
                    ).toFixed(2)}%`
                  )
                  .join("\n")}
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
  <Form.Check
    type="switch"
    id="toggleKeySource"
    label="Use Environment Variables"
    checked={useEnvKeys}
    onChange={() => setUseEnvKeys(!useEnvKeys)}
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
                  step={1}
                  value={minProbability}
                  onChange={(e) => setMinProbability(parseFloat(e.target.value))}
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
                  step={1}
                  value={intervalSeconds}
                  onChange={(e) => setIntervalSeconds(parseFloat(e.target.value))}
                  disabled={isRunning}
                />
                <div className="text-center mt-2">
                  <strong>{intervalSeconds} Seconds</strong>
                </div>
              </div>
              <div className="mt-4">
                <Form.Check
  type="switch"
  id="enableApiCall"
  label="Enable API Call"
  checked={enableApiCall}
  onChange={() => setEnableApiCall(!enableApiCall)}
  disabled={isRunning}
/>
<Form.Check
  type="switch"
  id="runOnce"
  label="Run Once"
  checked={runOnce}
  onChange={() => setRunOnce(!runOnce)}
  disabled={isRunning}
/>
                {enableApiCall && (<>
                  <Form.Group className="mt-2">
                    <Form.Label>API Port</Form.Label>
                    <Form.Control
                      type="text"
                      value={apiPort}
                      onChange={(e) => setApiPort(e.target.value)}
                      disabled={isRunning}
                    />
                  </Form.Group>
                  <Form.Group className="mt-2">
                    <Form.Label>API Route</Form.Label>
                    <Form.Control
                      type="text"
                      value={apiRoute}
                      onChange={(e) => setApiRoute(e.target.value)}
                      disabled={isRunning}
                    />
                  </Form.Group>
                </>)}
              </div>
              <div className="mt-4 text-center">
              
                <Button
  variant={isRunning ? "danger" : "success"}
  onClick={toggleRunning}
>
  {isRunning ? "Stop" : runOnce ? "Run" : "Start"}
                </Button>
              </div>
              <br></br>
              {snapshotImage && (
  <img src={snapshotImage} alt="Snapshot with Detections" className="img-fluid mb-3" />
)}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default OD;
