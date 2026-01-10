module.exports = function (req, res, next) {
  const apiKey = req.header("x-api-key");
  const validKey = process.env.API_KEY;

  if (!apiKey || apiKey !== validKey) {
    return res.status(401).send("Security Violation")
  }

  next();
};
