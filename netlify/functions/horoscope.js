// netlify/functions/horoscope.js
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const sign = event.queryStringParameters?.sign || 'scorpio';
  const validSigns = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  if (!validSigns.includes(sign)) return { statusCode: 400, headers, body: 'Invalid sign' };

  try {
    const res = await fetch(`https://api.api-ninjas.com/v1/horoscope?zodiac=${sign}`, {
      headers: { 'X-Api-Key': process.env.NINJA_API_KEY }
    });
    const data = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
