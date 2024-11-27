import React, { useState } from 'react';

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
    <div className="AI" style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>ChatGPT</h1>
      <textarea
        placeholder="Enter your input here"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        style={{ width: '100%', height: '100px', marginBottom: '10px' }}
      ></textarea>
      <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Loading...' : 'Submit'}
      </button>
      <div style={{ marginTop: '20px' }}>
        <h2>Response:</h2>
        <textarea
          readOnly
          value={response}
          style={{ width: '100%', height: '150px' }}
        ></textarea>
      </div>
    </div>
  );
}

export default AI;