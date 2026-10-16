const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 3000);
const GAME_FILE = path.join(__dirname, 'sheep-river-3d_4.html');
const MAX_PLAYERS = 8;
const MAX_NAME_LENGTH = 16;
const rooms = new Map();

function roomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}
function seed() {
  return crypto.randomBytes(4).readUInt32LE(0);
}
function cleanName(value) {
  const name = String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME_LENGTH);
  return name || '无名小羊';
}
function cleanRoomCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}
function json(socket, message) {
  if (socket.destroyed) return;
  const payload = Buffer.from(JSON.stringify(message));
  const header = payload.length < 126 ? Buffer.from([0x81, payload.length]) : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 0xff]);
  socket.write(Buffer.concat([header, payload]));
}
function roster(room) {
  return [...room.players.values()].map(player => ({
    id: player.id, name: player.name, color: player.color, connected: player.connected, completed: player.completed, rank: player.rank, state: player.state
  }));
}
function broadcast(room, message) {
  room.players.forEach(player => json(player.socket, message));
}
function syncRoom(room) {
  broadcast(room, { type: 'room', code: room.code, hostId: room.hostId, phase: room.phase, levelIdx: room.levelIdx, levelSeed: room.levelSeed, players: roster(room) });
}
function removePlayer(player) {
  const room = player.room;
  if (!room) return;
  room.players.delete(player.id);
  if (room.hostId === player.id) room.hostId = room.players.keys().next().value || null;
  if (room.players.size === 0) rooms.delete(room.code);
  else syncRoom(room);
}
function makePlayer(socket, message) {
  return {
    id: crypto.randomUUID(), socket, room: null, name: cleanName(message.name), color: ['#d8b27a', '#94c6df', '#d99292', '#a8cb8c', '#cab0e4', '#e8c879', '#87c7bd', '#e0a0c1'][Math.floor(Math.random() * 8)],
    connected: true, completed: false, rank: null,
    state: { x: 0, y: 0, z: 0, dir: 'fwd', jumping: false, visible: true, levelIdx: 0 }
  };
}
function join(socket, message, create) {
  const code = create ? roomCode() : cleanRoomCode(message.roomCode);
  let room = rooms.get(code);
  if (create) {
    room = { code, hostId: null, phase: 'lobby', levelIdx: 0, levelSeed: seed(), finishOrder: [], players: new Map() };
    rooms.set(code, room);
  }
  if (!room) return json(socket, { type: 'error', message: '找不到这个房间，请检查房间码。' });
  if (room.phase !== 'lobby') return json(socket, { type: 'error', message: '游戏已开始，请等待下一轮。' });
  if (room.players.size >= MAX_PLAYERS) return json(socket, { type: 'error', message: '房间已满（最多 8 人）。' });
  const player = makePlayer(socket, message);
  player.room = room;
  room.players.set(player.id, player);
  if (!room.hostId) room.hostId = player.id;
  socket.player = player;
  json(socket, { type: 'joined', id: player.id, code: room.code, hostId: room.hostId, levelIdx: room.levelIdx, levelSeed: room.levelSeed });
  syncRoom(room);
}
function validState(input) {
  if (!input || typeof input !== 'object') return null;
  const number = value => Number.isFinite(value) ? Math.max(-100, Math.min(100, value)) : 0;
  return {
    x: number(input.x), y: number(input.y), z: number(input.z),
    dir: ['fwd', 'back', 'left', 'right'].includes(input.dir) ? input.dir : 'fwd',
    jumping: Boolean(input.jumping), visible: input.visible !== false,
    levelIdx: Number.isInteger(input.levelIdx) ? input.levelIdx : 0
  };
}
function handleMessage(socket, raw) {
  let message;
  try { message = JSON.parse(raw); } catch { return json(socket, { type: 'error', message: '无效消息。' }); }
  if (message.type === 'create') return join(socket, message, true);
  if (message.type === 'join') return join(socket, message, false);
  const player = socket.player;
  if (!player || !player.room) return;
  const room = player.room;
  if (message.type === 'start') {
    if (player.id !== room.hostId) return json(socket, { type: 'error', message: '只有房主可以开始游戏。' });
    room.phase = 'playing'; room.levelIdx = 0; room.levelSeed = seed(); room.finishOrder = [];
    room.players.forEach(p => { p.completed = false; p.rank = null; p.state = { x: 0, y: 0, z: 0, dir: 'fwd', jumping: false, visible: true, levelIdx: 0 }; });
    syncRoom(room);
    return;
  }
  if (message.type === 'state' && room.phase === 'playing') {
    const state = validState(message.state);
    if (!state || state.levelIdx !== room.levelIdx) return;
    player.state = state;
    broadcast(room, { type: 'playerState', id: player.id, state });
    return;
  }
  if (message.type === 'complete' && room.phase === 'playing' && Number(message.levelIdx) === room.levelIdx) {
    if (player.completed) return;
    player.completed = true; player.rank = room.finishOrder.length + 1; room.finishOrder.push(player.id);
    syncRoom(room);
    if (![...room.players.values()].every(p => p.completed)) return;
    if (room.levelIdx >= 2) {
      room.phase = 'complete';
      syncRoom(room);
      return;
    }
    room.levelIdx += 1; room.levelSeed = seed(); room.finishOrder = [];
    room.players.forEach(p => { p.completed = false; p.rank = null; p.state = { x: 0, y: 0, z: 0, dir: 'fwd', jumping: false, visible: true, levelIdx: room.levelIdx }; });
    syncRoom(room);
  }
}
function decodeFrames(socket, chunk) {
  socket.buffer = Buffer.concat([socket.buffer || Buffer.alloc(0), chunk]);
  while (socket.buffer.length >= 2) {
    const first = socket.buffer[0], second = socket.buffer[1], opcode = first & 0x0f;
    let offset = 2, length = second & 0x7f;
    if (length === 126) { if (socket.buffer.length < 4) return; length = socket.buffer.readUInt16BE(2); offset = 4; }
    if (length === 127 || socket.buffer.length < offset + 4 + length) return;
    const mask = socket.buffer.subarray(offset, offset + 4); offset += 4;
    const data = Buffer.from(socket.buffer.subarray(offset, offset + length));
    for (let i = 0; i < data.length; i++) data[i] ^= mask[i % 4];
    socket.buffer = socket.buffer.subarray(offset + length);
    if (opcode === 0x8) return socket.end();
    if (opcode === 0x9) socket.write(Buffer.from([0x8a, data.length, ...data]));
    if (opcode === 0x1) handleMessage(socket, data.toString('utf8'));
  }
}
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname !== '/' && pathname !== '/sheep-river-3d_4.html') { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  fs.createReadStream(GAME_FILE).pipe(res);
});
server.on('upgrade', (req, socket) => {
  if (req.url !== '/ws' || req.headers.upgrade?.toLowerCase() !== 'websocket') return socket.destroy();
  const key = req.headers['sec-websocket-key'];
  if (!key) return socket.destroy();
  const accept = crypto.createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  socket.on('data', data => decodeFrames(socket, data));
  socket.on('close', () => { if (socket.player) removePlayer(socket.player); });
  socket.on('error', () => {});
});
server.listen(PORT, () => console.log(`小羊过河多人房间服务已启动：http://localhost:${PORT}`));
