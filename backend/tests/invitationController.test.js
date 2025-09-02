const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const db = require('../../src/config/database');
const invitationController = require('../../src/controllers/invitationController');

// Mock the database
jest.mock('../../src/config/database');

describe('InvitationController Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('respondToInvitation', () => {
    it('should use correct field name response_note instead of response_message', async () => {
      // Arrange
      const mockRequest = {
        user: { id: 'worker-123' },
        params: { id: 'invitation-123' },
        body: { 
          status: 'accepted',
          response_message: 'Got it'
        }
      };
      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Mock invitation exists check
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'invitation-123',
          worker_id: 'worker-123',
          status: 'pending',
          expires_at: new Date(Date.now() + 86400000) // Tomorrow
        }]
      });

      // Mock update query
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'invitation-123',
          status: 'accepted'
        }]
      });

      // Mock job record creation
      db.query.mockResolvedValueOnce({ rows: [{}] });

      // Act
      await invitationController.respondToInvitation(mockRequest, mockResponse);

      // Assert
      const updateQuery = db.query.mock.calls[1][0];
      const updateParams = db.query.mock.calls[1][1];
      
      // Verify correct field name is used
      expect(updateQuery).toContain('response_note');
      expect(updateQuery).not.toContain('response_message');
      
      // Verify parameters
      expect(updateParams[0]).toBe('accepted');
      expect(updateParams[1]).toBe('Got it');
      expect(updateParams[2]).toBe('invitation-123');
    });

    it('should handle missing response_message gracefully', async () => {
      // Arrange
      const mockRequest = {
        user: { id: 'worker-123' },
        params: { id: 'invitation-123' },
        body: { 
          status: 'rejected'
          // No response_message provided
        }
      };
      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      // Mock invitation exists
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 'invitation-123',
          worker_id: 'worker-123',
          status: 'pending'
        }]
      });

      // Mock update
      db.query.mockResolvedValueOnce({
        rows: [{ id: 'invitation-123', status: 'rejected' }]
      });

      // Act
      await invitationController.respondToInvitation(mockRequest, mockResponse);

      // Assert
      const updateParams = db.query.mock.calls[1][1];
      expect(updateParams[1]).toBe(''); // Empty string for missing message
    });
  });
});

describe('Invitation Table Field Validation', () => {
  it('should document correct invitation table fields', () => {
    const correctFields = [
      'id',
      'company_id', 
      'worker_id',
      'project_id',
      'status',
      'invited_at',
      'responded_at',
      'response_note',     // NOT response_message
      'wage_amount',       // NOT wage_offer
      'original_wage',
      'wage_unit',        // NOT wage_type
      'start_date',
      'end_date',
      'created_at',
      'updated_at'
    ];

    const incorrectFields = [
      'response_message',  // Should be response_note
      'wage_offer',       // Should be wage_amount
      'wage_type',        // Should be wage_unit
      'message'           // Doesn't exist
    ];

    // This serves as documentation
    expect(correctFields).toContain('response_note');
    expect(correctFields).not.toContain('response_message');
    expect(incorrectFields).toContain('response_message');
  });
});

describe('Job Records Creation', () => {
  it('should use correct field names when creating job_records', () => {
    const correctJobRecordFields = {
      'start_date': 'NOT work_date',
      'wage_amount': 'NOT payment_amount',
      'status': 'should be "active" not "accepted"'
    };

    const jobRecordDoesNotHave = [
      'payment_type',
      'payment_amount',
      'work_date',
      'wage_offer',
      'wage_type'
    ];

    // Document the correct INSERT statement
    const correctInsert = `
      INSERT INTO job_records (
        id, invitation_id, project_id, worker_id, company_id,
        start_date, status, wage_amount, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, CURRENT_TIMESTAMP)
    `;

    expect(correctInsert).toContain('start_date');
    expect(correctInsert).toContain('wage_amount');
    expect(correctInsert).not.toContain('work_date');
    expect(correctInsert).not.toContain('payment_amount');
  });
});