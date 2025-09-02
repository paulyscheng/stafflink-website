const fs = require('fs').promises;
const path = require('path');

async function updateProjectController() {
    const controllerPath = path.join(__dirname, '../controllers/projectController.js');
    
    try {
        let content = await fs.readFile(controllerPath, 'utf8');
        
        // 找到技能处理部分的开始和结束
        const skillStartPattern = /\/\/ Add project skills if provided[\s\S]*?if \(skills && skills\.length > 0\) \{/;
        const skillEndPattern = /const results = await Promise\.all\(skillPromises\.filter\(p => p\)\);[\s\S]*?logger\.info\(`Successfully inserted \$\{results\.length\} skills for project \$\{project\.id\}`\);\s*\}/;
        
        const newSkillHandling = `// Add project skills if provided
    logger.info(\`Attempting to add \${skills ? skills.length : 0} skills to project \${project.id}\`);
    if (skills && skills.length > 0) {
      try {
        // Get skill IDs dynamically from database
        const frontendKeys = skills.map(s => s.skill_id);
        const skillMapping = await SkillService.mapFrontendSkillsToIds(frontendKeys);
        
        const skillPromises = skills.map(async skill => {
          const skillId = skillMapping[skill.skill_id];
          
          if (!skillId) {
            // Try to find skill by name if mapping fails
            const alternativeId = await SkillService.mapFrontendSkillToId(skill.skill_id);
            if (!alternativeId) {
              logger.warn(\`Unknown skill: \${skill.skill_id}\`);
              return null;
            }
            skillId = alternativeId;
          }
          
          logger.info(\`Inserting skill ID \${skillId} for project \${project.id}\`);
          
          const insertQuery = \`
            INSERT INTO project_skills (project_id, skill_id, required_level, is_mandatory)
            VALUES ($1, $2, $3, $4)
          \`;
          
          return db.query(insertQuery, [
            project.id,
            skillId,
            skill.required_level || 1,
            skill.is_mandatory !== false
          ]);
        });
        
        const results = await Promise.all(skillPromises.filter(p => p));
        logger.info(\`Successfully inserted \${results.length} skills for project \${project.id}\`);
      } catch (skillError) {
        logger.error('Error adding project skills:', skillError);
        // Don't fail the entire project creation if skills fail
      }
    }`;
        
        // 替换技能处理部分
        const startMatch = content.match(skillStartPattern);
        const endMatch = content.match(skillEndPattern);
        
        if (startMatch && endMatch) {
            const beforeSkills = content.substring(0, startMatch.index);
            const afterSkills = content.substring(endMatch.index + endMatch[0].length);
            content = beforeSkills + newSkillHandling + afterSkills;
            
            await fs.writeFile(controllerPath, content);
            console.log('✅ 项目控制器更新成功！');
            console.log('   - 使用动态技能映射服务');
            console.log('   - 移除硬编码的技能ID');
            console.log('   - 添加错误处理和回退机制');
        } else {
            console.error('❌ 无法找到技能处理代码块');
        }
        
    } catch (error) {
        console.error('❌ 更新失败:', error.message);
    }
}

updateProjectController();