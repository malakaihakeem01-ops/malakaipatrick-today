// netlify/functions/leaderboard.js
const BIN_URL = 'https://api.jsonbin.io/v3/b/';
const BIN_ID = process.env.JSONBIN_ID;
const API_KEY = process.env.JSONBIN_KEY;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const type = event.queryStringParameters?.type || 'scores';

  try {
    // GET - fetch data
    if (event.httpMethod === 'GET') {
      const res = await fetch(BIN_URL + BIN_ID + '/latest', {
        headers: { 'X-Master-Key': API_KEY }
      });
      const data = await res.json();
      const record = data.record || {};

      if (type === 'sticky') {
        return { statusCode: 200, headers, body: JSON.stringify({ count: record.count || 0, notes: record.notes || [] }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify(record.scores || []) };
    }

    // POST - save data
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);

      // Get current record
      const getRes = await fetch(BIN_URL + BIN_ID + '/latest', { headers: { 'X-Master-Key': API_KEY } });
      const getData = await getRes.json();
      const record = getData.record || { scores: [], notes: [], count: 0 };

      if (type === 'sticky') {
        // Add note
        if (body.note) {
          record.notes = record.notes || [];
          record.notes.push({
            name: (body.note.name || 'Anonymous').substring(0, 30),
            msg: (body.note.msg || '').substring(0, 100),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          });
          if (record.notes.length > 50) record.notes = record.notes.slice(-50);
        }
        // Bump count
        if (body.bump) record.count = (record.count || 0) + 1;
      } else {
        // Add score
        const { name, score, level } = body;
        if (!name || !score) return { statusCode: 400, headers, body: 'Missing fields' };
        record.scores = record.scores || [];
        record.scores.push({
          name: name.substring(0, 20).replace(/[<>]/g, ''),
          score: parseInt(score),
          level: parseInt(level) || 1,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
        record.scores.sort((a, b) => b.score - a.score);
        record.scores = record.scores.slice(0, 20);
      }

      // Save back
      await fetch(BIN_URL + BIN_ID, {
        method: 'PUT',
        headers: { 'X-Master-Key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });

      const rank = type !== 'sticky' ? record.scores.findIndex(s => s.name === body.name && s.score === parseInt(body.score)) + 1 : null;
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, rank }) };
    }
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
