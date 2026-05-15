# Share Slides

Sync a PDF presentation across every device in the room. The presenter controls the page; participants follow via link or QR code.

## Quick start

```bash
npm install
npm run dev
```

- Web app: http://localhost:5173  
- API + WebSocket: http://localhost:3001  

## Flow

1. **Start presenting** → upload PDF (optional title + PIN).
2. Share the **QR code** or join link (`/j/roomId`) — no presenter secret in the QR.
3. Use **Next / Previous** or arrow keys when you have control.
4. Participants can **Take control** if the presenter allows it.

## Production (single server)

```bash
npm run preview   # build + start on port 3001
# open http://localhost:3001
```

Or:

```bash
npm run build
NODE_ENV=production PORT=3001 npm run start
```

The API and the React app are served from the same port.

## Deploy online (Render)

1. Push the repo to GitHub.
2. [render.com](https://render.com) → **New Web Service** → connect the repo.
3. Use the `render.yaml` in the repo (or set build: `npm install && npm run build`, start: `npm run start`).
4. Set **`PUBLIC_URL`** to your Render URL (e.g. `https://share-slides.onrender.com`).
5. Deploy. Participants and presenter use the same URL.

**Note:** On the free tier, the service sleeps when idle; uploaded PDFs are lost on redeploy (ephemeral disk). Fine for demos.

## Environment

| Variable     | Default                 | Description                          |
|-------------|-------------------------|--------------------------------------|
| `PORT`      | `3001`                  | Server port                          |
| `NODE_ENV`  | —                       | Set to `production` when deployed    |
| `WEB_ORIGIN`| `http://localhost:5173` | Extra CORS origin (dev)              |
| `PUBLIC_URL`| auto from request       | Public URL for join links & QR       |

## Security notes

- Presenter token is only in the presenter URL (`?t=...`), not in the QR.
- Optional room PIN for participants.
- Rooms expire after 24 hours (in-memory; restarts clear rooms).
- PDF access requires PIN or presenter token.

## Project layout

```
apps/server   Express + Socket.io + PDF upload
apps/web      Vite + React + PDF.js viewer
packages/shared  Shared message types
```
