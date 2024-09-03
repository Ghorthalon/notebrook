import { app } from "./app";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { attachEvents } from "./controllers/websocket-controller";
import { logger } from "./globals";
import selfSigned from "selfsigned";

const PORT = process.env.PORT || 3000;

const server = createServer(app);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  logger.info('Websocket client connected');

  attachEvents(ws);

  ws.on('message', (message: string) => {
    logger.info(`Received message: ${message}`);
  });

  ws.on('close', () => {
    logger.info('Websocket client disconnected');
  });
});

server.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

const getOrCreateCertificate = async () => {
  if (process.env.USE_SSL === '1') {
    if (!process.env.SSL_KEY || !process.env.SSL_CERT) {
      return await createSelfSignedSSLCert();
    }
    return {
      key: process.env.SSL_KEY,
      cert: process.env.SSL_CERT
    };
  }
  return null;
}

const createSelfSignedSSLCert = async () => {
  const selfsigned = await import('selfsigned');
  const pems = selfsigned.generate([{ name: 'Notebrook Self Signed Auto Generated Key', value: 'localhost' }], {
    keySize: 2048,
    days: 365
  });
  return {
    key: pems.private,
    cert: pems.cert
  };
}