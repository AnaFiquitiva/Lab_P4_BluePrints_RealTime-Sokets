import { io } from 'socket.io-client'

export function createSocket(baseUrl) {
  const socket = io(baseUrl, { 
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  })
  return socket
}
