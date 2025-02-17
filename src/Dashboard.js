import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";

const Dashboard = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="shadow-lg border-0 rounded-lg">
            <Card.Body>
              <Card.Title className="text-center mb-4">
                <h2>Welcome to the Dashboard</h2>
              </Card.Title>
              <Card.Text className="text-center text-muted mb-4">
                Nexus is a versatile web application integrating multiple
                AI-driven services focused on object detection, Hazard Detector,
                and other impactful software solutions that can adapt to various
                industry needs.
              </Card.Text>
              <Card.Text className="text-center text-muted">
                Our mission is to provide a comprehensive suite of services
                aimed at solving real-world challenges through AI innovation.
                Nexus is designed to be highly adaptable, allowing users from
                different industries to leverage its capabilities.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
