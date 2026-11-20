# EventPulse

EventPulse is a capstone event ticketing application for browsing events, reserving tickets, simulating payment, issuing signed QR ticket tokens, and checking attendees in. It has a React 19 and Vite frontend and a Node.js/Express API backed by MySQL.

## Features

- Browse published events; search by title or venue; filter by city and maximum ticket price; sort by date, price, or remaining capacity.
- Create events, add ticket tiers, and publish events as an organizer.
- Reserve one to ten tickets per booking. The API holds inventory and returns a pending booking with an expiry time.
- Simulate payment (including a decline path), issue signed QR tokens for paid bookings, and cancel bookings.
- Apply the cancellation refund policy: full refund at least seven days before the event, 50% from two to under seven days, and no refund inside two days.
- Join an in-memory waitlist for sold-out tiers and accept offers surfaced by the client.
- Check in a paid ticket once as staff using its QR token and event ID.

This project is a demonstration, not a production payment or identity system. Login is a local role selector, API identity is supplied through request headers, payment is simulated, and waitlist state is held in browser memory.

## Requirements

- Node.js 20.19+ or 22.12+ (required by the Vite 8 toolchain)
- npm
- MySQL 8 (or a compatible MySQL server)

## Project layout

```text
.
├── src/                 # React app, pages, components, state, and API client
├── server/
│   └── src/
│       ├── db/           # SQL schema and demo seed script
│       └── server.js     # Express API
├── postman/             # Postman API collection
├── package.json         # Frontend and convenience scripts
└── server/package.json  # API scripts and dependencies
```

## Getting started

### 1. Install dependencies

From the project root:

```bash
npm install
npm --prefix server install
```

### 2. Create the database

Create a MySQL database user with permission to create/use `event_ticketing`, then load the schema:

```bash
mysql -u root -p < server/src/db/schema.sql
```

The schema creates the `event_ticketing` database and its `users`, `events`, `ticket_tiers`, `bookings`, and `waitlist_entries` tables. If you use another MySQL account or database name, configure it in the API environment below.

### 3. Configure the API

Copy `server/.env.example` to `server/.env` and set the database credentials and a private ticket signing secret:

```dotenv
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=event_ticketing
TICKET_SECRET=replace_with_a_long_random_secret
```

The server has development defaults, but use a strong `TICKET_SECRET` and a dedicated DB user for real deployments. Keep `.env` files private; do not commit secrets.

### 4. Configure the frontend

The frontend defaults to `http://localhost:5000`. To use a different API URL, create `src/.env` with:

```dotenv
VITE_API_URL=http://localhost:5000
```

`VITE_API_URL` is the Express API base URL, without a trailing slash. Restart Vite after changing environment variables.

### 5. Start the app

Run the API and frontend in separate terminal windows from the project root:

```bash
npm run dev:server
```

```bash
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The API health endpoint is `http://localhost:5000/health`.

## Demo data

The API starts with an empty event list unless you add events or seed sample data. A seed script is provided:

```bash
npm --prefix server run seed
```

**Current seed/schema mismatch:** `server/src/db/seed.js` writes `start_date` and `status` columns, but `server/src/db/schema.sql` does not define those columns. Consequently, with only the checked-in schema loaded, seeding fails. The script also inserts events using the `usr-org-1` organizer account by default; set `SEED_ORGANIZER_ID` if you change that ID. Align the seed script and schema before relying on the seed command.

## Using the application

The navigation exposes event browsing, ticket management, organizer tools, staff check-in, and a login/role selector. The sample roles are `attendee`, `organizer`, and `staff`. Select the role needed for the action you want to try; the API client sends the active user ID, role, and email as `x-user-id`, `x-user-role`, and `x-user-email` headers.

To create an event, use the organizer view to create it, add one or more tiers, and publish it. As an attendee, select a published event and tier, reserve tickets, then use the checkout flow to simulate payment. Paid tickets contain a signed token intended for check-in. The staff screen can validate that token against an event. The frontend keeps booking state in memory, so a page reload clears its local booking and waitlist view even though booking records remain in MySQL.

## API overview

All routes below are served by the Express API. `/api` routes attach a demo user from headers; omitted identity headers default to `usr-101`, `attendee`, and `usr-101@example.com`. These headers are for local demonstration only and do not authenticate a real user.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API health check |
| `GET` | `/api/events` | List published events; optional `q`, `city`, `maxPriceCents`, and `sortBy` query parameters |
| `POST` | `/api/events` | Create an unpublished event (organizer) |
| `POST` | `/api/events/:id/tiers` | Add a ticket tier (event owner/organizer) |
| `POST` | `/api/events/:id/publish` | Publish an event (event owner/organizer) |
| `POST` | `/api/bookings` | Reserve ticket inventory |
| `POST` | `/api/bookings/:reference/pay` | Simulate payment and obtain a ticket token |
| `POST` | `/api/bookings/:reference/cancel` | Cancel a pending booking or cancel/refund a paid booking |
| `POST` | `/api/checkin` | Validate and redeem a ticket token (staff) |

Send JSON request bodies for write operations. Errors use an envelope of the form `{ "error": { "code": "...", "message": "..." } }`. The complete request examples are in [`postman/event-ticketing.postman_collection.json`](postman/event-ticketing.postman_collection.json).

## Scripts

Run these from the repository root unless stated otherwise:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run dev:server` | Start Express in watch mode |
| `npm run build` | Build the frontend into `dist/` |
| `npm run preview` | Preview the production frontend build |
| `npm test` | Run the API test suite with Node's test runner |
| `npm --prefix server run seed` | Insert demo events (see the current schema mismatch above) |

## Troubleshooting

- **The event list is empty:** check that MySQL is running, the API is configured and reachable, and the database has published events. The seed command currently needs the schema/seed mismatch fixed first.
- **The browser reports a network error:** verify the API is listening on the URL in `src/.env` (or the default port 5000), then restart Vite after configuration changes.
- **The API cannot connect to MySQL:** check `server/.env`, database permissions, and that `DB_NAME` matches the loaded schema.
- **Organizer/staff actions are forbidden:** select the corresponding demo role in the app. The selected role is passed as a request header; this is not production authentication.

## Security and production notes

This application is intentionally a capstone prototype. Before public deployment, replace header-based demo identity with verified authentication and authorization, integrate a payment provider, persist and manage waitlists, add rate limiting and operational logging, review CORS and CSP policies for the deployed frontend, and manage signing/database secrets outside source control. Do not use the included mock login or payment flow to process real users or money.
