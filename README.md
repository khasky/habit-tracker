# Habit Tracker

Track daily habits with check-ins per day. Node/TypeScript API + React UI.

## Stack

- **Backend**: Fastify, better-sqlite3
- **Frontend**: React, Vite

## Run

```bash
npm install
npm run dev
```

- API: http://localhost:4372
- Web: http://localhost:4373

## API

- `GET /api/habits` — list habits with their check-in days
- `POST /api/habits` — create habit (`name`)
- `DELETE /api/habits/:id` — delete habit
- `POST /api/habits/:id/check` — add check-in (`day`: YYYY-MM-DD)
- `DELETE /api/habits/:id/check?day=YYYY-MM-DD` — remove check-in
