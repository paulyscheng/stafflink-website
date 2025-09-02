const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authSimple');
const { body } = require('express-validator');
const {
  createInvitation,
  createBatchInvitations,
  getCompanyInvitations,
  getWorkerInvitations,
  respondToInvitation,
  cancelInvitation,
  getInvitationDetail
} = require('../controllers/invitationController');

// 所有路由都需要认证
router.use(authenticateToken);

// 创建单个邀请
router.post('/', 
  [
    body('project_id').isUUID().withMessage('项目ID无效'),
    body('worker_id').isUUID().withMessage('工人ID无效'),
    body('wage_amount').optional().isNumeric().withMessage('工资必须是数字'),
    body('wage_unit').optional().isIn(['hourly', 'daily', 'fixed']).withMessage('工资类型无效')
  ],
  createInvitation
);

// 批量创建邀请
router.post('/batch',
  [
    body('project_id').isUUID().withMessage('项目ID无效'),
    body('worker_ids').isArray().withMessage('工人ID列表必须是数组'),
    body('worker_ids.*').isUUID().withMessage('工人ID无效')
  ],
  createBatchInvitations
);

// 获取公司发送的邀请
router.get('/company', getCompanyInvitations);

// 获取特定项目的邀请
router.get('/project/:projectId', getCompanyInvitations);

// 获取工人收到的邀请
router.get('/worker', getWorkerInvitations);

// 获取邀请详情
router.get('/:id', getInvitationDetail);

// 工人响应邀请
router.put('/:id/respond',
  [
    body('status').isIn(['accepted', 'rejected']).withMessage('响应状态无效'),
    body('response_note').optional().isString()
  ],
  respondToInvitation
);

// 取消邀请
router.put('/:id/cancel', cancelInvitation);

module.exports = router;