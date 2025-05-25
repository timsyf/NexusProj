import React from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const ServiceUnavailable = () => {
  const navigate = useNavigate();

  const goToHome = () => {
    navigate("/");
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center vh-100"
      fluid
    >
      <Row className="w-100">
        <Col className="d-flex justify-content-center">
          <Card
            className="shadow-lg p-4"
            style={{ maxWidth: "400px", width: "100%" }}
          >
            <Card.Body>
              <h2 className="text-center mb-4">Service Unavailable</h2>
              <p className="text-center">
                Sorry, this service is currently down or unavailable.
                Please try again later.
              </p>
              <div className="text-center">
                <Button variant="primary" onClick={goToHome}>
                  Return to Home
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ServiceUnavailable;
