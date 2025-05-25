import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Dashboard from "./Dashboard";
import ImageGeneration from "./ImageGeneration";
import HazardDetector from "./HazardDetector";
import Translator from "./Translator";
import SpeechtoText from "./SpeechtoText";
import Debate from "./Debate";
import OD from "./OD";
import Login from "./login";
import NotFound from "./NotFound";
import ServiceUnavailable from "./ServiceUnavailable";
import Register from "./register";
import FaceEnrollVerify from "./FaceVerify";
import MorseCode from "./MorseCode";
import Subtitle from "./Subtitle";
import Extra1 from "./Extra1";
import Extra2 from "./Extra2";
import Extra3 from "./Extra3";
import {
  Navbar,
  Nav,
  NavDropdown,
  Container,
  Button,
  NavItem,
} from "react-bootstrap"; 
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthContext, AuthProvider } from "./AuthContext";

function App() {
  const { auth, setAuth, logout } = useContext(AuthContext);

  return (
    <Router>
      <div className="App">
        {auth.isAuthenticated && (
          <Navbar bg="light" expand="lg">
            <Container>
              <Navbar.Brand as={Link} to="/">
                <img
                  src="/logo.png"
                  alt="Logo"
                  style={{ width: "150px", height: "auto" }}
                />
              </Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                  <Nav.Link as={Link} to="/dashboard">
                    Dashboard
                  </Nav.Link>
                  <NavDropdown title="AI" id="services-nav-dropdown">
                    <NavDropdown.Item as={Link} to="/ImageGeneration">
                      Image Generator
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/Translator">
                      Translator
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/HazardDetector">
                      Hazard Detector
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/SpeechtoText">
                      Speech Recorder
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/MorseCode">
                      Morse Code
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/Subtitle">
                      Subtitle Generator
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/Debate">
                      Debate
                    </NavDropdown.Item>
                  </NavDropdown>

                  <NavDropdown title="Detection" id="detection-nav-dropdown">
                    <NavDropdown.Item as={Link} to="/OD">
                      Object Detection
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/FaceVerify">
                      Face Recognition
                    </NavDropdown.Item>
                  </NavDropdown>

                  <NavDropdown title="Others" id="others-nav-dropdown">
                    <NavDropdown.Item as={Link} to="/Extra1">
                      Extra 1
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/Extra2">
                      Extra 2
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/Extra3">
                      Extra 3
                    </NavDropdown.Item>
                  </NavDropdown>
                </Nav>
                <Nav>
                  <NavItem className="d-flex align-items-center me-3">
                    <span className="me-2">Welcome, {auth.username}</span>
                    <Button variant="outline-danger" onClick={logout}>
                      Logout
                    </Button>
                  </NavItem>
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        )}

        <Routes>
          <Route
            path="/"
            element={
              auth.isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ImageGeneration"
            element={
              <ProtectedRoute>
                <ImageGeneration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/HazardDetector"
            element={
              <ProtectedRoute>
                <HazardDetector />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Translator"
            element={
              <ProtectedRoute>
                <Translator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/SpeechtoText"
            element={
              <ProtectedRoute>
                <SpeechtoText />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Debate"
            element={
              <ProtectedRoute>
                <Debate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/OD"
            element={
              <ProtectedRoute>
                <OD />
              </ProtectedRoute>
            }
          />
          <Route
            path="/FaceVerify"
            element={
              <ProtectedRoute>
                <FaceEnrollVerify />
              </ProtectedRoute>
            }
          />
          <Route
            path="/MorseCode"
            element={
              <ProtectedRoute>
                <MorseCode />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Subtitle"
            element={
              <ProtectedRoute>
                <Subtitle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Extra1"
            element={
              <ProtectedRoute>
                <Extra1 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Extra2"
            element={
              <ProtectedRoute>
                <Extra2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Extra3"
            element={
              <ProtectedRoute>
                <Extra3 />
              </ProtectedRoute>
            }
          />
          <Route path="/register" element={<Register />} />
          <Route
            path="/login"
            element={
              auth.isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
            }
          />
          <Route path="/service-unavailable" element={<ServiceUnavailable />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

function ProtectedRoute({ children }) {
  const { auth } = useContext(AuthContext);
  return auth.isAuthenticated ? children : <Navigate to="/" />;
}

export default () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);
