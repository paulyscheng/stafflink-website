require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../config/database');

async function testSkillSaving() {
  try {
    await db.testConnection();
    
    // Check a recent project with skills
    const recentProject = await db.query(`
      SELECT 
        p.id, 
        p.project_name,
        p.created_at,
        COUNT(ps.skill_id) as skill_count
      FROM projects p
      LEFT JOIN project_skills ps ON p.id = ps.project_id
      GROUP BY p.id, p.project_name, p.created_at
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
    
    console.log('\n📋 Recent projects and their skill counts:');
    console.table(recentProject.rows);
    
    // Get detailed skills for the most recent project with skills
    const projectWithSkills = recentProject.rows.find(p => p.skill_count > 0);
    
    if (projectWithSkills) {
      const skills = await db.query(`
        SELECT 
          ps.project_id,
          ps.skill_id,
          s.name as skill_name,
          s.category,
          ps.required_level,
          ps.is_mandatory
        FROM project_skills ps
        JOIN skills s ON ps.skill_id = s.id
        WHERE ps.project_id = $1
      `, [projectWithSkills.id]);
      
      console.log(`\n✅ Skills for project "${projectWithSkills.project_name}" (ID: ${projectWithSkills.id}):`);
      console.table(skills.rows);
    } else {
      console.log('\n⚠️  No projects with skills found yet. Create a new project to test.');
    }
    
    // Show skill mapping verification
    console.log('\n🔍 Skill ID verification (sample):');
    const sampleSkills = await db.query(`
      SELECT id, name 
      FROM skills 
      WHERE id IN (75, 79, 76, 77, 78, 81, 82)
      ORDER BY id
    `);
    console.table(sampleSkills.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testSkillSaving();