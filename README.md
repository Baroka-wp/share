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

## Environment

| Variable     | Default                 | Description                          |
|-------------|-------------------------|--------------------------------------|
| `PORT`      | `3001`                  | Server port                          |
| `WEB_ORIGIN`| `http://localhost:5173` | CORS origin for the web app          |
| `PUBLIC_URL`| same as web             | Base URL in API responses (join link)|

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
