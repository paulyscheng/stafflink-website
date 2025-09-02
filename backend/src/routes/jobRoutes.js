const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

// 所有路由都需要认证
router.use(protect);

// 获取工作列表
router.get('/worker/jobs', jobController.getWorkerJobs);
router.get('/company/jobs', jobController.getCompanyJobs);

// 获取工作详情
router.get('/detail/:jobRecordId', jobController.getJobDetail);

// 工人操作
router.post('/worker/check-in', jobController.workerCheckIn);
router.post('/worker/start', jobController.workerStartWork);
router.post('/worker/complete', jobController.workerCompleteWork);

// 企业操作
router.post('/company/confirm', jobController.companyConfirmWork);
router.post('/company/pay', jobController.companyPayWork);

// 照片上传
router.post('/photo/upload', jobController.uploadWorkPhoto);

module.exports = router;