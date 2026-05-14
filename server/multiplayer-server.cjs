const crypto = require('crypto');
const http = require('http');
const path = require('path');
const { getAccount } = require('./rankStore.cjs');

const PORT = Number(process.env.PORT || 8787);
const RANK_FILE = process.env.RANK_FILE || path.join(__dirname, '..', 'data', 'rank-points.json');

const clients = new Set();
let waiting = null;

function send(socket, message) {
  const payload = Buffer.from(JSON.stringify(message));
  const header = payload.length < 126
    ? Buffer.from([0x81, payload.length])
    : Buffer.from([0x81, 126, payload.length >> 8, payload.length & 0xff]);
  socket.write(Buffer.concat([header, payload]));
}

function closeClient(client) {
  clients.delete(client);
  if (waiting === client) waiting = null;
  try { client.socket.destroy(); } catch {}
}

function handleMessage(client, message) {
  if (message.type === 'joinQueue') {
    if (waiting && waiting !== client) {
      const opponent = waiting;
      waiting = null;
      const roomId = crypto.randomBytes(4).toString('hex');
      send(opponent.socket, { type: 'matched', roomId, side: 'PLAYER', opponent: client.account });
      send(client.socket, { type: 'matched', roomId, side: 'AI', opponent: opponent.account });
    } else {
      waiting = client;
      send(client.socket, { type: 'queued' });
    }
  }
}

function parseFrames(buffer) {
  const messages = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const second = buffer[offset + 1];
    let length = second & 0x7f;
    let cursor = offset + 2;
    if (length === 126) {
      if (cursor + 2 > buffer.length) break;
      length = buffer.readUInt16BE(cursor);
      cursor += 2;
    }
    const masked = Boolean(second & 0x80);
    const mask = masked ? buffer.subarray(cursor, cursor + 4) : null;
    if (masked) cursor += 4;
    if (cursor + length > buffer.length) break;
    const payload = buffer.subarray(cursor, cursor + length);
    const out = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) out[i] = masked ? payload[i] ^ mask[i % 4] : payload[i];
    messages.push(out.toString('utf8'));
    offset = cursor + length;
  }
  return messages;
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('ChessSummon multiplayer server\n');
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) return socket.destroy();
  const accept = crypto.createHash('sha1')
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest('base64');
  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '',
    '',
  ].join('\r\n'));

  const url = new URL(req.url, `http://${req.headers.host}`);
  const account = getAccount(RANK_FILE, url.searchParams.get('name'));
  const client = { socket, account };
  clients.add(client);
  send(socket, { type: 'account', account });

  socket.on('data', chunk => {
    for (const raw of parseFrames(chunk)) {
      try { handleMessage(client, JSON.parse(raw)); } catch {}
    }
  });
  socket.on('close', () => closeClient(client));
  socket.on('error', () => closeClient(client));
});

server.listen(PORT, () => {
  console.log(`ChessSummon multiplayer server: ws://localhost:${PORT}`);
  console.log(`Rank file: ${RANK_FILE}`);
});
