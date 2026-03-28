const { expressjwt: jwt } = require("express-jwt");

function authJwt() {
  const secret = process.env.JSON_WEB_TOKEN_SECRET_KEY;

  return jwt({
    secret,
    algorithms: ["HS256"],
    isRevoked
  }).unless({
    path: [
      { url: /\/api\/user\/signin/, methods: ["POST"] },
      { url: /\/api\/user\/signup/, methods: ["POST"] },
      { url: /\/api\/user\/send-otp/, methods: ["POST"] },
      { url: /\/api\/user\/authWithGoogle/, methods: ["POST"] },

      { url: /\/uploads(.*)/, methods: ["GET"] },
      { url: /\/api\/product(.*)/, methods: ["GET"] },
      { url: /\/api\/category(.*)/, methods: ["GET"] },
      { url: /\/api\/subCat(.*)/, methods: ["GET"] }
    ]
  });
}

async function isRevoked(req, token) {
  return false;
}

module.exports = authJwt;