// Lets `npm start` serve the same Netlify Function the live site uses,
// so local development keeps working without the Netlify CLI.
const fs = require("fs");
const path = require("path");
const { handler } = require("../netlify/functions/pexels");

module.exports = function (app) {
  app.get("/.netlify/functions/pexels", async (req, res) => {
    const result = await handler({ queryStringParameters: req.query });
    res.status(result.statusCode).set(result.headers || {}).send(result.body);
  });

  // Studio mode's "Save to site" button (SmudgedSpoiler.js): writes the
  // smudge strokes into src/spoilerStrokes.json. Only exists under `npm start`.
  app.post("/__studio/spoiler-strokes", (req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const strokes = JSON.parse(body);
        if (!Array.isArray(strokes)) throw new Error("expected a list of strokes");
        fs.writeFileSync(
          path.join(__dirname, "spoilerStrokes.json"),
          JSON.stringify(strokes) + "\n"
        );
        res.json({ saved: strokes.length });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
  });
};
