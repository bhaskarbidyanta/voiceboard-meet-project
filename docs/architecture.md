# Voiceboard Meet — System Architecture

This diagram shows the high-level system architecture for Voiceboard Meet (frontend + backend + external services).

Files included:
- `docs/architecture.svg` — visual diagram (open in browser or an SVG viewer).

Overview:
- Frontend: React + Vite application. Pages: `Meetings`, `Transcripts`. Uses `services/api.js` (Axios) to call backend and `socket.io-client` to subscribe to real-time events.
- Backend: Node.js + Express. Key systems:
  - Routes: `/users`, `/api/meetings`, `/api/transcript`, `/api/debug`
  - Services: `geminiService` (LLM), `emailService` (Mailgun HTTP/API or SMTP fallback), `scheduler`, `notificationScheduler`, `socket` (socket.io)
  - Models: Mongoose models for `User`, `Meeting`, `Transcript`
  - Scripts: `scripts/mailgunJsTest.js`, `scripts/directSendTest.js`, `scripts/inspectData.js` for diagnostics
  - Tests: Jest + Supertest + mongodb-memory-server
- External: Gemini API (for transcript structuring), Mailgun (HTTP API / SMTP) and optional SMTP providers.

