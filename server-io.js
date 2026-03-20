// server-io.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();

// ========== SEGURIDAD: CORS RESTRINGIDO ==========
// En producción, cambiar a lista blanca específica
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json({ limit: '1mb' })); // Limitar tamaño de payload

// ========== FUNCIONES DE VALIDACIÓN ==========
/**
 * Valida que un blueprint tenga los campos requeridos
 */
function validateBlueprint(bp) {
  if (!bp || typeof bp !== 'object') return false;
  if (typeof bp.author !== 'string' || bp.author.length === 0 || bp.author.length > 50) return false;
  if (typeof bp.name !== 'string' || bp.name.length === 0 || bp.name.length > 50) return false;
  if (!Array.isArray(bp.points)) bp.points = [];
  return true;
}

/**
 * Valida que un punto esté dentro de los límites del canvas (520x360)
 */
function validatePoint(point) {
  if (!point || typeof point !== 'object') return false;
  if (typeof point.x !== 'number' || point.x < 0 || point.x > 520) return false;
  if (typeof point.y !== 'number' || point.y < 0 || point.y > 360) return false;
  return true;
}

// Base de datos en memoria para soportar CRUD
const blueprints = [];

// Inicialización de endpoints API REST (imitando el backend Java para modo Node)
// GET /api/blueprints?author={author}
app.get('/api/blueprints', (req, res) => {
  const author = req.query.author;
  if (author) {
    // Validar que author sea string válido
    if (typeof author !== 'string' || author.length === 0 || author.length > 50) {
      return res.status(400).json({ error: 'Invalid author parameter' });
    }
    
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
  
  if (typeof author !== 'string' || author.length > 50 || typeof name !== 'string' || name.length > 50) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }
  
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
  
  // Validar blueprint
  if (!validateBlueprint(newBp)) {
    return res.status(400).json({ error: 'Invalid blueprint format' });
  }
  
  const existing = blueprints.find(b => b.author === newBp.author && b.name === newBp.name);
  if (existing) {
    return res.status(409).json({ error: 'Blueprint already exists' });
  }
  
  blueprints.push(newBp);
  res.status(201).json(newBp);
});

// PUT /api/blueprints/{author}/{name}
app.put('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params;
  
  if (typeof author !== 'string' || author.length > 50 || typeof name !== 'string' || name.length > 50) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }
  
  const idx = blueprints.findIndex(b => b.author === author && b.name === name);
  if (idx !== -1) {
    // Solo reemplazar puntos si es un array válido
    if (Array.isArray(req.body.points)) {
      blueprints[idx].points = req.body.points;
    }
    res.json(blueprints[idx]);
  } else {
    res.status(404).json({ error: 'Blueprint not found' });
  }
});

// DELETE /api/blueprints/{author}/{name}
app.delete('/api/blueprints/:author/:name', (req, res) => {
  const { author, name } = req.params;
  
  if (typeof author !== 'string' || author.length > 50 || typeof name !== 'string' || name.length > 50) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }
  
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
    origin: ALLOWED_ORIGINS, // ✅ CORS restringido (whitelist)
    credentials: true,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('\n✅ [Socket.IO] Cliente conectado:', socket.id);

  socket.on('join-room', (room) => {
    // Validar que room sea string válido
    if (typeof room !== 'string' || room.length === 0) {
      socket.emit('error', 'Invalid room format');
      return;
    }
    
    console.log(`📍 [Socket.IO] Cliente ${socket.id} se unió a sala: ${room}`);
    socket.join(room);
  });

  socket.on('draw-event', (data) => {
    // Validar estructura de datos
    if (!data || typeof data !== 'object') {
      socket.emit('error', 'Invalid data format');
      return;
    }
    
    // Validar punto
    if (!validatePoint(data.point)) {
      socket.emit('error', 'Point out of bounds (0-520 for X, 0-360 for Y)');
      return;
    }
    
    // Validar author y name
    if (typeof data.author !== 'string' || data.author.length === 0 || data.author.length > 50) {
      socket.emit('error', 'Invalid author');
      return;
    }
    if (typeof data.name !== 'string' || data.name.length === 0 || data.name.length > 50) {
      socket.emit('error', 'Invalid name');
      return;
    }
    
    console.log(`🎨 [Socket.IO] Dibujo validado en sala ${data.room}:`, data.point);
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
  console.log(`✓ CORS permitido para: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`\nEsperando conexiones...\n`);
});
