import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

// Serve client dist if built
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// Fallback to client index.html for SPA routing in standalone/local mode
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start server if not running inside a serverless runtime
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`AeroShield AI Server running on port ${PORT}`);
  });
}

export default app;
