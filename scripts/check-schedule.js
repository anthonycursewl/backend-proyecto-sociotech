require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const schedules = await pool.query(`
    SELECT ds.id, ds."doctorId", ds."dayOfWeek", ds."startTime", ds."endTime", ds."isActive",
           d.specialty, u."firstName", u."lastName"
    FROM doctor_schedules ds
    JOIN doctors d ON d.id = ds."doctorId"
    JOIN users u ON u.id = d."userId"
    ORDER BY d.id, ds."dayOfWeek"
  `);
  console.log('=== DOCTOR SCHEDULES ===');
  console.log(JSON.stringify(schedules.rows, null, 2));

  const doc = await pool.query(`
    SELECT d.id, d."userId", u."firstName", u."lastName"
    FROM doctors d JOIN users u ON u.id = d."userId"
    WHERE d.id = 'c9e7f42c-bcb7-4540-9976-56d92bebd45d'
  `);
  console.log('\n=== TARGET DOCTOR ===');
  console.log(JSON.stringify(doc.rows, null, 2));

  await pool.end();
})().catch(e => { console.error(e.message); process.exit(1); });
