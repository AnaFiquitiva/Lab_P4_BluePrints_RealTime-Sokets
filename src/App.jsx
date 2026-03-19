import { useEffect, useRef, useState } from 'react'
import { createStompClient, subscribeBlueprint } from './lib/stompClient.js'
import { createSocket } from './lib/socketIoClient.js'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'
const IO_BASE  = import.meta.env.VITE_IO_BASE  ?? 'http://localhost:3001'

export default function App() {
  const [tech, setTech] = useState('stomp')
  const [author, setAuthor] = useState('juan')
  const [name, setName] = useState('plano-1')
  
  
  const [blueprintsList, setBlueprintsList] = useState([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [currentBlueprint, setCurrentBlueprint] = useState(null)
  
  const canvasRef = useRef(null)

  const stompRef = useRef(null)
  const unsubRef = useRef(null)
  const socketRef = useRef(null)

  
  useEffect(() => {
    if (!author) return;
    fetchBlueprintsList(author);
  }, [author, tech])
  
  const fetchBlueprintsList = async (authorName) => {
    try {
      const baseUrl = tech === 'stomp' ? API_BASE : IO_BASE;
      const res = await fetch(`${baseUrl}/api/blueprints?author=${authorName}`);
      if (res.ok) {
        const data = await res.json();
        setBlueprintsList(data);
        
        
        const total = data.reduce((acc, bp) => acc + (bp.points?.length || 0), 0);
        setTotalPoints(total);
      } else {
        setBlueprintsList([]);
        setTotalPoints(0);
      }
    } catch (e) {
      console.error("Error fetching blueprints list", e);
      setBlueprintsList([]);
      setTotalPoints(0);
    }
  }

  
  useEffect(() => {
    if (!author || !name) return;
    const baseUrl = tech === 'stomp' ? API_BASE : IO_BASE;
    fetch(`${baseUrl}/api/blueprints/${author}/${name}`)
      .then(r => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(data => {
        setCurrentBlueprint(data);
        drawAll(data);
      })
      .catch(e => {
        console.error("Blueprint not found", e);
        setCurrentBlueprint(null);
        drawAll({ points: [] });
      })
  }, [tech, author, name])

  function drawAll(bp) {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0,0,800,500)
    ctx.beginPath()
    if (bp && bp.points) {
      bp.points.forEach((p,i)=> {
        if (i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y)
      })
    }
    ctx.stroke()
  }

  
  useEffect(() => {
    unsubRef.current?.(); unsubRef.current = null
    stompRef.current?.deactivate?.(); stompRef.current = null
    socketRef.current?.disconnect?.(); socketRef.current = null

    if (tech === 'stomp') {
      const client = createStompClient(API_BASE)
      stompRef.current = client
      client.onConnect = () => {
        unsubRef.current = subscribeBlueprint(client, author, name, (upd) => {
          if (upd.points) {
            setCurrentBlueprint(upd);
            drawAll(upd)
          } 
          else if (upd.x !== undefined && upd.y !== undefined) {
             setCurrentBlueprint(prev => {
                const newBp = { ...prev, points: [...(prev?.points || []), upd] };
                drawAll(newBp);
                return newBp;
             });
          }
        })
      }
      client.activate()
    } else {
      const s = createSocket(IO_BASE)
      socketRef.current = s
      const room = `blueprints.${author}.${name}`
      
      // ESPERAR a que esté conectado antes de hacer cualquier cosa
      s.on('connect', () => {
        console.log('[Socket.IO] Conectado! Uniéndose a sala:', room)
        s.emit('join-room', room)
      })
      
      s.on('blueprint-update', (upd) => {
          console.log('[Socket.IO] blueprint-update recibido:', upd)
          if (upd.points) {
             setCurrentBlueprint(upd);
             drawAll(upd);
          } else {
             setCurrentBlueprint(prev => {
                const newBp = { ...prev, points: [...(prev?.points || []), upd] };
                drawAll(newBp);
                return newBp;
             });
          }
      })
      
      s.on('connect_error', (err) => {
        console.error('[Socket.IO] Error de conexión:', err)
      })
      
      s.on('disconnect', () => {
        console.log('[Socket.IO] Desconectado')
      })
    }
    
    return () => {
      unsubRef.current?.(); unsubRef.current = null
      stompRef.current?.deactivate?.()
      socketRef.current?.disconnect?.()
    }
  }, [tech, author, name])

  
  function onClick(e) {
    if (!currentBlueprint) return;
    
    const rect = e.target.getBoundingClientRect()
    const point = { x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) }

    const updatedBp = { ...currentBlueprint, points: [...(currentBlueprint.points || []), point] };
    setCurrentBlueprint(updatedBp);
    drawAll(updatedBp);

    if (tech === 'stomp' && stompRef.current?.connected) {
      console.log('[STOMP] Enviando punto:', point)
      stompRef.current.publish({ destination: '/app/draw', body: JSON.stringify({ author, name, point }) })
    } else if (tech === 'socketio') {
      if (socketRef.current?.connected) {
        const room = `blueprints.${author}.${name}`
        console.log('[Socket.IO] Enviando punto a sala', room, ':', point)
        socketRef.current.emit('draw-event', { room, author, name, point })
      } else {
        console.warn('[Socket.IO] Socket NO está conectado. Estado:', socketRef.current?.readyState)
      }
    }
  }

  
  const handleCreateBlueprint = async () => {
    const newName = prompt("Enter new blueprint name:");
    if (!newName) return;
    
    const newBp = { author: author, name: newName, points: [] };
    const baseUrl = tech === 'stomp' ? API_BASE : IO_BASE;
    try {
      await fetch(`${baseUrl}/api/blueprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBp)
      });
      fetchBlueprintsList(author);
      setName(newName);
    } catch(e) {
      console.error("Error creating blueprint", e);
    }
  };

  const handleSaveBlueprint = async () => {
    if (!currentBlueprint) return;
    const baseUrl = tech === 'stomp' ? API_BASE : IO_BASE;
    try {
      await fetch(`${baseUrl}/api/blueprints/${author}/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentBlueprint)
      });
      alert('Blueprint saved!');
      fetchBlueprintsList(author);
    } catch (e) {
      console.error("Error saving blueprint", e);
    }
  };

  const handleDeleteBlueprint = async () => {
    if (!currentBlueprint) return;
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    const baseUrl = tech === 'stomp' ? API_BASE : IO_BASE;
    try {
      await fetch(`${baseUrl}/api/blueprints/${author}/${name}`, {
        method: 'DELETE'
      });
      alert('Blueprint deleted!');
      fetchBlueprintsList(author);
      setCurrentBlueprint(null);
      drawAll({ points: [] });
      setName('');
    } catch (e) {
      console.error("Error deleting blueprint", e);
    }
  };

  return (
    <div style={{fontFamily:'Inter, system-ui', padding:24, maxWidth:1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px'}}>
      
  
      <div style={{display:'flex', gap:20, alignItems:'center', background: '#f5f5f5', padding: '16px', borderRadius: '8px'}}>
        <div>
           <h2 style={{margin: 0, color: '#333'}}>BluePrints RT</h2>
           <p style={{margin: '4px 0 0 0', opacity:.7, fontSize: '0.9em'}}>Colaboración en tiempo real</p>
        </div>
        <div style={{flex: 1}}></div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <label style={{fontWeight: 'bold'}}>Tecnología RT:</label>
          <select value={tech} onChange={e=>setTech(e.target.value)} style={{padding: '6px', borderRadius: '4px'}}>
            <option value="stomp">STOMP (Spring/8080)</option>
            <option value="socketio">Socket.IO (Node/3001)</option>
          </select>
        </div>
      </div>

      <div style={{display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
  
        <div style={{flex: '1', minWidth: '300px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '16px'}}>
          <div style={{display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center'}}>
             <label style={{fontWeight: 'bold'}}>Author:</label>
             <input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Type author name..." style={{padding: '6px', width: '100%', borderRadius: '4px', border: '1px solid #ccc'}}/>
          </div>
          
          <button onClick={() => fetchBlueprintsList(author)} style={{padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%', marginBottom: '16px'}}>Get Blueprints</button>

          <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '16px'}}>
            <thead>
              <tr style={{background: '#f8f9fa'}}>
                <th style={{padding: '8px', borderBottom: '2px solid #dee2e6', textAlign: 'left'}}>Blueprint Name</th>
                <th style={{padding: '8px', borderBottom: '2px solid #dee2e6', textAlign: 'center'}}>Points</th>
                <th style={{padding: '8px', borderBottom: '2px solid #dee2e6', textAlign: 'center'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {blueprintsList.map(bp => (
                <tr key={bp.name}>
                  <td style={{padding: '8px', borderBottom: '1px solid #eee'}}>{bp.name}</td>
                  <td style={{padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center'}}>{bp.points?.length || 0}</td>
                  <td style={{padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center'}}>
                    <button onClick={() => setName(bp.name)} style={{padding: '4px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{fontWeight: 'bold', textAlign: 'right', marginBottom: '16px', fontSize: '1.1em'}}>
            Total user points: {totalPoints}
          </div>
          
          <button onClick={handleCreateBlueprint} style={{padding: '8px 12px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%'}}>Create New Blueprint</button>
        </div>

  
        <div style={{flex: '2'}}>
           <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h3 style={{margin: 0}}>Current Blueprint: {name || 'None'}</h3>
              <div style={{display: 'flex', gap: '8px'}}>
                 <button onClick={handleSaveBlueprint} disabled={!currentBlueprint} style={{padding: '8px 16px', background: currentBlueprint ? '#28a745' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: currentBlueprint ? 'pointer' : 'not-allowed'}}>Save / Update</button>
                 <button onClick={handleDeleteBlueprint} disabled={!currentBlueprint} style={{padding: '8px 16px', background: currentBlueprint ? '#dc3545' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: currentBlueprint ? 'pointer' : 'not-allowed'}}>Delete</button>
              </div>
           </div>
           
           <div style={{position: 'relative'}}>
             <canvas
               ref={canvasRef}
               width={800}
               height={500}
               style={{border:'2px solid #333', borderRadius:8, background: '#fafafa', cursor: 'crosshair', display: 'block', width: '100%'}}
               onClick={onClick}
             />
             {!currentBlueprint && (
                <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', fontSize: '1.2em', color: '#666'}}>
                   Select or create a blueprint to start drawing
                </div>
             )}
           </div>
           <p style={{opacity:.7, marginTop:8}}>Tip: abre 2 pestañas y dibuja alternando para ver la colaboración RT.</p>
        </div>
      </div>
    </div>
  )
}
