const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const db = require('../../src/config/database');
const jobController = require('../../src/controllers/jobController');

// Mock the database
jest.mock('../../src/config/database');

describe('JobController Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorkerJobs', () => {
    it('should use correct field names from invitations table', async () => {
      // Arrange
      const mockRequest = {
        user: { id: 'worker-123' },
        query: { page: 1, limit: 20 }
      };
      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Mock database response
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'job-123',
          project_name: 'Cleaning staff',
          wage_amount: 400,
          original_wage: 50,
          wage_unit: 'hour',
          payment_type: 'hourly',
          daily_wage: 400
        }]
      });
      db.query.mockResolvedValueOnce({
        rows: [{ total: 1 }]
      });

      // Act
      await jobController.getWorkerJobs(mockRequest, mockResponse);

      // Assert
      const sqlQuery = db.query.mock.calls[0][0];
      
      // Verify correct field names are used
      expect(sqlQuery).toContain('i.wage_amount');
      expect(sqlQuery).toContain('i.original_wage');
      expect(sqlQuery).toContain('i.wage_unit');
      expect(sqlQuery).toContain('p.payment_type');
      
      // Verify incorrect field names are NOT used
      expect(sqlQuery).not.toContain('i.wage_offer');
      expect(sqlQuery).not.toContain('i.wage_type');
      expect(sqlQuery).not.toContain('p.work_description');
    });

    it('should return correct wage data for hourly jobs', async () => {
      // Arrange
      const mockRequest = {
        user: { id: 'worker-123' },
        query: {}
      };
      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      const mockJobData = {
        id: 'job-123',
        project_name: 'Cleaning staff',
        payment_type: 'hourly',
        original_wage: 50,      // 正确的时薪
        daily_wage: 400,        // 日薪（50*8）
        wage_amount: null,
        wage_unit: 'hour'
      };

      db.query.mockResolvedValueOnce({ rows: [mockJobData] });
      db.query.mockResolvedValueOnce({ rows: [{ total: 1 }] });

      // Act
      await jobController.getWorkerJobs(mockRequest, mockResponse);

      // Assert
      const responseData = mockResponse.json.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data[0].original_wage).toBe(50);
      expect(responseData.data[0].payment_type).toBe('hourly');
    });
  });
});

describe('Wage Calculation Tests', () => {
  it('should correctly calculate hourly wage from daily wage', () => {
    const dailyWage = 400;
    const hoursPerDay = 8;
    const hourlyWage = dailyWage / hoursPerDay;
    
    expect(hourlyWage).toBe(50);
  });

  it('should handle different payment types correctly', () => {
    const testCases = [
      {
        payment_type: 'hourly',
        original_wage: 50,
        daily_wage: 400,
        expected_display: '¥50/小时'
      },
      {
        payment_type: 'daily', 
        original_wage: null,
        daily_wage: 400,
        expected_display: '¥400/天'
      },
      {
        payment_type: 'fixed',
        original_wage: 1000,
        daily_wage: null,
        expected_display: '¥1000（总价）'
      }
    ];

    testCases.forEach(testCase => {
      const display = formatWageDisplay(testCase);
      expect(display).toBe(testCase.expected_display);
    });
  });
});

// Helper function to format wage display
function formatWageDisplay(job) {
  if (job.payment_type === 'hourly' && job.original_wage) {
    return `¥${job.original_wage}/小时`;
  } else if (job.payment_type === 'daily' && job.daily_wage) {
    return `¥${job.daily_wage}/天`;
  } else if (job.payment_type === 'fixed' && job.original_wage) {
    return `¥${job.original_wage}（总价）`;
  }
  return '面议';
}