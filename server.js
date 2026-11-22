require("dotenv").config();

const express = require("express");
const session = require("express-session");
const crypto = require("crypto");
const path = require("path");

const app = express();
// Render terminates HTTPS at its proxy; trust it so secure session cookies work.
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

const required = [
  "SESSION_SECRET",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_REDIRECT_URI"
];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

app.use(session({
  name: "questify.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(express.static(path.join(__dirname, "public")));

app.get("/auth/discord", (req, res) => {
  const state = crypto.randomBytes(24).toString("hex");
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state
  });

  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

app.get("/auth/discord/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) return res.redirect("/?login=cancelled");
  if (!code || !state || state !== req.session.oauthState) {
    return res.status(400).send("OAuth state validation failed. Please try again.");
  }
  delete req.session.oauthState;

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Discord token exchange failed:", tokenData);
      return res.status(502).send("Discord sign-in failed. Please try again.");
    }

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const user = await userResponse.json();

    if (!userResponse.ok) {
      console.error("Discord profile request failed:", user);
      return res.status(502).send("Could not retrieve your Discord profile.");
    }

    // Keep only basic profile details in the session. Never send access tokens to the browser.
    req.session.user = {
      id: user.id,
      username: user.global_name || user.username,
      avatar: user.avatar
    };

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Unexpected sign-in error.");
  }
});

app.get("/api/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("questify.sid");
    res.json({ ok: true });
  });
});

app.listen(PORT, () => {
  console.log(`Questify running at http://localhost:${PORT}`);
});