# Questify — public deployment

This project is a Discord OAuth2 sign-in demo and manual Quest checklist. It does **not**
automate Discord Quests, simulate gameplay/video views, or claim rewards.

## Deploy publicly with Render

1. Create a GitHub repository and upload all project files (including `render.yaml`).
2. In Render, choose **New → Blueprint** and connect that GitHub repository.
   Alternatively choose **New → Web Service**, then set Build Command to `npm install`
   and Start Command to `npm start`.
3. Add the environment variables in the Render service:
   - `SESSION_SECRET`: a long random secret (Render can generate one).
   - `DISCORD_CLIENT_ID`: from your Discord Developer Portal application.
   - `DISCORD_CLIENT_SECRET`: from the same application; keep it private.
   - `DISCORD_REDIRECT_URI`: `https://YOUR-SERVICE.onrender.com/auth/discord/callback`
4. Copy the exact `DISCORD_REDIRECT_URI` into your Discord application's
   OAuth2 → Redirects list and save.
5. Redeploy the Render service, then open its public `https://...onrender.com` URL.

## Important notes

- Never ask users for their Discord password or personal account token.
- OAuth2 client secrets belong only in Render environment variables, never in frontend code
  or a public GitHub repository.
- The included Express session store is in-memory and intended for a small demo. Sessions
  may be lost when the service restarts. Use a persistent session store before production use.
- Render free web services can sleep after inactivity and may take about a minute to wake.
