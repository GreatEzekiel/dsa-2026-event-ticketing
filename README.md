# EventPulse

EventPulse is a capstone event ticketing application for browsing events, reserving tickets, simulating payment, issuing signed QR ticket tokens, and checking attendees in. It has a React 19 and Vite frontend and a Node.js/Express API backed by MySQL.

## Features

- Browse published events; search by title or venue; filter by city and maximum ticket price; sort by date, price, or remaining capacity.
- Create events, add ticket tiers, and publish events as an organizer.
- Reserve one to ten tickets per booking. Seats stay reserved until the event starts, so attendees can pay at checkout or return later from **My Registered Events**.
- Simulate payment (including a decline path), issue signed QR tokens for paid bookings, and cancel bookings.
- Apply the cancellation refund policy: full refund at least seven days before the event, 50% from two to under seven days, and no refund inside two days.
- Join an in-memory waitlist for sold-out tiers and accept offers surfaced by the client.
- Check in a paid ticket once as staff using its QR token and event ID.

This project is a demonstration, not a production payment system. Each account has its own email, password hash, database user ID, and signed session. Attendees can see only bookings tied to their account. Payment is simulated, and waitlist state is held in browser memory.

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
npm install                 # Install the React/Vite frontend packages listed in the root package.json.
npm --prefix server install # Move into server/ for this command and install the Express API packages.
```

### 2. Create the database

Create a MySQL database user with permission to create/use `event_ticketing`, then load the schema:

```bash
mysql -u root -p < server/src/db/schema.sql # Sign in to MySQL as root, then run the SQL file to create the app database and tables.
```

The schema creates the `event_ticketing` database and its `users`, `events`, `ticket_tiers`, `bookings`, and `waitlist_entries` tables. If you use another MySQL account or database name, configure it in the API environment below.

### 3. Configure the API

Copy `server/.env.example` to `server/.env` and set the database credentials and a private ticket signing secret:

```dotenv
PORT=5000 # Port where the Express API listens; use another free port if 5000 is busy.
DB_HOST=127.0.0.1 # Address of the computer running MySQL; 127.0.0.1 means this computer.
DB_PORT=3306 # MySQL's usual connection port.
DB_USER=root # MySQL account the API uses; a dedicated limited account is better than root.
DB_PASSWORD=your_mysql_password # Replace this example with that MySQL account's password.
DB_NAME=event_ticketing # Database created by server/src/db/schema.sql.
TICKET_SECRET=replace_with_a_long_random_secret # Replace with a long private value used to sign ticket QR tokens.
```

The server has development defaults, but use a strong `TICKET_SECRET` and a dedicated DB user for real deployments. Keep `.env` files private; do not commit secrets.

### 4. Configure the frontend

The frontend defaults to `http://localhost:5000`. To use a different API URL, create a `.env` file in the project root (next to `package.json`) with:

```dotenv
VITE_API_URL=http://localhost:5000 # Base address of the API; match PORT in server/.env and omit a trailing slash.
```

`VITE_API_URL` is the Express API base URL, without a trailing slash. Restart Vite after changing environment variables.

### 5. Start the app

Run the API and frontend in separate terminal windows from the project root:

```bash
npm run dev:server # Start the Express API; keep this terminal open while using the app.
```

```bash
npm run dev # Start the Vite website; keep this in a second terminal window.
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The API health endpoint is `http://localhost:5000/health`.

## Demo data

The API starts with an empty event list unless you add events or seed sample data. A seed script is provided:

```bash
npm --prefix server run seed # Ask the API project's seed script to add sample events to MySQL.
```

The seed script inserts sample events using the `usr-org-1` organizer account by default. Set `SEED_ORGANIZER_ID` if you use another organizer ID.

## Deploy a live demo

The repository includes [`render.yaml`](render.yaml), a Render Blueprint for the static website and Express API. The API needs a reachable MySQL database. One setup is to create a MySQL service in Railway, enable its public TCP connection, then deploy the Render Blueprint and provide the database's public host, port, username, password, and database name when prompted. Railway's MySQL service exposes connection settings in its Variables panel; public access uses a TCP proxy. See the [Railway MySQL guide](https://docs.railway.com/databases/mysql).

1. Push this repository to GitHub.
2. Create a Railway project and add a MySQL database. Use a SQL client to connect with the database's public connection details and run the schema file shown below.
3. In Render, create a new Blueprint and select this GitHub repository. Render reads `render.yaml` to create the API and frontend services. Enter the Railway database credentials when Render requests the `DB_*` values; `TICKET_SECRET` is generated automatically, and the frontend is configured to use the API service URL.
4. After both Render services deploy, copy the `eventpulse-web` public URL and share it. The API is available at the `eventpulse-api` public URL, with `/health` as its health check.
5. Seed sample events in the deployed database. Configure `server/.env` locally with the Railway public MySQL connection details and run the seed command below; it connects to Railway and inserts demo events.

```bash
mysql -h YOUR_PUBLIC_DB_HOST -P YOUR_PUBLIC_DB_PORT -u YOUR_DB_USER -p YOUR_DB_NAME < server/src/db/schema.sql # Create the app tables in the hosted database; replace YOUR_* with Railway's public connection details.
npm --prefix server run seed # Insert sample events using the database settings in server/.env.
```

Do not put database credentials or `TICKET_SECRET` in GitHub. The app uses demo role selection and mock payments; use sample data only for a public demonstration.

## Using the application

The welcome page leads to sign-in or account creation. Create an account with an email and a password of at least eight characters. New accounts choose one of the capstone roles: `attendee`, `organizer`, or `staff`. After signing in, the app opens event browsing for attendees, organizer tools for organizers, or staff check-in for staff. A successful sign-in is saved on the device, and booking history is loaded for that account.

To create an event, use the organizer view to create it, add one or more tiers, and publish it. As an attendee, select a published event and tier to reserve tickets. You can simulate payment immediately, or choose **Pay Later** and return to **My Registered Events** to pay any time before the event starts. The booking reserves the seats until the event starts. Paid tickets contain a signed token intended for check-in. The staff screen can validate that token against an event. Booking history is stored in MySQL and loaded when the profile signs in. Waitlist entries are temporary browser state and are cleared when the page is reloaded.

## API overview

All routes below are served by the Express API. Event browsing is public. Sign-up and sign-in return a signed bearer token; send it as `Authorization: Bearer <token>` to access bookings and other protected routes. Sessions expire after seven days.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API health check |
| `POST` | `/api/auth/signup` | Create a separate account; body includes `email`, `password`, and optional demo `role` |
| `POST` | `/api/auth/login` | Sign in with `email` and `password` to receive a session token |
| `GET` | `/api/events` | List published events; optional `q`, `city`, `maxPriceCents`, and `sortBy` query parameters |
| `POST` | `/api/events` | Create an unpublished event (organizer) |
| `POST` | `/api/events/:id/tiers` | Add a ticket tier (event owner/organizer) |
| `POST` | `/api/events/:id/publish` | Publish an event (event owner/organizer) |
| `GET` | `/api/bookings` | List booking history for the signed-in account |
| `POST` | `/api/bookings` | Reserve ticket inventory |
| `POST` | `/api/bookings/:reference/pay` | Simulate payment and obtain a ticket token |
| `POST` | `/api/bookings/:reference/cancel` | Cancel a pending booking or cancel/refund a paid booking |
| `POST` | `/api/checkin` | Validate and redeem a ticket token (staff) |

Send JSON request bodies for write operations. Errors use an envelope of the form `{ "error": { "code": "...", "message": "..." } }`. The Postman collection includes sign-up requests that save separate attendee, organizer, and staff tokens before calling protected routes; set its `baseUrl` to the API host when testing a deployment.

## Scripts

Run these from the repository root unless stated otherwise. Each command is followed by a comment describing its purpose:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run dev:server` | Start Express in watch mode |
| `npm run build` | Build the frontend into `dist/` |
| `npm run preview` | Preview the production frontend build |
| `npm test` | Run the API test suite with Node's test runner |
| `npm --prefix server run seed` | Insert demo events into the database configured in `server/.env` |

For example, these commands install dependencies and then start each part of the app:

```bash
npm install                 # Install frontend packages from the repository root package.json.
npm --prefix server install # Install backend packages from server/package.json.
npm run dev:server           # Start the backend API in this terminal.
npm run dev                  # Start the frontend in another terminal.
```

## Troubleshooting

- **The event list is empty:** check that MySQL is running, the API is configured and reachable, and the database has published events. Run the seed command after configuring `server/.env` if you want sample events.
- **The browser reports a network error:** verify the API is listening on the URL in the project-root `.env` (or the default port 5000), then restart Vite after configuration changes.
- **The API cannot connect to MySQL:** check `server/.env`, database permissions, and that `DB_NAME` matches the loaded schema.
- **`EADDRINUSE` appears when starting the API:** another program is already using the configured port. Stop the old API process, or choose an unused `PORT` in `server/.env` and set the same API address in the project-root `.env` as `VITE_API_URL`.
- **Organizer/staff actions are forbidden:** use an account that was created with the corresponding demo role. The role is saved on that account and the API checks its signed session.

## Security and production notes

This application is intentionally a capstone prototype. Passwords are scrypt-hashed and API requests use signed bearer sessions, but there is no email verification, password reset, or rate limiting, and new users can select demo organizer/staff roles. Payment is still mocked and waitlists are not persisted. Do not use it for real ticket sales or sensitive personal data; production use requires hardened identity and role provisioning, a payment provider, persisted waitlists, and operational security controls.
