import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket']
});

const room = 'blueprints.juan.plano-1';

console.log('Connecting to Socket.IO server...');

socket.on('connect', () => {
  console.log('Connected! ID:', socket.id);
  console.log('Joining room:', room);
  socket.emit('join-room', room);

  // Send a test draw event after 1 second
  setTimeout(() => {
    const payload = { 
       room: room, 
       author: 'juan', 
       name: 'plano-1', 
       point: { x: 100, y: 100 } 
    };
    console.log('Sending draw-event:', payload);
    socket.emit('draw-event', payload);
  }, 1000);
});

socket.on('blueprint-update', (data) => {
  console.log('Received blueprint-update:', data);
  socket.disconnect();
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
  process.exit(1);
});

// Timeout
setTimeout(() => {
  console.log('Timeout waiting for response.');
  process.exit(0);
}, 5000);
