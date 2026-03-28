exports.handler = async () => {
  try {
    const res = await fetch('https://letterboxd.com/kaiscinema/rss/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error('failed');
    const body = await res.text();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
      body,
    };
  } catch (e) {
    return { statusCode: 500, body: '<e>failed</e>' };
  }
};
