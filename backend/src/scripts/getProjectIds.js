const { Pool } = require('pg');

const pool = new Pool({
  host: 'bluecolartech.c82iubdbx5ez.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Blue666666',
  ssl: { rejectUnauthorized: false }
});

async function getIds() {
  try {
    const projects = await pool.query('SELECT id, project_name FROM projects LIMIT 2');
    console.log('Projects:', projects.rows);
    
    const invitations = await pool.query('SELECT id FROM invitations LIMIT 2');
    console.log('Invitations:', invitations.rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

getIds();