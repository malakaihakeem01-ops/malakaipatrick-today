const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

async function getAccessToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  });
  return res.json();
}

async function getRecentlyPlayed(token) {
  const res = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function getCurrentlyPlaying(token) {
  const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return null;
  return res.json();
}

exports.handler = async () => {
  try {
    const { access_token } = await getAccessToken();
    const [current, recent] = await Promise.all([
      getCurrentlyPlaying(access_token),
      getRecentlyPlayed(access_token),
    ]);

    let nowPlaying = null;
    if (current && current.item) {
      nowPlaying = {
        isPlaying: current.is_playing,
        title: current.item.name,
        artist: current.item.artists.map(a => a.name).join(', '),
        album: current.item.album.name,
        albumArt: current.item.album.images[0]?.url,
        preview: current.item.preview_url,
        url: current.item.external_urls.spotify,
      };
    }

    const recentTracks = recent.items?.slice(0, 5).map(item => ({
      title: item.track.name,
      artist: item.track.artists.map(a => a.name).join(', '),
      album: item.track.album.name,
      albumArt: item.track.album.images[1]?.url,
      preview: item.track.preview_url,
      url: item.track.external_urls.spotify,
      playedAt: item.played_at,
    })) || [];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ nowPlaying, recentTracks }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
