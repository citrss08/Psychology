/* Vercel serverless function: POST /api/lin
   Keeps the Anthropic API key on the server. Set ANTHROPIC_API_KEY in
   Vercel → Project → Settings → Environment Variables (never in frontend code). */
'use strict';
const { respond } = require('../server/lin-core');

module.exports = async function handler(req, res) {
  let raw = req.body;
  if (raw === undefined || raw === null) {
    raw = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; if (data.length > 200000) req.destroy(); });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }
  const { status, json } = await respond(req, raw);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(json));
};
