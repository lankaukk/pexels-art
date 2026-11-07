// Lets `npm start` serve the same Netlify Function the live site uses,
// so local development keeps working without the Netlify CLI.
const { handler } = require("../netlify/functions/pexels");

module.exports = function (app) {
  app.get("/.netlify/functions/pexels", async (req, res) => {
    const result = await handler({ queryStringParameters: req.query });
    res.status(result.statusCode).set(result.headers || {}).send(result.body);
  });
};
