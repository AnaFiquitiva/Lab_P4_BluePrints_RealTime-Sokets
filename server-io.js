// server-io.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Base de datos en memoria para soportar CRUD
const blueprints = [];

// Inicialización de endpoints API REST (imitando el backend Java para modo Node)
// GET /api/blueprints?author={author}
app.get('/api/blueprints', (req, res) => {
  const author = req.query.author;
  if (author) {
    if (!blueprints.some(b => b.author === author)) {
      // Si no existe, creamos uno de prueba para facilitar uso
      blueprints.push({ author: author, name: 'plano-1', points: [] });
    }
    res.json(blueprints.filter(bp => bp.author === author));
  } else {
    res.json(blueprints);
  }
});

// GET /api/blueprints/{author}/{name}
app.get('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params;
  const bp = blueprints.find(b => b.author === author && b.name === name);
  if (bp) {
    res.json(bp);
  } else {
    res.status(404).json({ error: 'Blueprint not found' });
  }
});

// POST /api/blueprints
app.post('/api/blueprints', (req, res) => {
  const newBp = req.body;
  if (!newBp.author || !newBp.name) {
    return res.status(400).json({ error: 'Missing author or name' });
  }
  const existing = blueprints.find(b => b.author === newBp.author && b.name === newBp.name);
  if (existing) {
    return res.status(409).json({ error: 'Blueprint already exists' });
  }
  if (!newBp.points) newBp.points = [];
  blueprints.push(newBp);
  res.status(201).json(newBp);
});

// PUT /api/blueprints/{author}/{name}
app.put('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params;
  const idx = blueprints.findIndex(b => b.author === author && b.name === name);
  if (idx !== -1) {
    blueprints[idx] = { ...blueprints[idx], ...req.body };
    res.json(blueprints[idx]);
  } else {
    res.status(404).json({ error: 'Blueprint not found' });
  }
});

// DELETE /api/blueprints/{author}/{name}
app.delete('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params;
  const idx = blueprints.findIndex(b => b.author === author && b.name === name);
  if (idx !== -1) {
    blueprints.splice(idx, 1);
    res.status(200).json({ status: 'deleted' });
  } else {
    res.status(404).json({ error: 'Blueprint not found' });
  }
});

// --- Configuración Socket.IO ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('\n✅ [Socket.IO] Cliente conectado:', socket.id);

  socket.on('join-room', (room) => {
    console.log(`📍 [Socket.IO] Cliente ${socket.id} se unió a sala: ${room}`);
    socket.join(room);
  });

  socket.on('draw-event', (data) => {
    console.log(`🎨 [Socket.IO] Dibujo recibido en sala ${data.room}:`, data.point);
    console.log(`   └─ Enviando a ${io.sockets.adapter.rooms.get(data.room)?.size || 0} clientes en la sala`);
    
    // Persistencia simple en memoria para que al recargar se vea el punto
    const bp = blueprints.find(b => b.author === data.author && b.name === data.name);
    if (bp && data.point) {
       bp.points.push(data.point);
       console.log(`   └─ Puntos totales guardados: ${bp.points.length}`);
    }
    
    // Broadcast a todos en la sala.
    if (data.point) {
       io.to(data.room).emit('blueprint-update', data.point);
       console.log(`   ✓ Blueprint-update emitido`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ [Socket.IO] Cliente desconectado: ${socket.id}\n`);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Servidor Socket.IO + API REST iniciado`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`✓ WebSocket escuchando en ws://localhost:${PORT}`);
  console.log(`✓ API REST disponible en http://localhost:${PORT}/api/blueprints`);
  console.log(`\nEsperando conexiones...\n`);
});
