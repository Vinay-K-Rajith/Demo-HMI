import express from 'express';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the root folder or backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function startServer() {
  const app = express();
  app.use(cors());

  // Simple health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  const isProd = process.env.NODE_ENV === 'production';
  let viteDevServer: any = null;

  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);

  if (isProd) {
    const distPath = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.url.startsWith('/health') || req.url.startsWith('/ws-live')) {
        return next();
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    console.log('[Server] Initializing Vite dev server in middleware mode...');
    const { createServer: createViteServer } = await import('vite');
    viteDevServer = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server } // Attach Vite HMR to our HTTP server
      },
      appType: 'spa',
      root: path.resolve(__dirname, '../../frontend'),
    });
    app.use(viteDevServer.middlewares);
  }

  app.use(express.json());

  // Create WebSocket server for the HMI dashboard client
  const wss = new WebSocketServer({ noServer: true });

  // Attach WS server to the HTTP server
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
    if (pathname === '/ws-live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Do not call socket.destroy() here to allow Vite's HMR websocket upgrades to connect
  });

wss.on('connection', (clientWs: WebSocket) => {
  console.log('[Server] HMI Client connected. Initializing Gemini Live session...');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[Server] ERROR: GEMINI_API_KEY is not defined in the environment variables.');
    clientWs.send(JSON.stringify({
      error: 'GEMINI_API_KEY is not set on the server. Please configure your environment.'
    }));
    clientWs.close();
    return;
  }

  // Connect to Google's Gemini Live WebSocket API
  // Use gemini-3.1-flash-live-preview as requested.
  const geminiModel = 'models/gemini-3.1-flash-live-preview';
  const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
  
  console.log(`[Server] Connecting to Gemini Live API at ${geminiUrl.substring(0, 60)}...`);
  const geminiWs = new WebSocket(geminiUrl);

  let isGeminiOpen = false;
  const messageQueue: any[] = [];

  // When backend establishes connection with Google's Gemini Live API
  geminiWs.on('open', () => {
    console.log('[Server] Connected to Gemini Live API. Sending setup message...');
    isGeminiOpen = true;

    // Send setup configuration message
    const setupMessage = {
      setup: {
        model: geminiModel,
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede' // Aoede is a premium clear voice (alternatives: Puck, Charon, Fenrir, Kore)
              }
            }
          }
        },
        systemInstruction: {
          parts: [
            {
              text: `You are Genie, a real-life Jarvis-like AI voice assistant built into the Volta next-generation EV vehicle dashboard (HMI).
The user is driving. You have eyes on the dashboard screen (sent to you as video/jpeg frames) and you can hear the user's speech.
Your voice is Aoede. You must act as the car's intelligent assistant.
Your responses must be conversational, clear, extremely concise, and helpful. You are aware of the dashboard state.
Refer to the current dashboard state in your insights when relevant (e.g. speed, battery charge SoC, distance to obstacles, active lane visualizer, climate settings, route map guidance).
Keep your answers brief (1-3 sentences) so that they are safe and readable for a driver. Keep it professional yet friendly, like Jarvis. Refrain from long speeches unless requested.
You should call yourself Genie, your are life Jarvis.`
            }
          ]
        }
      }
    };

    geminiWs.send(JSON.stringify(setupMessage));

    // Send any queued messages that client sent before Gemini connection opened
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      geminiWs.send(msg);
    }

    // Notify client connection is ready
    clientWs.send(JSON.stringify({ status: 'ready', message: 'Genie is now online and listening' }));
  });

  // When backend receives data from Google's Gemini Live API
  geminiWs.on('message', (data: any) => {
    // Forward the message directly back to the HMI Client
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data.toString());
    }
  });

  // When client sends data to the backend
  clientWs.on('message', (message: any) => {
    const rawMessage = message.toString();
    
    if (isGeminiOpen && geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.send(rawMessage);
    } else {
      // Queue up messages if the Gemini socket is not open yet
      messageQueue.push(rawMessage);
    }
  });

  geminiWs.on('error', (err) => {
    console.error('[Server] Gemini WS error:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: 'Gemini Live session error occurred' }));
    }
  });

  clientWs.on('error', (err) => {
    console.error('[Server] Client WS error:', err);
  });

  // Connection tear down
  geminiWs.on('close', (code, reason) => {
    console.log(`[Server] Gemini connection closed (Code: ${code}, Reason: ${reason})`);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
  });

  clientWs.on('close', () => {
    console.log('[Server] Client connection closed. Terminating Gemini Live session...');
    if (geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.close();
    }
  });
});

  server.listen(PORT, () => {
    console.log(`[Server] Running HMI Monorepo backend on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start server:', err);
});
