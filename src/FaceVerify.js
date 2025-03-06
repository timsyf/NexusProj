import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Button, Card, Form, Alert, Image, Badge, Spinner, Tabs, Tab } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function FaceEnrollVerify() {
  const [enrolledFolders, setEnrolledFolders] = useState([]);
  const [useWebcam, setUseWebcam] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState([]);
  const [activeTab, setActiveTab] = useState("verify");
  const [apiPort, setApiPort] = useState("3001");
  const [apiRoute, setApiRoute] = useState("face_recognition");
  const [enableApiCall, setEnableApiCall] = useState(true);
  const [matchResult, setMatchResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let stream;
    if (useWebcam && activeTab === "verify") {
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
    }

    



return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [useWebcam, activeTab]);

  const fetchEnrolledFolders = async () => {
  try {
    const res = await fetch("http://localhost:5001/folders");
    const data = await res.json();
    setEnrolledFolders(data.folders || []);
  } catch (err) {
    console.error("Failed to fetch folders", err);
  }
};

const deleteFolder = async (folderName) => {
  if (!window.confirm(`Are you sure you want to delete '${folderName}'?`)) return;
  try {
    await fetch(`http://localhost:5001/delete-folder/${folderName}`, { method: "DELETE" });
    fetchEnrolledFolders();
  } catch (err) {
    console.error("Failed to delete folder", err);
  }
};

const getConfidenceLabel = (distance) => {
    if (distance <= 0.4) return "Strong";
    if (distance <= 0.6) return "Moderate";
    return "Weak";
  };

  const handleVerifyFace = async () => {
    setIsLoading(true);

    if (activeTab === "enroll" && selectedFolder.length > 0) {
      const formData = new FormData();
      for (let file of selectedFolder) {
        formData.append("images", file);
      }
      await sendFolderForEnrollment(formData);
      setIsLoading(false);
      return;
    }

    const formData = new FormData();

    if (useWebcam) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (canvas && video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          setPreviewImage(URL.createObjectURL(blob));
          formData.append("image", blob, "face.jpg");
          await sendFormData(formData);
        }, "image/jpeg");
      }
    } else if (selectedFile) {
      setPreviewImage(URL.createObjectURL(selectedFile));
      formData.append("image", selectedFile);
      await sendFormData(formData);
    } else {
      alert("Please select an image file or use the webcam.");
      setIsLoading(false);
    }
  };

  const sendFormData = async (formData) => {
    try {
      const response = await fetch("http://localhost:5001/verify", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("Verification Result:", result);
      const isMatch = result.matched && result.identity && typeof result.distance === "number";

      if (enableApiCall) {
        await fetch(`http://localhost:${apiPort}/api/${apiRoute}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matched: result.matched,
            identity: result.identity || "",
            distance: result.distance ?? null
          }),
        });
      }

      if (isMatch) {
        setMatchResult({ identity: result.identity, distance: result.distance });
      } else {
        setMatchResult({ identity: null });
      }
    } catch (err) {
      console.error("Verification error:", err);
      alert("Verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendFolderForEnrollment = async (formData) => {
    try {
      const response = await fetch("http://localhost:5001/enroll-folder", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      alert(data.message || "Folder enrolled successfully.");
    } catch (err) {
      console.error("Folder enrollment failed:", err);
      alert("Folder enrollment failed.");
    }
  };

  return (
    <Container className="py-4 d-flex justify-content-center align-items-center">
      <Row className="justify-content-center">
        <Col>
          <Card>
            <Card.Header as="h3" className="text-center">
              Face Recognition
            </Card.Header>
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                <Tab eventKey="verify" title="Verify">
                  <Form.Check
                    type="switch"
                    id="toggle-webcam"
                    label="Use Webcam"
                    checked={useWebcam}
                    onChange={() => setUseWebcam(!useWebcam)}
                    className="mb-3"
                  />

                  {useWebcam ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      width="100%"
                      height="auto"
                      className="mb-3 rounded"
                      style={{ border: "1px solid #dee2e6" }}
                    />
                  ) : (
                    <Form.Group controlId="formFile" className="mb-3">
                      <Form.Label>Select Image File</Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                      />
                    </Form.Group>
                  )}

                  {previewImage && (
                    <div className="text-center mb-3">
                      <Image src={previewImage} rounded fluid style={{ maxHeight: "200px" }} />
                    </div>
                  )}

                  {matchResult && (
                    <Alert variant={matchResult.identity ? "success" : "danger"} className="text-center">
                      {matchResult.identity ? (
                        <>
                          {formatIdentity(matchResult.identity)} (Confidence: {(100 - (matchResult.distance * 100)).toFixed(2)}%)<br />
                          <Badge bg="info" className="mt-2">{getConfidenceLabel(matchResult.distance)} Match</Badge>
                        </>
                      ) : (
                        "No match found."
                      )}
                    </Alert>
                  )}
                </Tab>

                <Tab eventKey="enroll" title="Enroll Folder">
                  <Form.Group controlId="formFolder" className="mb-3">
                    <Form.Label>Select Folder (e.g. face_data/timothy)</Form.Label>
                    <Form.Control
                      type="file"
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      onChange={(e) => setSelectedFolder(Array.from(e.target.files))}
                    />
                  </Form.Group>
                </Tab>

<Tab eventKey="manage" title="Manage Folders">
  <div className="mb-3">
    <Button variant="secondary" onClick={fetchEnrolledFolders} className="mb-2">
      Refresh List
    </Button>
    <ul>
      {enrolledFolders.map((folder) => (
        <li key={folder} className="d-flex justify-content-between align-items-center mb-2">
          <span>{folder}</span>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteFolder(folder)}
          >
            Delete
          </Button>
        </li>
      ))}
    </ul>
  </div>
</Tab>
</Tabs>

              {activeTab === "verify" && (
                <Form.Check
                  type="switch"
                  id="enable-api-call"
                  label="Enable API Call"
                  checked={enableApiCall}
                  onChange={() => setEnableApiCall(!enableApiCall)}
                  className="mb-3"
                />
              )}

              {enableApiCall && activeTab === "verify" && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>API Port</Form.Label>
                    <Form.Control
                      type="text"
                      value={apiPort}
                      onChange={(e) => setApiPort(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>API Route</Form.Label>
                    <Form.Control
                      type="text"
                      value={apiRoute}
                      onChange={(e) => setApiRoute(e.target.value)}
                    />
                  </Form.Group>
                </>
              )}

              <canvas ref={canvasRef} style={{ display: "none" }} />
              {activeTab !== "manage" && (
  <div className="d-flex justify-content-center mb-3">
    <Button variant="primary" onClick={handleVerifyFace} disabled={isLoading}>
      {isLoading ? <><Spinner animation="border" size="sm" className="me-2" />Processing...</> : activeTab === "enroll" ? "Enroll Folder" : "Verify Face"}
    </Button>
  </div>
)}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

const formatIdentity = (rawName) => {
  if (!rawName) return "";
  const baseName = rawName.split("_")[0];
  const nameWithSpaces = baseName.replace(/-/g, " ");
  return nameWithSpaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default FaceEnrollVerify;
