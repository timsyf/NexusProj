import React, { useState, createContext, useContext } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Dashboard from "./Dashboard";
import AI from "./AI";
import AI2 from "./AI2";
import AI3 from "./AI3";
import AI4 from "./AI4";
import AI5 from "./AI5";
import AI6 from "./AI6";
import AI7 from "./AI7";
import AI8 from "./AI8";
import OD from "./OD";
import Login from "./login";
import NotFound from "./NotFound";
import Register from "./register";
import {
  Navbar,
  Nav,
  NavDropdown,
  Container,
  Button,
  NavItem,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

export const AuthContext = createContext();

function App() {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    token: null,
    username: "",
  });

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
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
                    <NavDropdown title="Services" id="services-nav-dropdown">
                      <NavDropdown.Item as={Link} to="/AI">
                        ChatGPT
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/AI2">
                        Image Generator
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/AI3">
                        Image Analysis
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/AI4">
                        Translator
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/AI5">
                        Speech to Text
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/AI6">
                        Sign Language Decipher
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/AI7">
                        FaceAPI Creating Person
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/AI8">
                        FaceAPI Training Faces
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/OD">
                        Object Detection
                      </NavDropdown.Item>
                    </NavDropdown>
                  </Nav>
                  <Nav>
                    <NavItem className="d-flex align-items-center me-3">
                      <span className="me-2">Welcome, {auth.username}</span>
                      <Button
                        variant="outline-danger"
                        onClick={() =>
                          setAuth({
                            isAuthenticated: false,
                            token: null,
                            username: "",
                          })
                        }
                      >
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
              path="/AI"
              element={
                <ProtectedRoute>
                  <AI />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AI2"
              element={
                <ProtectedRoute>
                  <AI2 />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AI3"
              element={
                <ProtectedRoute>
                  <AI3 />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AI4"
              element={
                <ProtectedRoute>
                  <AI4 />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AI5"
              element={
                <ProtectedRoute>
                  <AI5 />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AI6"
              element={
                <ProtectedRoute>
                  <AI6 />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AI7"
              element={
                <ProtectedRoute>
                  <AI7 />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AI8"
              element={
                <ProtectedRoute>
                  <AI8 />
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
            <Route path="/register" element={<Register />} />
            <Route
              path="/login"
              element={
                auth.isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { auth } = useContext(AuthContext);
  return auth.isAuthenticated ? children : <Navigate to="/" />;
}

export default App;
