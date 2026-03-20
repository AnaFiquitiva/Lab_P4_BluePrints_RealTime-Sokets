# Laboratorio P4: BluePrints en Tiempo Real
## Colaboracion Multiusuario con WebSockets y STOMP

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.2-brightgreen)
![Java](https://img.shields.io/badge/Java-21-orange)
![License](https://img.shields.io/badge/License-CC--BY--NC%204.0-lightgrey)

---

## Descripcion

Este proyecto implementa una solucion **completa de colaboracion en tiempo real** para la gestion y edicion de planos digitales (BluePrints). Permite que multiples usuarios visualicen y editen el mismo plano de forma simultanea, integrando:

- **CRUD API persistente** basado en REST para gestion de planos
- **Comunicacion bidireccional en tiempo real** mediante WebSockets
- **Soporte dual**: Socket.IO (Node.js) y STOMP (Spring Boot)
- **Renderizacion en Canvas HTML5** optimizada para colaboracion

### Caso de Uso Ideal
Equipos de arquitectos, ingenieros o disenadores que necesitan colaborar en planos simultaneamente sin delays perceptibles.

---

## Integrantes

| Nombre | Rol |
|--------|-----|
| **Ana Fiquitiva** | Desarrolladora Principal |
|  |  |

---

## Arquitectura del Sistema

```
Servidor Socket.IO (Node.js - Puerto 3001)
├── API REST: /api/blueprints
├── WebSocket: ws://localhost:3001
└── Base de datos: En memoria

Servidor STOMP (Spring Boot - Puerto 8080)
├── API REST: /api/blueprints
├── WebSocket: ws://localhost:8080/ws-blueprints
└── Base de datos: En memoria

Cliente (React - Puerto 5173)
├── Interfaz de usuario interactiva
├── Canvas HTML5 para renderizacion
└── Soporte para Socket.IO y STOMP
```

---

## Requisitos Previos

### Hardware Minimo
- RAM: 2GB
- CPU: Dual-core

### Software Requerido
| Componente | Version | Descargar |
|-----------|---------|-----------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm | 9+ | Incluido con Node.js |
| JDK | 21 | [oracle.com/java](https://www.oracle.com/java/technologies/downloads/) |
| Maven | 3.9+ | [maven.apache.org](https://maven.apache.org/download.cgi) |
| Git | Cualquier version | [git-scm.com](https://git-scm.com) |

---

## Instalacion y Configuracion

### 1. Clonar el Repositorio

```bash
git clone https://github.com/AnaFiquitiva/Lab_P4_BluePrints_RealTime-Sokets.git
cd Lab_P4_BluePrints_RealTime-Sokets
```

### 2. Configurar el Backend Socket.IO (Node.js)

Abre una terminal en la raiz del proyecto:

```bash
# Instalar dependencias (si no estan instaladas)
npm install

# Iniciar el servidor Socket.IO en puerto 3001
node server-io.js
```

Deberias ver:
```
Servidor Socket.IO + API REST iniciado
URL: http://localhost:3001
WebSocket escuchando en ws://localhost:3001
API REST disponible en http://localhost:3001/api/blueprints

Esperando conexiones...
```

### 3. Configurar el Backend STOMP (Spring Boot)

Abre una segunda terminal:

```bash
cd Lab_P2_Backend

# Compilar y ejecutar con Maven
mvn clean spring-boot:run
```

Deberias ver:
```
... Started BlueprintsApiApplication ...
Tomcat started on port(s): 8080
```

### 4. Iniciar el Frontend (React + Vite)

Abre una tercera terminal en la raiz del proyecto:

```bash
# Instalar dependencias (si no estan instaladas)
npm install

# Iniciar servidor de desarrollo en puerto 5173
npm run dev
```

Deberias ver:
```
VITE v5.4.2  ready in 123 ms

Local:   http://localhost:5173/
```

---

## Guia de Uso

### Primer Inicio

1. **Abre el navegador** en `http://localhost:5173`
2. **Selecciona modo RT** en el dropdown (por defecto: STOMP)
3. **Escribe autor** de prueba (ej: `juan`, `ana`)
4. **Haz clic en "Get Blueprints"**
5. **Abre o crea un plano**

### Prueba de Colaboracion en Tiempo Real

#### Scenario: 2 Ventanas Simultaneas

1. **Abre dos pestanas del navegador** (puedes usar Ctrl+Clic para duplicar)
2. **En ambas:**
   - Selecciona **Socket.IO (Node/3001)** o **STOMP (Spring/8080)**
   - Escribe el **mismo autor** y **mismo plano**
   - Click en "Open"

3. **En la pestana 1:** Dibuja varios trazos
4. **Mira la pestana 2:** Veras los trazos aparecer **al instante**

5. **Repite en la pestana 2:** Confirma que vuelven a la pestana 1

#### Para Debug: Abre la Consola (F12)

Veras logs como:
```
[Socket.IO] Conectado! Uniendose a sala: blueprints.juan.plano-1
[Socket.IO] Enviando punto a sala blueprints.juan.plano-1 : {x: 250, y: 150}
[Socket.IO] blueprint-update recibido: {x: 250, y: 150}
```

---

## API REST Endpoints

### Base URL
- **Socket.IO**: `http://localhost:3001/api/blueprints`
- **STOMP**: `http://localhost:8080/api/blueprints`

### 1. Listar Planos de un Autor
```http
GET /api/blueprints?author={author}

Ejemplo:
GET http://localhost:3001/api/blueprints?author=juan
```

**Respuesta:**
```json
[
  {
    "author": "juan",
    "name": "plano-1",
    "points": []
  }
]
```

### 2. Obtener Detalle de un Plano
```http
GET /api/blueprints/{author}/{name}

Ejemplo:
GET http://localhost:3001/api/blueprints/juan/plano-1
```

**Respuesta:**
```json
{
  "author": "juan",
  "name": "plano-1",
  "points": [{x: 100, y: 150}, {x: 120, y: 160}]
}
```

### 3. Crear Nuevo Plano
```http
POST /api/blueprints
Content-Type: application/json

{
  "author": "juan",
  "name": "nuevo-plano",
  "points": []
}
```

**Respuesta:** `201 Created`

### 4. Actualizar Plano
```http
PUT /api/blueprints/{author}/{name}
Content-Type: application/json

{
  "points": [{x: 100, y: 150}, {x: 200, y: 250}]
}
```

**Respuesta:** `200 OK`

### 5. Eliminar Plano
```http
DELETE /api/blueprints/{author}/{name}

Ejemplo:
DELETE http://localhost:3001/api/blueprints/juan/plano-1
```

**Respuesta:** `200 OK`

---

## Protocolo WebSocket: Eventos en Tiempo Real

### Socket.IO Events

#### Client -> Server
```javascript
// Unirse a una sala de colaboracion
socket.emit('join-room', 'blueprints.juan.plano-1')

// Enviar evento de dibujo
socket.emit('draw-event', {
  room: 'blueprints.juan.plano-1',
  author: 'juan',
  name: 'plano-1',
  point: { x: 250, y: 150 }
})
```

#### Server -> Client
```javascript
// Recibir punto dibujado por otro usuario
socket.on('blueprint-update', (point) => {
  console.log('Nuevo punto:', point)
})
```

### STOMP Events

#### Client -> Server (via `/app/draw`)
```
destination: /app/draw
body: {
  "author": "juan",
  "name": "plano-1",
  "point": { "x": 250, "y": 150 }
}
```

#### Server -> Client (via `/topic/blueprints.{author}.{name}`)
```
Mensajes retransmitidos a todos los suscriptos
```

---

## Estructura del Proyecto

```
Lab_P4_BluePrints_RealTime-Sokets/
├── README.md                             # Este archivo
├── package.json                          # Dependencias Node.js
├── vite.config.js                        # Configuracion Vite
├── index.html                            # Punto de entrada HTML
├── server-io.js                          # Servidor Socket.IO + API
│
├── src/                                  # Frontend React
│   ├── App.jsx                           # Componente principal
│   ├── main.jsx                          # Punto de entrada React
│   └── lib/
│       ├── stompClient.js                # Cliente STOMP
│       └── socketIoClient.js             # Cliente Socket.IO
│
└── Lab_P2_Backend/                       # Backend Spring Boot
    ├── pom.xml                           # Dependencias Maven
    ├── src/main/java/co/edu/eci/blueprints/
    │   ├── BlueprintsApiApplication.java
    │   ├── api/
    │   │   ├── BlueprintController.java
    │   │   └── STOMPMessageController.java
    │   ├── config/
    │   │   ├── OpenApiConfig.java
    │   │   └── WebSocketConfig.java
    │   ├── auth/
    │   │   └── AuthController.java
    │   └── security/
    │       ├── SecurityConfig.java
    │       ├── MethodSecurityConfig.java
    │       └── ...
    └── src/main/resources/
        └── application.yml
```

---

## Tecnologias Utilizadas

### Frontend
| Tecnologia | Version | Proposito |
|-----------|---------|----------|
| React | 18.3.1 | Interfaz de usuario interactiva |
| Vite | 5.4.2 | Bundler y dev server |
| Canvas HTML5 | Nativa | Renderizacion de trazos |
| Socket.IO Client | 4.8.1 | Cliente WebSocket |
| STOMP.js | 7.2.0 | Cliente STOMP |

### Backend (Node.js - Socket.IO)
| Tecnologia | Version | Proposito |
|-----------|---------|----------|
| Express.js | Latest | Framework HTTP |
| Socket.IO | Latest | Servidor WebSocket |
| CORS | Latest | Compartir recursos entre origenes |

### Backend (Spring Boot - STOMP)
| Tecnologia | Version | Proposito |
|-----------|---------|----------|
| Spring Boot | 3.3.2 | Framework principal |
| Spring Web | 3.3.2 | REST APIs |
| Spring WebSocket | 3.3.2 | STOMP broker |
| Spring Security | 3.3.2 | JWT/OAuth2 |
| Java | 21 | Lenguaje |

---

## Troubleshooting

### Error: "Cannot connect to localhost:3001"

**Causa:** El servidor Socket.IO no esta corriendo

**Solucion:**
```bash
# En terminal separada
node server-io.js

# Verifica que veas:
# Servidor Socket.IO + API REST iniciado
```

### Error: "Cannot connect to localhost:8080"

**Causa:** El servidor Spring Boot no esta corriendo

**Solucion:**
```bash
cd Lab_P2_Backend
mvn clean spring-boot:run
```

### Los dibujos no se sincronizan entre pestanas

**Causa:** Probablemente el socket no esta conectado cuando haces click

**Solucion:**
1. Abre la consola (F12)
2. Espera a ver: `[Socket.IO] Conectado!`
3. Luego dibuja

### Puerto 3001 ya esta en uso

**Causa:** Otro proceso esta usando el puerto

**Solucion (Windows PowerShell):**
```powershell
netstat -ano | findstr 3001
taskkill /F /PID [PID_NUMBER]
```

**Solucion (macOS/Linux):**
```bash
lsof -i :3001
kill -9 [PID]
```

### "Access-Control-Allow-Origin" error

**Causa:** CORS no esta configurado correctamente

---

## Evidencia y Demostraciones

### Video de Prueba - Colaboracion en Tiempo Real

Se ha grabado una demostracion funcional del sistema mostrando:

- ✅ Conexión simultánea de dos usuarios (Socket.IO y STOMP)
- ✅ Sincronización de puntos en tiempo real entre navegadores
- ✅ Renderización en Canvas HTML5
- ✅ API REST respondiendo correctamente

**Video:** [Grabación de Prueba - Sincronización en Tiempo Real](./prueba.mp4)

**Contenido de la demostración:**
1. Inicio de dos sesiones del navegador
2. Selección de tecnología (Socket.IO / STOMP)
3. Búsqueda de planos por autor
4. Apertura de un plano existente
5. Dibujo simultáneo en ambas pestañas
6. Verificación de sincronización en tiempo real

---

## Repositorios Asociados

| Repositorio | Descripción |
|-----------|-----------|
| [Lab_P2_BluePrints_Java21_API_Security_JWT](https://github.com/AnaFiquitiva/Lab_P2_BluePrints_Java21_API_Security_JWT) | Backend Spring Boot con WebSocket y JWT |
| [Lab_P3_BluePrints_React_UI](https://github.com/AnaFiquitiva/Lab_P3_BluePrints_React_UI) | Frontend React (versión previa sin WebSocket) |

---

## Autor

**Ana Fiquitiva**  
Escuela Colombiana de Ingeniería Julio Garavito  
Arquitectura de Software (ARSW)  
Email: ana.fiquitiva-p@mail.escuelaing.edu.co

**Solucion:** Ya esta configurado en `server-io.js` y `WebSocketConfig.java`

---

## Flujo de Dibujo en Tiempo Real

```
Usuario en Ventana 1                      Usuario en Ventana 2
      |                                        |
      | Click en Canvas                       |
      v                                        |
   onClick()                                   |
      |                                        |
      +-- Dibujar localmente                   |
      |   (setCurrentBlueprint)                |
      |                                        |
      +-- Emitir evento draw-event            |
         socket.emit('draw-event', {...})     |
         |                                     |
         +------> Servidor Socket.IO           |
                  io.to(room).emit(...)        |
                  |                            |
         +--------+----------> blueprint-update|
         |                  (broadcast)        |
         |                                     |
      Recibir en listener                      |
      s.on('blueprint-update', upd)           |
         |                                     |
      drawAll(upd)                             |
      (renderizar punto)                       |
         |                                     |
         v                                     v
      Canvas actualizado              Canvas actualizado
```

---

## Scripts Disponibles

### Frontend (Raiz del Proyecto)

```bash
# Desarrollo
npm run dev         # Inicia Vite en puerto 5173

# Produccion
npm run build       # Genera carpeta dist/
npm run preview     # Vista previa de build

# Analisis de codigo
npm run lint        # ESLint check
```

### Backend Spring Boot

```bash
cd Lab_P2_Backend

# Desarrollo
mvn clean spring-boot:run    # Compila y ejecuta

# Produccion
mvn clean package            # Genera JAR
java -jar target/*.jar       # Ejecuta el JAR
```

---

## Consideraciones de Seguridad

### Estado Actual (Desarrollo)
- WebSockets funcionan sin autenticacion (para facilitar pruebas)
- CORS abierto a cualquier origen (*)
- Base de datos en memoria (no persistente)

### Para Produccion
- Implementar autenticacion JWT en WebSocket (Spring Security)
- Validar CORS solo para dominios conocidos
- Migrar a base de datos persistente (PostgreSQL/MongoDB)
- Usar WSS (WebSocket Secure) con SSL/TLS
- Rate limiting en eventos draw-event
- Implementar validacion de permisos por sala

---

## Referencias y Lecturas Recomendadas

- [Socket.IO Documentation](https://socket.io/docs/)
- [Spring WebSocket Guide](https://spring.io/guides/gs/messaging-stomp-websocket/)
- [STOMP Protocol Specs](https://stomp.github.io/stomp-specification-1.2.html)
- [React useEffect Hook](https://react.dev/reference/react/useEffect)
- [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## Licencia

Este proyecto esta licenciado bajo **Creative Commons Attribution-NonCommercial 4.0 International License** (CC-BY-NC 4.0).

Terminos simplificados:
- Compartir y adaptar el codigo
- Uso educativo permitido
- Uso comercial no permitido sin autorizacion
- Atribuir a los autores originales

Para mas informacion: [https://creativecommons.org/licenses/by-nc/4.0/](https://creativecommons.org/licenses/by-nc/4.0/)

---

## Contribuciones

Este es un proyecto educativo desarrollado en la **Escuela Colombiana de Ingenieria Julio Garavito**.

Para contribuciones o sugerencias:
1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## Soporte

Para reportar problemas o hacer preguntas:
- Email: [ana.fiquitiva-p@mail.escuelaing.edu.co](mailto:ana.fiquitiva-p@mail.escuelaing.edu.co)
- Issue Tracker: [GitHub Issues](https://github.com/AnaFiquitiva/Lab_P4_BluePrints_RealTime-Sokets/issues)

---

## Historial de Versiones

| Version | Fecha | Cambios |
|---------|-------|---------|
| **1.0.0** | Mar 19, 2026 | Version inicial con soporte Socket.IO y STOMP |

---

**Desarrollado en la Escuela Colombiana de Ingenieria Julio Garavito**

*Arquitectura de Software - ARSW*
