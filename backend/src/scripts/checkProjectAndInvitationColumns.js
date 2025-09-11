require('dotenv').config();
const { Client } = require('pg');

async function checkColumns() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSLMODE === 'require' ? {
            rejectUnauthorized: true,
            ca: require('fs').readFileSync('./ssl/ca.pem').toString()
        } : false
    });

    try {
        console.log('🔗 Connecting to database...\n');
        await client.connect();
        
        // Check projects table columns
        const projectsColumns = await client.query(`
            SELECT 
                column_name, 
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'projects'
            ORDER BY ordinal_position;
        `);
        
        console.log('📊 Projects Table Columns:');
        console.log('========================');
        projectsColumns.rows.forEach(col => {
            console.log(`   ${col.column_name} - ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
        
        // Check invitations table columns
        const invitationsColumns = await client.query(`
            SELECT 
                column_name, 
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = 'invitations'
            ORDER BY ordinal_position;
        `);
        
        console.log('\n📊 Invitations Table Columns:');
        console.log('===========================');
        invitationsColumns.rows.forEach(col => {
            console.log(`   ${col.column_name} - ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
        
        // Check for wage-related columns
        console.log('\n💰 Wage-related columns in projects:');
        const wageColumns = projectsColumns.rows.filter(col => 
            col.column_name.includes('wage') || 
            col.column_name.includes('budget') ||
            col.column_name.includes('payment') ||
            col.column_name.includes('salary')
        );
        wageColumns.forEach(col => {
            console.log(`   ${col.column_name} - ${col.data_type}`);
        });
        
        console.log('\n💰 Wage-related columns in invitations:');
        const invWageColumns = invitationsColumns.rows.filter(col => 
            col.column_name.includes('wage') || 
            col.column_name.includes('budget') ||
            col.column_name.includes('payment') ||
            col.column_name.includes('salary')
        );
        invWageColumns.forEach(col => {
            console.log(`   ${col.column_name} - ${col.data_type}`);
        });
        
        // Check sample data
        console.log('\n📈 Sample project data:');
        const sampleProjects = await client.query(`
            SELECT 
                id,
                project_name,
                payment_type,
                budget_range,
                daily_wage,
                original_wage,
                wage_unit
            FROM projects 
            WHERE budget_range IS NOT NULL
            LIMIT 3;
        `);
        
        if (sampleProjects.rows.length > 0) {
            sampleProjects.rows.forEach(proj => {
                console.log(`   Project: ${proj.project_name}`);
                console.log(`   - Payment Type: ${proj.payment_type}`);
                console.log(`   - Budget Range: ${proj.budget_range}`);
                console.log(`   - Daily Wage: ${proj.daily_wage}`);
                console.log(`   - Original Wage: ${proj.original_wage}`);
                console.log(`   - Wage Unit: ${proj.wage_unit}`);
                console.log('');
            });
        } else {
            console.log('   No projects with budget information found.');
        }
        
        console.log('\n📈 Sample invitation data:');
        const sampleInvitations = await client.query(`
            SELECT 
                i.id,
                p.project_name,
                i.wage_amount,
                i.original_wage,
                i.wage_unit,
                i.status
            FROM invitations i
            JOIN projects p ON i.project_id = p.id
            WHERE i.wage_amount IS NOT NULL
            LIMIT 3;
        `);
        
        if (sampleInvitations.rows.length > 0) {
            sampleInvitations.rows.forEach(inv => {
                console.log(`   Invitation for: ${inv.project_name}`);
                console.log(`   - Wage Amount: ${inv.wage_amount}`);
                console.log(`   - Original Wage: ${inv.original_wage}`);
                console.log(`   - Wage Unit: ${inv.wage_unit}`);
                console.log(`   - Status: ${inv.status}`);
                console.log('');
            });
        } else {
            console.log('   No invitations with wage information found.');
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    } finally {
        await client.end();
    }
}

checkColumns();