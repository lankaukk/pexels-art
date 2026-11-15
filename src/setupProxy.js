// Lets `npm start` serve the same Netlify Function the live site uses,
// so local development keeps working without the Netlify CLI.
const fs = require("fs");
const path = require("path");
const { handler } = require("../netlify/functions/pexels");

module.exports = function (app) {
  // Serve the pigeon family tree at /pigeons like the live site does
  // (`npm start` otherwise only serves public files under /notapipe).
  const express = require("express");
  app.get("/pigeons", (req, res, next) =>
    req.path === "/pigeons"
      ? res.sendFile(path.join(__dirname, "../public/pigeons/index.html"))
      : next()
  );
  app.use("/pigeons", express.static(path.join(__dirname, "../public/pigeons")));

  app.get("/.netlify/functions/pexels", async (req, res) => {
    const result = await handler({ queryStringParameters: req.query });
    res.status(result.statusCode).set(result.headers || {}).send(result.body);
  });

  // A stand-in for the likes function (netlify/functions/likes.mjs), which
  // needs Netlify's storage: likes go to .likes-dev.json, and
  // /.netlify/functions/likes lists them
  const likesFile = path.join(__dirname, "../.likes-dev.json");
  const readLikes = () => {
    try {
      return JSON.parse(fs.readFileSync(likesFile, "utf8"));
    } catch {
      return [];
    }
  };
  app.post("/.netlify/functions/likes", (req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { liked } = JSON.parse(body);
        if (typeof liked !== "boolean") throw new Error("expected liked");
        const likes = readLikes();
        likes.push({ liked, at: new Date().toISOString(), city: "Local", region: null, country: null });
        fs.writeFileSync(likesFile, JSON.stringify(likes, null, 2) + "\n");
        res.status(204).end();
      } catch (err) {
        res.status(400).send(err.message);
      }
    });
  });
  app.get("/.netlify/functions/likes", (req, res) => {
    const likes = readLikes();
    res.json({ count: likes.reduce((n, e) => n + (e.liked ? 1 : -1), 0), likes });
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
