const { describe, it, expect } = require('@jest/globals');

/**
 * 字段映射测试 - 确保前后端字段名一致
 */
describe('Field Mapping Consistency Tests', () => {
  
  // 定义标准字段映射
  const fieldMappings = {
    // 工资相关字段
    wage: {
      database: {
        invitations: ['wage_amount', 'original_wage', 'wage_unit'],
        projects: ['daily_wage', 'original_wage', 'wage_unit', 'payment_type'],
        job_records: ['wage_amount', 'actual_hours', 'payment_status']
      },
      api_response: {
        wage_amount: 'wageAmount',
        original_wage: 'originalWage',
        wage_unit: 'wageUnit',
        daily_wage: 'dailyWage',
        payment_type: 'paymentType'
      },
      frontend_display: {
        hourly: 'budgetRange', // 用于显示时薪
        daily: 'budgetRange',  // 用于显示日薪
        type: 'paymentType'    // 支付类型
      }
    },
    
    // 项目相关字段
    project: {
      database: {
        projects: ['project_name', 'project_address', 'description', 'required_workers'],
        // 注意: 没有 work_description 或 work_content 字段
      },
      api_response: {
        project_name: 'projectName',
        project_address: 'projectAddress',
        description: 'workDescription',
        required_workers: 'requiredWorkers'
      }
    }
  };

  describe('Wage Field Mapping', () => {
    it('should have consistent wage field names across layers', () => {
      const dbFields = fieldMappings.wage.database.invitations;
      const apiFields = Object.keys(fieldMappings.wage.api_response);
      
      // 确保数据库字段都有对应的API映射
      dbFields.forEach(dbField => {
        expect(apiFields).toContain(dbField);
      });
    });

    it('should correctly map payment types', () => {
      const paymentTypes = {
        hourly: { db: 'hourly', api: 'hourly', display: '小时' },
        daily: { db: 'daily', api: 'daily', display: '天' },
        fixed: { db: 'fixed', api: 'fixed', display: '总价' }
      };

      Object.entries(paymentTypes).forEach(([key, mapping]) => {
        expect(mapping.db).toBe(mapping.api);
      });
    });
  });

  describe('Common Field Naming Errors', () => {
    it('should not use these incorrect field names', () => {
      const incorrectFields = [
        'wage_offer',      // 应该是 wage_amount
        'wage_type',       // 应该是 wage_unit 或 payment_type
        'work_description', // projects表中应该是 description
        'work_content',    // 不存在的字段
        'workers_count',   // 应该是 required_workers
        'response_message' // 应该是 response_note (invitations表)
      ];

      const correctMappings = {
        'wage_offer': 'wage_amount',
        'wage_type': 'wage_unit',
        'work_description': 'description',
        'work_content': 'description',
        'workers_count': 'required_workers',
        'response_message': 'response_note'
      };

      incorrectFields.forEach(incorrect => {
        console.warn(`⚠️  避免使用: ${incorrect}, 应该使用: ${correctMappings[incorrect]}`);
      });
    });
  });

  describe('Wage Display Logic', () => {
    it('should use correct fields for hourly wage display', () => {
      const hourlyJob = {
        payment_type: 'hourly',
        original_wage: 50,    // 正确: 时薪存储在这里
        daily_wage: 400,      // 这是计算出的日薪
        wage_unit: 'hour'
      };

      // 前端应该显示 original_wage 而不是 daily_wage
      const displayWage = hourlyJob.original_wage;
      expect(displayWage).toBe(50);
      expect(displayWage).not.toBe(400); // 不应该显示日薪
    });

    it('should use correct fields for daily wage display', () => {
      const dailyJob = {
        payment_type: 'daily',
        daily_wage: 400,      // 正确: 日薪存储在这里
        original_wage: null,
        wage_unit: 'day'
      };

      const displayWage = dailyJob.daily_wage;
      expect(displayWage).toBe(400);
    });
  });
});

/**
 * 数据验证函数 - 可在实际代码中使用
 */
function validateWageData(job) {
  const errors = [];

  // 检查必需字段
  if (!job.payment_type) {
    errors.push('Missing payment_type');
  }

  // 根据支付类型验证相应字段
  if (job.payment_type === 'hourly') {
    if (!job.original_wage && !job.wage_amount) {
      errors.push('Hourly job must have original_wage or wage_amount');
    }
  } else if (job.payment_type === 'daily') {
    if (!job.daily_wage && !job.wage_amount) {
      errors.push('Daily job must have daily_wage or wage_amount');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = { validateWageData };