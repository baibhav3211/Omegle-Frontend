// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socket;

export default function App() {
  const [isFindingPartner, setIsFindingPartner] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket = io('https://omegle-backend-ygm2.onrender.com');

    requestNotificationPermission();

    socket.on('matched', () => {
      setIsMatched(true);
      setIsFindingPartner(false);
      appendMessage('System', 'You are now connected with a stranger. Start chatting!');
      showNotification('Match Found', 'You have been connected to a stranger. Start chatting now!');
    });

    socket.on('chatMessage', (data) => {
      if (data.sender !== socket.id) {
        appendMessage('Stranger', data.message);
      }
    });

    socket.on('partnerLeft', () => {
      appendMessage('System', 'Your partner has disconnected.');
      resetChat();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function requestNotificationPermission() {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function showNotification(title, message) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: 'https://cdn-icons-png.flaticon.com/512/1057/1057231.png', // You can use any URL or your own icon URL here
        tag: 'chat-notification'
      });
    }
  }

  function appendMessage(sender, text) {
    setMessages((prev) => [...prev, { sender, text }]);
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleFindPartner() {
    socket.emit('findPartner');
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
    resetChat();
  }

  function resetChat() {
    setIsFindingPartner(false);
    setIsMatched(false);
    setMessages([]);
    setMessageInput('');
  }

  return (
    <div style={{ margin: '40px', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 style={{ marginBottom: '20px', color: '#2c3e50' }}>Anonymous Chat</h1>
      
      {!isMatched && (
        <button
          onClick={handleFindPartner}
          disabled={isFindingPartner}
          style={{
            padding: '12px 24px',
            backgroundColor: isFindingPartner ? '#bdc3c7' : '#2980b9',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: isFindingPartner ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {isFindingPartner ? 'Finding Partner...' : 'Find Partner'}
        </button>
      )}

      {isMatched && (
        <div style={{ marginTop: '20px', width: '400px', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <div
            style={{
              border: '1px solid #bdc3c7',
              borderRadius: '8px',
              height: '300px',
              overflowY: 'auto',
              padding: '10px',
              backgroundColor: '#ecf0f1',
              marginBottom: '10px'
            }}
          >
            {messages.map((m, index) => (
              <div key={index} style={{ margin: '8px 0', wordWrap: 'break-word' }}>
                <strong style={{ color: m.sender === 'You' ? '#2980b9' : '#c0392b' }}>
                  {m.sender}:
                </strong> {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Type your message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              style={{
                flexGrow: 1,
                padding: '10px',
                border: '1px solid #bdc3c7',
                borderRadius: '8px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                padding: '10px 20px',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              Send
            </button>
            <button
              onClick={handleLeaveChat}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
            >
              Leave
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
