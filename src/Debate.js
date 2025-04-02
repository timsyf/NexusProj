import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Button, Card, Form, Spinner, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const VOICES = ["nova", "alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "sage", "shimmer"];

function Debate() {
  const [userInput, setUserInput] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useSpeech, setUseSpeech] = useState(false);
  const [useTTS, setUseTTS] = useState(false);
  const [shortReplies, setShortReplies] = useState(false);
  const [simpleReplies, setSimpleReplies] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [tone, setTone] = useState("formal");
  const [style, setStyle] = useState("polite");
  const [useExamples, setUseExamples] = useState(false);
  const [allowInsults, setAllowInsults] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [showExportAlert, setShowExportAlert] = useState(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const apiKey = process.env.REACT_APP_API_KEY;

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  const startListening = () => recognitionRef.current?.start() && setIsListening(true);
  const stopListening = () => recognitionRef.current?.stop();

  const stopTTS = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const clearChat = () => {
    stopTTS();
    setChatLog([]);
    setUserInput("");
  };

  const exportChat = () => {
    const textContent = chatLog.map(entry => `${entry.role === "user" ? "You" : "Nexus"}: ${entry.content}`).join("\n\n");
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "debate_log.txt";
    a.click();
    URL.revokeObjectURL(url);
    setShowExportAlert(true);
    setTimeout(() => setShowExportAlert(false), 2000);
  };

  const buildDebatePrompt = ({ shortReplies, simpleReplies, tone, style, useExamples, allowInsults }) => {
    let prompt = `You are a skilled debater. Always take the opposite side of the user's opinion. Argue to win with structured, persuasive reasoning.`;
    if (shortReplies) prompt += " Keep your replies short and impactful.";
    if (simpleReplies) prompt += " Use beginner-friendly, simple language.";
    if (tone === "formal") prompt += " Maintain a formal tone.";
    else if (tone === "casual") prompt += " Use a casual, conversational tone.";
    if (style === "aggressive") prompt += " Be assertive and unyielding in your arguments.";
    else if (style === "polite") prompt += " Debate respectfully and calmly.";
    if (useExamples) prompt += " Use specific examples, analogies, or counterexamples when possible.";
    if (allowInsults) prompt += " You are allowed to be sarcastic, condescending, or insulting if it strengthens your argument, but do not use slurs or hate speech.";
    prompt += " Occasionally ask a follow-up question to challenge the user further. Never agree with the user's point.";
    return prompt;
  };

  const handleSend = async () => {
    stopTTS();
    if (!userInput.trim()) return;
    const updatedChatLog = [...chatLog, { role: "user", content: userInput }];
    setChatLog(updatedChatLog);
    setUserInput("");
    setLoading(true);
    setTypingIndicator(true);

    const debatePrompt = buildDebatePrompt({ shortReplies, simpleReplies, tone, style, useExamples, allowInsults });

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: debatePrompt },
            ...updatedChatLog,
          ],
        }),
      });

      const data = await response.json();
      const botReply = data.choices?.[0]?.message?.content?.trim();
      setChatLog([...updatedChatLog, { role: "assistant", content: botReply }]);
      if (useTTS && botReply) speakText(botReply);
    } catch (err) {
      setChatLog([...updatedChatLog, { role: "assistant", content: "Error generating a response." }]);
    } finally {
      setLoading(false);
      setTypingIndicator(false);
    }
  };

  const speakText = async (text) => {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: selectedVoice,
          input: text,
        }),
      });
      const blob = await response.blob();
      const audioURL = URL.createObjectURL(blob);
      const audio = new Audio(audioURL);
      audioRef.current = audio;
      audio.play();
    } catch (err) {
      console.error("TTS Error:", err);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header as="h3" className="text-center">Debate</Card.Header>
            <Card.Body ref={chatContainerRef} style={{ maxHeight: "400px", overflowY: "auto" }}>
              {chatLog.map((msg, idx) => (
                <div key={idx} style={{ textAlign: msg.role === "user" ? "right" : "left" }}>
                  <strong>{msg.role === "user" ? "You" : "Nexus"}:</strong>
                  {msg.content.split(/\n{2,}/).map((para, pidx) => (
                    <p key={pidx} style={{ marginBottom: "0.75rem" }}>{para}</p>
                  ))}
                </div>
              ))}
              {typingIndicator && <p><em>Nexus is typing...</em></p>}
            </Card.Body>
            <Card.Footer>
              <Form>
                <Form.Group className="d-flex align-items-center gap-2">
                  <Form.Control
                    type="text"
                    placeholder="State your opinion here..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={loading || isListening}
                  />
                  {useSpeech && (
                    <Button
                      variant={isListening ? "danger" : "secondary"}
                      onClick={isListening ? stopListening : startListening}
                    >
                      {isListening ? "Stop" : "Record"}
                    </Button>
                  )}
                  <Button onClick={handleSend} disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : "Send"}
                  </Button>
                  <Button variant="outline-danger" onClick={clearChat}>Clear</Button>
                  <Button variant="outline-primary" onClick={exportChat}>Export</Button>
                </Form.Group>

                <div className="d-flex flex-wrap justify-content-between mt-3 gap-2">
                  <Form.Check type="switch" label="Speech Input" checked={useSpeech} onChange={() => setUseSpeech(!useSpeech)} />
                  <Form.Check type="switch" label="TTS" checked={useTTS} onChange={() => setUseTTS(!useTTS)} />
                  <Form.Check type="switch" label="Short Replies" checked={shortReplies} onChange={() => setShortReplies(!shortReplies)} />
                  <Form.Check type="switch" label="Simplify Language" checked={simpleReplies} onChange={() => setSimpleReplies(!simpleReplies)} />
                  <Form.Check type="switch" label="Examples" checked={useExamples} onChange={() => setUseExamples(!useExamples)} />
                  <Form.Check type="switch" label="Allow Insults" checked={allowInsults} onChange={() => setAllowInsults(!allowInsults)} />
                </div>

                <Form.Group className="d-flex flex-wrap gap-3 mt-3">
                  <Form.Group>
                    <Form.Label className="mb-0">Tone:</Form.Label>
                    <Form.Select value={tone} onChange={(e) => setTone(e.target.value)} style={{ maxWidth: "150px" }}>
                      <option value="formal">Formal</option>
                      <option value="casual">Casual</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="mb-0">Style:</Form.Label>
                    <Form.Select value={style} onChange={(e) => setStyle(e.target.value)} style={{ maxWidth: "150px" }}>
                      <option value="polite">Polite</option>
                      <option value="aggressive">Aggressive</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="mb-0">Voice:</Form.Label>
                    <Form.Select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} disabled={!useTTS}>
                      {VOICES.map((voice) => (
                        <option key={voice} value={voice}>{voice}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Form.Group>
              </Form>
              {showExportAlert && <Alert variant="success" className="mt-3">Chat exported successfully!</Alert>}
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Debate;
