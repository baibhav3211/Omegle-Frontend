import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket;

export default function App() {
  const [isFindingPartner, setIsFindingPartner] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [country, setCountry] = useState('');
  const [ageConsent, setAgeConsent] = useState(false);
  const [partnerCountry, setPartnerCountry] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket = io('https://omegle-backend-ygm2.onrender.com');

    socket.on('matched', ({ partnerCountry }) => {
      setIsMatched(true);
      setIsFindingPartner(false);
      setPartnerCountry(partnerCountry); 
      setMessages([]);  
      appendMessage('System', `You are now connected with a stranger from ${partnerCountry}. Start chatting!`);
    });

    socket.on('chatMessage', (data) => {
      if (data.sender !== socket.id) {
        appendMessage('Stranger', data.message);
      }
    });

    socket.on('partnerLeft', () => {
      appendMessage('System', 'Your partner has disconnected. Searching for a new partner...');
      setIsMatched(false);
      setIsFindingPartner(true);
      setPartnerCountry('');
      socket.emit('findPartner', { country, ageConsent });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function appendMessage(sender, text) {
    setMessages((prev) => [...prev, { sender, text }]);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleFindPartner() {
    if (!country || !ageConsent) {
      alert('Please select a country and confirm your age consent.');
      return;
    }
    socket.emit('findPartner', { country, ageConsent });
    setIsFindingPartner(true);
  }

  function handleSendMessage() {
    if (!messageInput.trim()) return;

    socket.emit('chatMessage', messageInput);
    appendMessage('You', messageInput);
    setMessageInput('');
  }

  function handleLeaveChat() {
    socket.emit('leaveChat');
    setIsMatched(false);
    setIsFindingPartner(false);
    setMessages([]);
    setPartnerCountry('');
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Anonymous Chat</h1>

      {!isMatched && (
        <div style={styles.card}>
          <div style={styles.formGroup}>
            <label>Select your country</label>
            <select style={styles.select} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Select Country</option>
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="Australia">Australia</option>
              <option value="Canada">Canada</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label>
              <input 
                type="checkbox" 
                checked={ageConsent} 
                onChange={(e) => setAgeConsent(e.target.checked)} 
              /> I am above 18 years of age
            </label>
          </div>

          <button 
            onClick={handleFindPartner} 
            disabled={isFindingPartner} 
            style={isFindingPartner ? styles.buttonDisabled : styles.button}
          >
            {isFindingPartner ? 'Finding Partner...' : 'Find Partner'}
          </button>
        </div>
      )}

      {isMatched && (
        <div style={styles.chatContainer}>
          <div style={styles.messageBox}>
          {messages.map((m, index) => (
              <div key={index} style={{ margin: '8px 0', wordWrap: 'break-word' }}>
                <strong style={{ color: m.sender === 'You' ? '#2980b9' : '#c0392b' }}>
                  {m.sender}:
                </strong> {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={styles.inputContainer}>
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              style={styles.input}
            />
            <button onClick={handleSendMessage} style={styles.sendButton}>Send</button>
            <button onClick={handleLeaveChat} style={styles.leaveButton}>Leave</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    margin: '40px',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    marginBottom: '20px',
    color: '#2c3e50',
    fontSize: '2.5rem',
  },
  card: {
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    width: '400px',
    backgroundColor: '#f9f9f9',
  },
  formGroup: {
    marginBottom: '15px',
  },
  select: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#2980b9',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  },
  buttonDisabled: {
    padding: '10px 20px',
    backgroundColor: '#bdc3c7',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'not-allowed',
    width: '100%',
  },
  chatContainer: {
    marginTop: '20px',
    width: '400px',
  },
  messageBox: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    height: '300px',
    overflowY: 'auto',
    backgroundColor: '#f0f0f0',
    marginBottom: '10px',
  },
  inputContainer: {
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  sendButton: {
    padding: '10px',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
  },
  leaveButton: {
    padding: '10px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
  },
};
