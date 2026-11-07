// Fetches Pexels search results on the server so the API key never reaches the browser.
// The key is read from PEXELS_API_KEY (set in Netlify's environment variables),
// falling back to REACT_APP_API_KEY from the local .env file during development.

exports.handler = async (event) => {
  const apiKey = process.env.PEXELS_API_KEY || process.env.REACT_APP_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Pexels API key is not set" }) };
  }

  const { query = "", page = "1" } = event.queryStringParameters || {};
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${encodeURIComponent(page)}&per_page=36`;

  try {
    const response = await fetch(url, { headers: { Authorization: apiKey } });
    const result = await response.json();
    // Only the colors are needed, so only the colors are sent back.
    const photos = (result.photos || []).map((photo) => ({ avg_color: photo.avg_color }));
    return {
      statusCode: response.ok ? 200 : response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos }),
    };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "Could not reach Pexels" }) };
  }
};
