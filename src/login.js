import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './App';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/login', { username, password });
      setAuth({ isAuthenticated: true, token: response.data.token, username });
      navigate('/');
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred');
    }
  };

  const goToRegister = () => {
    navigate('/register');
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card className="shadow-lg p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Login</h2>
        <Form>
          <Form.Group controlId="formUsername">
            <Form.Control
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mb-3"
            />
          </Form.Group>

          <Form.Group controlId="formPassword">
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-3"
            />
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Button variant="primary" onClick={handleLogin}>
              Login
            </Button>
            <Button variant="link" onClick={goToRegister}>
              Register
            </Button>
          </div>

          {message && (
            <Alert variant="danger" className="mt-3">
              {message}
            </Alert>
          )}
        </Form>
      </Card>
    </Container>
  );
};

export default Login;