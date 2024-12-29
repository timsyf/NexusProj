import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Card } from 'react-bootstrap';

function AI() {
  const [userInput, setUserInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const predictionKey = process.env.REACT_APP_API_KEY;

  const handleSubmit = async () => {
    setLoading(true);
    const apiKey = predictionKey;
    const prompt = "You are a helpful assistant.";

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: userInput }
          ]
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setResponse(data.choices[0].message.content);
      } else {
        setResponse('No response received.');
      }
    } catch (error) {
      console.error('Error:', error);
      setResponse('An error occurred while fetching the response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header className="bg-primary text-white text-center">
              <h2>ChatGPT Prototype</h2>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Enter your input</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Type your query here..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />{' '}
                      Loading...
                    </>
                  ) : (
                    'Submit'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          <Card className="mt-4">
            <Card.Header className="bg-secondary text-white text-center">
              <h3>Response</h3>
            </Card.Header>
            <Card.Body>
              <Form.Control
                as="textarea"
                rows={6}
                readOnly
                value={response}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AI;
