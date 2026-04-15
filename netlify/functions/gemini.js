const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    console.log('API key present:', !!apiKey);
    console.log('API key length:', apiKey ? apiKey.length : 0);

    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'GEMINI_API_KEY not set' }) };
    }

    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        console.log('Gemini status:', res.statusCode);
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log('Gemini response:', body.substring(0, 300));
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('Invalid JSON: ' + body)); }
        });
      });

      req.on('error', (e) => {
        console.log('Request error:', e.message);
        reject(e);
      });
      req.write(payload);
      req.end();
    });

    return { statusCode: 200, headers, body: JSON.stringify(data) };

  } catch (err) {
    console.log('Handler error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
