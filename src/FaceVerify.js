import React, { useState, useRef, useContext } from "react";
import Webcam from "react-webcam";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Form,
  Alert,
  Image,
  Badge,
  Spinner,
  Tabs,
  Tab
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthContext } from "./App";

function FaceEnrollVerify() {
  const { auth } = useContext(AuthContext);
  const [enrolledFolders, setEnrolledFolders] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState([]);
  const [activeTab, setActiveTab] = useState("verify");
  const [apiPort, setApiPort] = useState("3001");
  const [apiRoute, setApiRoute] = useState("face_recognition");
  const [enableApiCall, setEnableApiCall] = useState(true);
  const [matchResult, setMatchResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const webcamRef = useRef(null);

  const fetchEnrolledFolders = async () => {
    try {
      const res = await fetch(`http://localhost:5001/folders?username=${auth.username}`);
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

  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleVerifyFace = async () => {
    setIsLoading(true);

    if (activeTab === "enroll" && selectedFolder.length > 0) {
      const base64Images = await Promise.all(
        selectedFolder.map(file => toBase64(file).then(data => ({ name: file.webkitRelativePath || file.name, base64: data })))
      );
      await sendFolderForEnrollment(base64Images);
      setIsLoading(false);
      return;
    }

    if (useWebcam) {
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) {
        alert("Failed to capture from webcam.");
        setIsLoading(false);
        return;
      }
      setPreviewImage(screenshot);
      await sendFormData(screenshot);
    } else if (selectedFile) {
      setPreviewImage(URL.createObjectURL(selectedFile));
      const base64 = await toBase64(selectedFile);
      await sendFormData(base64);
    } else {
      alert("Please select an image file.");
    }

    setIsLoading(false);
  };

  const captureFromWebcam = async () => {
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return alert("Failed to capture from webcam.");
    setPreviewImage(screenshot);
    await sendFormData(screenshot);
  };

  const sendFormData = async (base64) => {
    try {
      const response = await fetch("http://localhost:5001/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, username: auth.username }),
      });
      const result = await response.json();
      const isMatch = result.matched && result.identity && typeof result.distance === "number";

    if (enableApiCall) {
      try {
        await fetch(`http://localhost:${apiPort}/api/${apiRoute}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matched: result.matched,
            identity: result.identity || "",
            distance: result.distance ?? null,
          }),
        });
      } catch (apiErr) {
        console.warn("External API call failed:", apiErr);
      }
    }

      setMatchResult(isMatch ? { identity: result.identity, distance: result.distance } : { identity: null });
    } catch (err) {
      console.error("Verification error:", err);
      alert("Verification failed.");
    }
  };

  const sendFolderForEnrollment = async (images) => {
    try {
      const response = await fetch("http://localhost:5001/enroll-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, username: auth.username }),
      });
      const data = await response.json();
      alert(data.message || "Folder enrolled successfully.");
    } catch (err) {
      console.error("Folder enrollment failed:", err);
      alert("Folder enrollment failed.");
    }
  };

  const formatIdentity = (identity) => {
    if (!identity) return "";
    const nameWithSpaces = identity.replace(/-/g, " ");
    return nameWithSpaces
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Container className="py-4 d-flex justify-content-center align-items-center">
      <Row className="justify-content-center">
        <Col>
          <Card>
            <Card.Header as="h3" className="text-center">Face Recognition</Card.Header>
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={(k) => { setActiveTab(k); if (k === "manage") fetchEnrolledFolders(); } } className="mb-3">
                <Tab eventKey="verify" title="Verify">
                  <Form.Check
                    type="switch"
                    id="use-webcam"
                    label="Use Webcam"
                    checked={useWebcam}
                    onChange={() => {
                      setUseWebcam(!useWebcam);
                      setPreviewImage(null);
                      setSelectedFile(null);
                      setMatchResult(null);
                    }}
                    className="mb-3"
                  />

                  {useWebcam ? (
                    <div className="text-center mb-3">
                      <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        width="100%"
                        videoConstraints={{ facingMode: "user" }}
                      />
                    </div>
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
                    <Form.Label>Select Folder</Form.Label>
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
                          <Button variant="danger" size="sm" onClick={() => deleteFolder(folder)}>Delete</Button>
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

              {activeTab !== "manage" && (
                <div className="d-flex justify-content-center mb-3">
                  <Button variant="primary" onClick={handleVerifyFace} disabled={isLoading}>
                    {isLoading ? (<><Spinner animation="border" size="sm" className="me-2" />Processing...</>) : activeTab === "enroll" ? "Enroll Folder" : "Verify Face"}
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

export default FaceEnrollVerify;