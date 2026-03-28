exports.handler = async () => {
  const FEEDS = [
    'https://deadline.com/feed/',
    'https://www.hollywoodreporter.com/feed/',
    'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
  ];
  for (const url of FEEDS) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
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
    } catch (e) { continue; }
  }
  return { statusCode: 500, body: '<e>failed</e>' };
};
