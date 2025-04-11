import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';

const Chat = ({ rideId, driverName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState(null);
  const { socket } = useSocket();
  const messagesEndRef = useRef(null);

  // Rolar para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!socket) return;

    // Carregar mensagens anteriores
    socket.emit('joinChat', { rideId }, (response) => {
      if (response.success) {
        setMessages(response.messages);
        scrollToBottom();
      } else {
        setError('Erro ao carregar mensagens');
      }
    });

    // Escutar novas mensagens
    socket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    return () => {
      socket.off('newMessage');
      socket.emit('leaveChat', { rideId });
    };
  }, [socket, rideId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit('sendMessage', {
      rideId,
      content: newMessage.trim()
    }, (response) => {
      if (response.success) {
        setNewMessage('');
      } else {
        setError('Erro ao enviar mensagem');
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="bg-yellow-400 p-4 flex items-center">
        <button 
          onClick={onClose}
          className="mr-3"
        >
          <span className="material-icons-outlined">arrow_back</span>
        </button>
        <div>
          <h3 className="font-medium">Chat com {driverName}</h3>
          <p className="text-sm text-yellow-800">Online</p>
        </div>
      </div>

      {/* Lista de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isDriver ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[75%] rounded-lg p-3 ${
                message.isDriver
                  ? 'bg-gray-100'
                  : 'bg-yellow-400 text-white'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-75">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem */}
      <form 
        onSubmit={handleSendMessage}
        className="border-t p-4 flex items-center space-x-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-yellow-400 p-2 rounded-full text-white disabled:opacity-50"
        >
          <span className="material-icons-outlined">send</span>
        </button>
      </form>

      {error && (
        <div className="bg-red-100 text-red-600 p-2 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default Chat; 