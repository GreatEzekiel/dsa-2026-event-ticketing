/**
 * Seed script: inserts realistic demo events across Nigerian states,
 * each with ticket tiers. Idempotent — safe to run repeatedly.
 *
 * Run:  npm run seed   (from the server/ folder)
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const organizerId = process.env.SEED_ORGANIZER_ID || 'usr-org-1';

// [id, title, city/state, venue, startsAt, tiers:[[name, priceCents, capacity], ...]]
const EVENTS = [
  ['evt-lagos-jazz-2026', 'Lagos Waterfront Jazz & Soul Night', 'Lagos', 'Landmark Centre, Victoria Island', '2026-12-12T18:00:00.000Z', [
    ['Regular', 750000, 500], ['VIP', 1500000, 120],
  ]],
  ['evt-data-summit-2026', 'Applied Data Science & Operations Summit', 'Lagos', 'UNILAG Conference Centre, Akoka', '2026-11-28T09:00:00.000Z', [
    ['Early Bird', 250000, 200], ['Standard', 400000, 400], ['Corporate', 900000, 80],
  ]],
  ['evt-abuja-ent-2027', 'Capital Entrepreneurship & Venture Forum', 'Abuja (FCT)', 'International Conference Centre, Garki', '2027-01-21T10:00:00.000Z', [
    ['Standard', 500000, 350], ['VIP', 1200000, 90],
  ]],
  ['evt-ph-techfest-2026', 'Port Harcourt Tech Fest & Hackathon', 'Rivers', 'Hotel Presidential, GRA Phase 2', '2026-12-05T09:30:00.000Z', [
    ['Student', 100000, 300], ['Regular', 300000, 400], ['VIP', 750000, 60],
  ]],
  ['evt-ibadan-food-2026', 'Ibadan Food & Culture Carnival', 'Oyo', 'Adamasingba Stadium, Ibadan', '2026-12-19T12:00:00.000Z', [
    ['Gate Pass', 200000, 1000], ['Family Pack', 500000, 150],
  ]],
  ['evt-enugu-ignite-2026', 'Enugu Ignite Startup Expo', 'Enugu', 'Nike Lake Resort, Enugu', '2027-01-09T10:00:00.000Z', [
    ['Regular', 250000, 250], ['Investor', 800000, 50],
  ]],
  ['evt-kano-fashion-2026', 'Kano Fashion & Leather Week', 'Kano', 'Tahir Guest Palace, Kano', '2026-12-26T16:00:00.000Z', [
    ['Regular', 300000, 400], ['Front Row', 1000000, 70],
  ]],
  ['evt-calabar-carnival-2026', 'Calabar International Carnival Vibe', 'Cross River', 'Calabar Municipal Carnival Ground', '2026-12-28T14:00:00.000Z', [
    ['Stand A', 350000, 600], ['Band VIP', 1500000, 100],
  ]],
  ['evt-kaduna-agritech-2027', 'Kaduna AgriTech & Value Chain Fair', 'Kaduna', 'Kaduna International Trade Fair Complex', '2027-02-06T09:00:00.000Z', [
    ['Farmer Pass', 150000, 500], ['Exhibitor', 600000, 120],
  ]],
  ['evt-benin-arts-2026', 'Benin Royal Arts & Bronze Exhibition', 'Edo', 'Oba Ovonramwen Cultural Centre, Benin City', '2026-12-13T11:00:00.000Z', [
    ['General', 200000, 300], ['Curator Tour', 700000, 40],
  ]],
  ['evt-abr-music-2026', 'Asaba Rhythm & Blues Festival', 'Delta', 'Asaba Township Stadium', '2027-01-16T17:00:00.000Z', [
    ['Regular', 400000, 450], ['Golden Circle', 1100000, 80],
  ]],
  ['evt-jos-altitude-2027', 'Jos Altitude Open-Air Concert', 'Plateau', 'Miango Rest Home Grounds, Jos', '2027-01-30T15:00:00.000Z', [
    ['Hillside', 250000, 500], ['Front Stage', 800000, 100],
  ]],
  ['evt-owerri-comedy-2026', 'Owerri Night of Comedy & Music', 'Imo', 'Concorde Hotel Convention Hall, Owerri', '2026-12-20T18:30:00.000Z', [
    ['Regular', 300000, 350], ['Table for 4', 1200000, 50],
  ]],
  ['evt-uyo-oilgas-2027', 'Uyo Oil, Gas & Energy Summit', 'Akwa Ibom', 'Ibom Hall, Uyo', '2027-02-20T09:00:00.000Z', [
    ['Standard', 550000, 280], ['Delegate VIP', 1300000, 60],
  ]],
  ['evt-awka-innovation-2026', 'Awka Innovation & SME Bootcamp', 'Anambra', 'Prof. Kenneth Dike E-Library Auditorium, Awka', '2026-12-06T10:00:00.000Z', [
    ['Bootcamp', 180000, 220], ['Mentor Plus', 650000, 40],
  ]],
  ['evt-ilorin-durbar-2027', 'Ilorin Durbar Cultural Experience', 'Kwara', 'Kwara State Stadium Complex, Ilorin', '2027-02-14T13:00:00.000Z', [
    ['General', 150000, 700], ['Royal Pavilion', 900000, 90],
  ]],
];

async function main() {
  if (EVENTS.length < 6 || EVENTS.length > 20) {
    throw new Error(`Seed defines ${EVENTS.length} events; expected between 6 and 20.`);
  }
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'event_ticketing',
    connectionLimit: 5,
  });

  // Ensure organizer exists so the FK holds
  await pool.execute(
    "INSERT IGNORE INTO users (id, email, password_hash, role) VALUES (?, ?, 'scrypt-managed', 'organizer')",
    [organizerId, 'organizer@eventpulse.ng']
  );

  let eventCount = 0;
  let tierCount = 0;
  for (const [id, title, city, venue, startsAt, tiers] of EVENTS) {
    const [existing] = await pool.execute('SELECT id FROM events WHERE id = ?', [id]);
    if (existing.length === 0) {
      const startDate = new Date(startsAt);
      await pool.execute(
        `INSERT INTO events
         (id, organizer_id, title, city, venue, starts_at, published, start_date, status)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, ?, 'published')`,
        [id, organizerId, title, city, venue, startDate, startDate]
      );
      eventCount++;
    }
    for (const [name, priceCents, capacity] of tiers) {
      const tierId = `tier-${id.slice(4)}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      await pool.execute(
        'INSERT IGNORE INTO ticket_tiers (id, event_id, name, price_cents, capacity, sold) VALUES (?, ?, ?, ?, ?, 0)',
        [tierId, id, name, priceCents, capacity]
      );
      tierCount++;
    }
  }

  const [rows] = await pool.query('SELECT COUNT(*) AS n FROM events');
  const [tiers] = await pool.query('SELECT COUNT(*) AS n FROM ticket_tiers');
  console.log(`Seed complete. Inserted ${eventCount} new events and ${tierCount} tier rows.`);
  console.log(`Database now has ${rows[0].n} events and ${tiers[0].n} ticket tiers.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
