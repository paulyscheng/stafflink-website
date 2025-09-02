const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function createTestJobRecordsWithWage() {
  try {
    console.log('🔧 Creating test job records with wage information...\n');

    // First, check if we have test data
    const workers = await pool.query("SELECT id, name FROM workers LIMIT 3");
    const companies = await pool.query("SELECT id, company_name FROM companies LIMIT 1");
    const projects = await pool.query("SELECT id, project_name, payment_type, daily_wage, original_wage FROM projects LIMIT 3");

    if (workers.rows.length === 0 || companies.rows.length === 0 || projects.rows.length === 0) {
      console.log('❌ Missing test data. Please create workers, companies, and projects first.');
      return;
    }

    console.log('Found test data:');
    console.log(`- ${workers.rows.length} workers`);
    console.log(`- ${companies.rows.length} companies`);
    console.log(`- ${projects.rows.length} projects\n`);

    // Create invitations first
    const invitations = [];
    for (let i = 0; i < Math.min(workers.rows.length, projects.rows.length); i++) {
      const invitation = {
        id: uuidv4(),
        worker_id: workers.rows[i].id,
        company_id: companies.rows[0].id,
        project_id: projects.rows[i] ? projects.rows[i].id : projects.rows[0].id,
        wage_amount: projects.rows[i] ? projects.rows[i].daily_wage : 400,
        original_wage: projects.rows[i] ? projects.rows[i].original_wage : 50,
        wage_unit: projects.rows[i] && projects.rows[i].payment_type === 'hourly' ? 'hour' : 'day',
        message: 'Test invitation with wage info',
        status: 'accepted',
        response_time: new Date()
      };

      try {
        await pool.query(`
          INSERT INTO invitations (
            id, worker_id, company_id, project_id,
            wage_amount, original_wage, wage_unit,
            message, status, response_time,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            wage_amount = EXCLUDED.wage_amount,
            original_wage = EXCLUDED.original_wage,
            wage_unit = EXCLUDED.wage_unit
        `, [
          invitation.id,
          invitation.worker_id,
          invitation.company_id,
          invitation.project_id,
          invitation.wage_amount,
          invitation.original_wage,
          invitation.wage_unit,
          invitation.message,
          invitation.status,
          invitation.response_time
        ]);

        invitations.push(invitation);
        console.log(`✅ Created invitation for ${workers.rows[i].name}`);
      } catch (error) {
        console.error('❌ Failed to create invitation:', error.message);
      }
    }

    // Create job records with different statuses and wage amounts
    const jobRecords = [
      {
        id: uuidv4(),
        worker_id: workers.rows[0].id,
        company_id: companies.rows[0].id,
        project_id: projects.rows[0].id,
        invitation_id: invitations[0] ? invitations[0].id : null,
        start_date: new Date(),
        end_date: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours later
        actual_hours: 8,
        wage_amount: 400, // Daily wage
        status: 'active',
        payment_status: 'pending'
      },
      {
        id: uuidv4(),
        worker_id: workers.rows[1] ? workers.rows[1].id : workers.rows[0].id,
        company_id: companies.rows[0].id,
        project_id: projects.rows[1] ? projects.rows[1].id : projects.rows[0].id,
        invitation_id: invitations[1] ? invitations[1].id : null,
        start_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        end_date: new Date(Date.now() - 16 * 60 * 60 * 1000), // Yesterday + 8 hours
        actual_hours: 8,
        wage_amount: 450,
        status: 'completed',
        worker_confirmed: true,
        company_confirmed: true,
        payment_status: 'paid'
      },
      {
        id: uuidv4(),
        worker_id: workers.rows[2] ? workers.rows[2].id : workers.rows[0].id,
        company_id: companies.rows[0].id,
        project_id: projects.rows[2] ? projects.rows[2].id : projects.rows[0].id,
        invitation_id: invitations[2] ? invitations[2].id : null,
        start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        end_date: null,
        actual_hours: 4.5, // Partial day
        wage_amount: 225, // Half day wage
        status: 'active',
        payment_status: 'pending'
      }
    ];

    // Insert job records
    let successCount = 0;
    for (const record of jobRecords) {
      try {
        const insertQuery = `
          INSERT INTO job_records (
            id, worker_id, company_id, project_id, invitation_id,
            start_date, end_date, actual_hours, wage_amount,
            status, worker_confirmed, company_confirmed, payment_status,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            actual_hours = EXCLUDED.actual_hours,
            wage_amount = EXCLUDED.wage_amount,
            status = EXCLUDED.status,
            payment_status = EXCLUDED.payment_status
        `;
        
        const values = [
          record.id,
          record.worker_id,
          record.company_id,
          record.project_id,
          record.invitation_id,
          record.start_date,
          record.end_date,
          record.actual_hours,
          record.wage_amount,
          record.status,
          record.worker_confirmed || false,
          record.company_confirmed || false,
          record.payment_status
        ];
        
        await pool.query(insertQuery, values);
        
        const workerName = workers.rows.find(w => w.id === record.worker_id)?.name || 'Unknown';
        console.log(`✅ Created job record for ${workerName} - Status: ${record.status}, Wage: ¥${record.wage_amount}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to create job record:`, error.message);
      }
    }

    // Display summary
    console.log(`\n📊 Created ${successCount} job records with wage information`);
    
    // Query and display the created records
    const summary = await pool.query(`
      SELECT 
        jr.status,
        COUNT(*) as count,
        AVG(jr.wage_amount) as avg_wage,
        AVG(jr.actual_hours) as avg_hours,
        AVG(jr.wage_amount / NULLIF(jr.actual_hours, 0)) as avg_hourly_rate
      FROM job_records jr
      GROUP BY jr.status
      ORDER BY jr.status
    `);

    console.log('\n📈 Job Records Summary:');
    console.table(summary.rows.map(row => ({
      'Status': row.status,
      'Count': row.count,
      'Avg Wage': row.avg_wage ? `¥${parseFloat(row.avg_wage).toFixed(2)}` : 'N/A',
      'Avg Hours': row.avg_hours ? parseFloat(row.avg_hours).toFixed(1) : 'N/A',
      'Avg Hourly Rate': row.avg_hourly_rate ? `¥${parseFloat(row.avg_hourly_rate).toFixed(2)}/hr` : 'N/A'
    })));

    console.log('\n✅ Test data created successfully!');
    console.log('📝 You can now run queryJobRecordsWithWage.js to see the wage information.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
  } finally {
    await pool.end();
  }
}

// Execute
createTestJobRecordsWithWage();