const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function testInvitationSystem() {
  const API_BASE = 'http://localhost:3000/api';
  
  console.log('🧪 测试邀请系统...\n');

  try {
    // 1. 测试获取工人邀请列表 (模拟工人端)
    console.log('📋 1. 测试获取工人邀请列表...');
    const workerInvitationsResponse = await fetch(`${API_BASE}/invitations/worker`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (workerInvitationsResponse.ok) {
      const invitations = await workerInvitationsResponse.json();
      console.log(`✅ 获取到 ${invitations.length} 个邀请`);
      if (invitations.length > 0) {
        console.log('   第一个邀请:', {
          id: invitations[0].id,
          project_name: invitations[0].project_name,
          company_name: invitations[0].company_name,
          status: invitations[0].status
        });
      }
    } else {
      console.log('❌ 获取工人邀请失败:', await workerInvitationsResponse.text());
    }

    // 2. 测试获取公司邀请列表 (模拟公司端)
    console.log('\n📋 2. 测试获取公司发送的邀请...');
    const companyInvitationsResponse = await fetch(`${API_BASE}/invitations/company`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (companyInvitationsResponse.ok) {
      const invitations = await companyInvitationsResponse.json();
      console.log(`✅ 公司发送了 ${invitations.length} 个邀请`);
      
      // 统计状态
      const statusCount = {
        pending: invitations.filter(i => i.status === 'pending').length,
        accepted: invitations.filter(i => i.status === 'accepted').length,
        rejected: invitations.filter(i => i.status === 'rejected').length
      };
      console.log('   状态统计:', statusCount);
    } else {
      console.log('❌ 获取公司邀请失败:', await companyInvitationsResponse.text());
    }

    // 3. 创建测试邀请（如果需要）
    console.log('\n📋 3. 检查是否需要创建测试数据...');
    
    // 首先获取项目列表
    const projectsResponse = await fetch(`${API_BASE}/projects`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      const projects = projectsData.data?.projects || [];
      
      if (projects.length > 0) {
        console.log(`✅ 找到 ${projects.length} 个项目`);
        
        // 获取工人列表
        const workersResponse = await fetch(`${API_BASE}/workers`, {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        });
        
        if (workersResponse.ok) {
          const workersData = await workersResponse.json();
          const workers = workersData.data || [];
          
          if (workers.length > 0) {
            console.log(`✅ 找到 ${workers.length} 个工人`);
            
            // 为第一个项目创建邀请给第一个工人
            const testProject = projects[0];
            const testWorker = workers[0];
            
            console.log(`\n📮 4. 创建测试邀请...`);
            console.log(`   项目: ${testProject.project_name}`);
            console.log(`   工人: ${testWorker.name}`);
            
            const createInvitationResponse = await fetch(`${API_BASE}/invitations`, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                project_id: testProject.id,
                worker_id: testWorker.id,
                message: '您好，诚邀您参与我们的项目',
                wage_offer: 300,
                wage_type: 'daily'
              })
            });
            
            if (createInvitationResponse.ok) {
              const result = await createInvitationResponse.json();
              console.log('✅ 邀请创建成功:', result.message);
              
              // 测试工人响应邀请
              if (result.invitation) {
                console.log(`\n🤝 5. 测试工人响应邀请...`);
                const respondResponse = await fetch(`${API_BASE}/invitations/${result.invitation.id}/respond`, {
                  method: 'PUT',
                  headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    status: 'accepted',
                    response_message: '感谢邀请，我很乐意参与这个项目'
                  })
                });
                
                if (respondResponse.ok) {
                  const respondResult = await respondResponse.json();
                  console.log('✅ 响应成功:', respondResult.message);
                } else {
                  const error = await respondResponse.text();
                  console.log('❌ 响应失败:', error);
                }
              }
            } else {
              const error = await createInvitationResponse.text();
              if (error.includes('已经向该工人发送过邀请')) {
                console.log('ℹ️  该工人已有邀请，跳过创建');
              } else {
                console.log('❌ 创建邀请失败:', error);
              }
            }
          } else {
            console.log('⚠️  没有找到工人，无法创建邀请');
          }
        }
      } else {
        console.log('⚠️  没有找到项目，无法创建邀请');
      }
    }

    console.log('\n✅ 测试完成！');
    console.log('📱 现在可以启动工人端和公司端APP查看邀请功能');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }

  process.exit(0);
}

testInvitationSystem();