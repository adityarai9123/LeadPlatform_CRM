# LeadPlatform

A lead management application for a small sales team: a public capture form feeds
an authenticated app with admin/member roles, a lead pipeline, notes, an activity
trail, and a documented JSON API.

Built for the Digital Heroes Full Stack Development task (Task A).

## Stack and why

- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT auth, bcrypt password hashing,
  Helmet, Express Rate Limit. Chosen because it's the stack I already build in, and because Mongo's document
  model fits a lead record well (a lead naturally owns a variable-length list of
  notes and activity events — no join table needed for that).
- **Frontend:** React (Vite), plain fetch, no UI framework. Kept deliberately small —
  the task is scored on architecture/auth/API/tests, not component library polish.
- **Tests:** Jest + Supertest + mongodb-memory-server (spins up a real, throwaway
  MongoDB instance per test run, so the tests hit real Mongoose validation and
  indexes rather than mocks).

## Architecture

```
Public capture form ──► POST /api/leads/capture (no auth)
                                   │
                                   ▼
                          MongoDB: leads collection
                                   │
Authenticated app  ◄───────────────┘
  (admin / member)
        │
        ├─ list/filter/paginate leads   GET  /api/leads
        ├─ view one lead                GET  /api/leads/:id
        ├─ move status                  PATCH /api/leads/:id/status   (admin, or assignee)
        ├─ add note                     POST /api/leads/:id/notes     (admin, or assignee)
        ├─ assign to a member           PATCH /api/leads/:id/assign   (admin only)
        └─ delete                       DELETE /api/leads/:id         (admin only)
```

**Permission model** (enforced server-side in `backend/middleware/auth.js` and
`backend/controllers/leadController.js`, not just hidden in the UI):
- `admin`: full CRUD on leads, can assign/reassign, can create other users.
- `member`: can see every lead (so the team has shared visibility on the pipeline),
  but can only change status or add notes on leads **assigned to them**. Cannot
  assign leads or delete them.

The frontend also hides/disables the relevant buttons for a member (see
`frontend/src/pages/LeadDetail.jsx`), but that's UX only — the actual boundary is
the 403 the API returns if someone tries to bypass it with a raw request.
The dashboard includes search, filtering, pagination, status badges, and summary cards for quick lead overview.

## Data model

- **User**: name, email, hashed password, role (`admin` | `member`).
- **Lead**: name, email, phone, company, message, source, status
  (`new → contacted → qualified → proposal → won/lost`), `assignedTo`, an
  embedded `notes[]` array (author + timestamp), and an embedded `activity[]`
  array that records every create/assign/status-change/note event — this is the
  activity trail a sales team would actually want on a lead.

## API documentation

Email format is validated for all user and lead creation requests.

Base URL: `/api`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/leads/capture` | Public | Create a lead from the public form. Body: `{ name, email, phone?, company?, message? }`. `400` if name/email missing. |
| POST | `/auth/login` | Public | `{ email, password }` → `{ token, role, ... }`. `401` on bad credentials. |
| GET | `/auth/me` | Bearer token | Current user. |
| GET | `/leads` | Bearer token | Paginated, filterable list. Query: `page`, `limit` (max 100), `status`, `assignedTo`, `q` (search name/email/company). Returns `{ data, pagination: { page, limit, total, totalPages } }`. |
| GET | `/leads/:id` | Bearer token | One lead with notes/activity populated. `404` if missing. |
| PATCH | `/leads/:id/status` | Bearer token | `{ status }`, must be one of the pipeline values. `400` invalid status, `403` if not admin/assignee. |
| POST | `/leads/:id/notes` | Bearer token | `{ text }`. `403` if not admin/assignee. |
| PATCH | `/leads/:id/assign` | Bearer token, **admin** | `{ userId }` (or `null` to unassign). `403` for non-admins. |
| DELETE | `/leads/:id` | Bearer token, **admin** | `403` for non-admins. |
| POST | `/users` | Bearer token, **admin** | Create a team member/admin account. `409` on duplicate email. |
| GET | `/users` | Bearer token, **admin** | List users (for the assign dropdown). |
| GET    | `/health` | Public | Health check endpoint. |


All error responses: `{ "success": false, "message": "..." }` with the matching
HTTP status code (400 validation, 401 auth, 403 permission, 404 not found,
409 conflict, 500 server).

## Running locally

**Backend**
```
cd backend
cp .env.example .env      # fill in MONGO_URI and JWT_SECRET
npm install
npm run seed               # creates admin@leadplatform.dev / Admin@1234
                            #     and member@leadplatform.dev / Member@1234
npm run dev                 # http://localhost:5000
```

**Frontend**
```
cd frontend
cp .env.example .env       # points at http://localhost:5000/api by default
npm install
npm run dev                 # http://localhost:5173
```

**Tests**
```
cd backend
npm test
```
The test suite uses `mongodb-memory-server`, which downloads a MongoDB binary
the first time it runs — that first run needs internet access (a few seconds
on a normal connection). Every run after that is cached and fast. All backend
files were syntax-checked and the server module boot was verified in the build
environment; the full suite itself needs to run somewhere with unrestricted
network access to fetch that binary once.

## Deployment (free tier)

1. **Database:** create a free MongoDB Atlas cluster, get the connection string.
2. **Backend:** deploy `backend/` to Render (or Railway) as a Web Service.
   Set env vars `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (your frontend URL).
   Build command `npm install`, start command `npm start`.
3. **Frontend:** deploy `frontend/` to Vercel or Netlify. Set `VITE_API_URL` to
   your deployed backend's `/api` URL. Build command `npm run build`, output
   dir `dist`.
4. After deploying, run `npm run seed` once (locally, pointed at your Atlas
   `MONGO_URI`) to create the demo admin/member accounts for graders.
5. Add the live URL to your submission — the footer credit line is already in
   `frontend/src/App.jsx`.

## Where I used AI, and what I changed

I used Claude to scaffold the boilerplate (Express routing structure, Mongoose
schemas, the React pages) and to write the first draft of the test suite. I
changed the permission model after the first draft — the initial version let
any authenticated member edit any lead, which doesn't match how a real sales
team works (you don't want reps stepping on each other's leads), so I added
the `canModifyLead` check that restricts status/note edits to the assignee or
an admin, and wrote the two permission-boundary tests in `tests/leads.test.js`
to lock that in. I also rewrote the activity trail to be a proper embedded
event log instead of a single "last updated" field, since a sales team
actually cares about the history, not just the current state.
