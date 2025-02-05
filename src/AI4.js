import React, { useState, useEffect } from "react";
import { Button, Container, Row, Col, Form, Card } from "react-bootstrap";

function AI4() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("zh");
  const [fromLanguage, setFromLanguage] = useState("en");
  const [recognition, setRecognition] = useState(null);
  const [autoReadAloud, setAutoReadAloud] = useState(false);

  const languages = [
    { code: "en", name: "English" },
    { code: "af", name: "Afrikaans" },
    { code: "ar", name: "Arabic" },
    { code: "hy", name: "Armenian" },
    { code: "az", name: "Azerbaijani" },
    { code: "be", name: "Belarusian" },
    { code: "bs", name: "Bosnian" },
    { code: "bg", name: "Bulgarian" },
    { code: "ca", name: "Catalan" },
    { code: "zh", name: "Chinese" },
    { code: "hr", name: "Croatian" },
    { code: "cs", name: "Czech" },
    { code: "da", name: "Danish" },
    { code: "nl", name: "Dutch" },
    { code: "et", name: "Estonian" },
    { code: "fi", name: "Finnish" },
    { code: "fr", name: "French" },
    { code: "gl", name: "Galician" },
    { code: "de", name: "German" },
    { code: "el", name: "Greek" },
    { code: "he", name: "Hebrew" },
    { code: "hi", name: "Hindi" },
    { code: "hu", name: "Hungarian" },
    { code: "is", name: "Icelandic" },
    { code: "id", name: "Indonesian" },
    { code: "it", name: "Italian" },
    { code: "ja", name: "Japanese" },
    { code: "kn", name: "Kannada" },
    { code: "kk", name: "Kazakh" },
    { code: "ko", name: "Korean" },
    { code: "lv", name: "Latvian" },
    { code: "lt", name: "Lithuanian" },
    { code: "mk", name: "Macedonian" },
    { code: "ms", name: "Malay" },
    { code: "mr", name: "Marathi" },
    { code: "mi", name: "Maori" },
    { code: "ne", name: "Nepali" },
    { code: "no", name: "Norwegian" },
    { code: "fa", name: "Persian" },
    { code: "pl", name: "Polish" },
    { code: "pt", name: "Portuguese" },
    { code: "ro", name: "Romanian" },
    { code: "ru", name: "Russian" },
    { code: "sr", name: "Serbian" },
    { code: "sk", name: "Slovak" },
    { code: "sl", name: "Slovenian" },
    { code: "es", name: "Spanish" },
    { code: "sw", name: "Swahili" },
    { code: "sv", name: "Swedish" },
    { code: "tl", name: "Tagalog" },
    { code: "ta", name: "Tamil" },
    { code: "th", name: "Thai" },
    { code: "tr", name: "Turkish" },
    { code: "uk", name: "Ukrainian" },
    { code: "ur", name: "Urdu" },
    { code: "vi", name: "Vietnamese" },
    { code: "cy", name: "Welsh" },
  ];

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = fromLanguage;

    recognitionInstance.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
    };

    recognitionInstance.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    setRecognition(recognitionInstance);
  }, [fromLanguage]);

  const translateText = async (text, targetLanguage) => {
    const predictionKey = process.env.REACT_APP_API_KEY;
    const apiKey = predictionKey;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are a helpful assistant that translates text from ${fromLanguage} to ${targetLanguage}. Do not return anything else other than the translated text.`,
              },
              { role: "user", content: text },
            ],
          }),
        }
      );

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        const translated = data.choices[0].message.content;
        setTranslatedText(translated);

        if (autoReadAloud) {
          const utterance = new SpeechSynthesisUtterance(translated);
          utterance.lang = targetLanguage;
          window.speechSynthesis.speak(utterance);
        }
      } else {
        setTranslatedText("Translation failed.");
      }
    } catch (error) {
      console.error("Error:", error);
      setTranslatedText("An error occurred during translation.");
    }
  };

  const handleListenToggle = () => {
    if (isListening) {
      recognition.stop();
      translateText(transcript, selectedLanguage);
    } else {
      setTranscript("");
      setTranslatedText("");

      recognition.start();
    }
    setIsListening(!isListening);
  };

  const handleReadAloud = () => {
    if (translatedText) {
      const utterance = new SpeechSynthesisUtterance(translatedText);
      utterance.lang = selectedLanguage;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
  };

  const handleFromLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setFromLanguage(newLanguage);
  };

  const handleSwapLanguages = () => {
    setFromLanguage(selectedLanguage);
    setSelectedLanguage(fromLanguage);
  };

  return (
    <Container className="AI" style={{ paddingTop: "20px" }}>
      <Card>
        <Card.Body>
          <Card.Title className="text-center">
            Speech-to-Text and Translation
          </Card.Title>

          <Row className="mb-3 justify-content-center">
            <Col xs="auto">
              <Button
                onClick={handleListenToggle}
                variant={isListening ? "danger" : "success"}
                size="lg"
              >
                {isListening ? "Stop Listening" : "Start Listening"}
              </Button>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Choose Language for Translation</Form.Label>
                <Form.Control
                  as="select"
                  value={fromLanguage}
                  onChange={handleFromLanguageChange}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Choose Language to Listen/Transcribe</Form.Label>
                <Form.Control
                  as="select"
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3 justify-content-center">
            <Col xs="auto">
              <Button
                onClick={handleSwapLanguages}
                variant="secondary"
                size="lg"
              >
                Swap Languages
              </Button>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <h5>Transcribed Text</h5>
              <Form.Control
                as="textarea"
                rows="4"
                value={transcript}
                readOnly
              />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <h5>Translated Text</h5>
              <Form.Control
                as="textarea"
                rows="4"
                value={translatedText}
                readOnly
              />
            </Col>
          </Row>

          <Row className="mb-3">
            <Col>
              <Form.Check
                type="radio"
                label="Auto Read Aloud"
                checked={autoReadAloud}
                onChange={() => setAutoReadAloud(true)}
              />
              <Form.Check
                type="radio"
                label="Manual Read Aloud"
                checked={!autoReadAloud}
                onChange={() => setAutoReadAloud(false)}
              />
            </Col>
          </Row>

          <Row className="justify-content-center">
            <Col xs="auto">
              <Button
                onClick={handleReadAloud}
                variant="primary"
                size="lg"
                disabled={autoReadAloud}
              >
                Read Aloud
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AI4;
