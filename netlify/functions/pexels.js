// Fetches Pexels search results on the server so the API key never reaches the browser.
// The key is read from PEXELS_API_KEY (set in Netlify's environment variables),
// falling back to REACT_APP_API_KEY from the local .env file during development.

exports.handler = async (event) => {
  const apiKey = process.env.PEXELS_API_KEY || process.env.REACT_APP_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Pexels API key is not set" }) };
  }

  const { query = "", page = "1" } = event.queryStringParameters || {};
  // The 16:9 canvas is a 16 x 9 grid of squares: 144 colors. Pexels caps a request
  // at 80 photos, so each artwork page is two Pexels pages of 72.
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const pexelsPages = [pageNumber * 2 - 1, pageNumber * 2];
  const urlFor = (p) =>
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${p}&per_page=72`;

  try {
    const responses = await Promise.all(
      pexelsPages.map((p) => fetch(urlFor(p), { headers: { Authorization: apiKey } }))
    );
    const failed = responses.find((response) => !response.ok);
    const results = await Promise.all(responses.map((response) => response.json()));
    // Only the colors are needed, so only the colors are sent back.
    const photos = results
      .flatMap((result) => result.photos || [])
      .map((photo) => ({ avg_color: photo.avg_color }));
    return {
      statusCode: failed ? failed.status : 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos }),
    };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "Could not reach Pexels" }) };
  }
};
