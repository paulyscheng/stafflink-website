const logger = require('../utils/logger');
const twilio = require('twilio');
const tencentcloud = require('tencentcloud-sdk-nodejs');
const fs = require('fs');
const path = require('path');

// 配置选项 - 可以通过环境变量设置使用哪个服务
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'mock'; // 'twilio', 'tencent', 'aliyun', 'mock'

// Twilio配置
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// 腾讯云SMS配置
const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID;
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY;
const TENCENT_SMS_SDK_APP_ID = process.env.TENCENT_SMS_SDK_APP_ID;
const TENCENT_SMS_SIGN = process.env.TENCENT_SMS_SIGN || 'StaffLink';

class SMSService {
  constructor() {
    this.provider = SMS_PROVIDER;
    logger.info(`SMS Service initialized with provider: ${this.provider}`);
    
    if (this.provider === 'twilio' && TWILIO_ACCOUNT_SID) {
      this.twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    } else if (this.provider === 'tencent' && TENCENT_SECRET_ID) {
      const SmsClient = tencentcloud.sms.v20210111.Client;
      const clientConfig = {
        credential: {
          secretId: TENCENT_SECRET_ID,
          secretKey: TENCENT_SECRET_KEY,
        },
        region: 'ap-guangzhou',
        profile: {
          httpProfile: {
            endpoint: 'sms.tencentcloudapi.com',
          },
        },
      };
      this.tencentClient = new SmsClient(clientConfig);
    }
  }
  // 发送验证码
  async sendCode(phone, code) {
    logger.info(`📱 Sending verification code to ${phone}: ${code}`);
    
    try {
      switch (this.provider) {
        case 'twilio':
          return await this.sendTwilioSMS(phone, `【StaffLink】您的验证码是：${code}，5分钟内有效。请勿泄露给他人。`);
        
        case 'tencent':
          return await this.sendTencentSMS(phone, '验证码模板ID', [code, '5']);
        
        case 'mock':
        default:
          return this.mockSendSMS(phone, `验证码：${code}`);
      }
    } catch (error) {
      logger.error('SMS send error:', error);
      throw new Error('Failed to send SMS verification code');
    }
  }

  // 发送工作邀请通知
  async sendInvitationNotification(phone, workerName, projectName, wage) {
    const message = `${workerName}您好，您收到新的工作邀请：${projectName}，工资：¥${wage}。请登录App查看详情。`;
    
    try {
      switch (this.provider) {
        case 'twilio':
          return await this.sendTwilioSMS(phone, `【StaffLink】${message}`);
        
        case 'tencent':
          return await this.sendTencentSMS(phone, '邀请通知模板ID', [workerName, projectName, wage]);
        
        case 'mock':
        default:
          return this.mockSendSMS(phone, message);
      }
    } catch (error) {
      logger.error('SMS send error:', error);
      throw error;
    }
  }

  // 发送工作完成通知
  async sendWorkCompletedNotification(phone, companyName, workerName, projectName) {
    const message = `${companyName}您好，${workerName}已完成${projectName}的工作，请登录App确认并支付。`;
    
    try {
      switch (this.provider) {
        case 'twilio':
          return await this.sendTwilioSMS(phone, `【StaffLink】${message}`);
        
        case 'tencent':
          return await this.sendTencentSMS(phone, '完成通知模板ID', [companyName, workerName, projectName]);
        
        case 'mock':
        default:
          return this.mockSendSMS(phone, message);
      }
    } catch (error) {
      logger.error('SMS send error:', error);
      throw error;
    }
  }

  // 发送支付成功通知
  async sendPaymentNotification(phone, workerName, amount, projectName) {
    const message = `${workerName}您好，您的工资¥${amount}已到账（${projectName}）。感谢您的辛勤工作！`;
    
    try {
      switch (this.provider) {
        case 'twilio':
          return await this.sendTwilioSMS(phone, `【StaffLink】${message}`);
        
        case 'tencent':
          return await this.sendTencentSMS(phone, '支付通知模板ID', [workerName, amount, projectName]);
        
        case 'mock':
        default:
          return this.mockSendSMS(phone, message);
      }
    } catch (error) {
      logger.error('SMS send error:', error);
      throw error;
    }
  }

  // Twilio发送实现
  async sendTwilioSMS(to, body) {
    if (!this.twilioClient) {
      logger.warn('Twilio client not initialized, falling back to mock');
      return this.mockSendSMS(to, body);
    }

    // 处理中国手机号格式
    const formattedPhone = to.startsWith('+86') ? to : `+86${to}`;
    
    const message = await this.twilioClient.messages.create({
      body,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    
    logger.info(`✅ Twilio SMS sent: ${message.sid}`);
    return {
      success: true,
      messageId: message.sid,
      provider: 'twilio'
    };
  }

  // 腾讯云SMS发送实现
  async sendTencentSMS(phone, templateId, templateParams) {
    if (!this.tencentClient) {
      logger.warn('Tencent client not initialized, falling back to mock');
      return this.mockSendSMS(phone, templateParams.join(' '));
    }

    const params = {
      PhoneNumberSet: [phone.startsWith('+86') ? phone : `+86${phone}`],
      SmsSdkAppId: TENCENT_SMS_SDK_APP_ID,
      SignName: TENCENT_SMS_SIGN,
      TemplateId: templateId,
      TemplateParamSet: templateParams,
    };

    const response = await this.tencentClient.SendSms(params);
    
    logger.info(`✅ Tencent SMS sent:`, response);
    return {
      success: true,
      messageId: response.RequestId,
      provider: 'tencent'
    };
  }

  // 模拟发送（开发环境）
  mockSendSMS(phone, message) {
    logger.info(`📱 [MOCK SMS] To: ${phone}`);
    logger.info(`📝 Message: ${message}`);
    
    // 保存到日志文件，方便开发调试
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logMessage = `${new Date().toISOString()} | To: ${phone} | Message: ${message}\n`;
    fs.appendFileSync(path.join(logDir, 'sms_logs.txt'), logMessage);
    
    return {
      success: true,
      messageId: `MOCK_${Date.now()}`,
      provider: 'mock',
      message // 开发环境返回消息内容
    };
  }

  // 发送自定义通知
  async sendNotification(phone, message) {
    logger.info(`📱 Sending notification to ${phone}`);
    
    try {
      switch (this.provider) {
        case 'twilio':
          return await this.sendTwilioSMS(phone, `【StaffLink】${message}`);
        
        case 'tencent':
          return await this.sendTencentSMS(phone, '通用模板ID', [message]);
        
        case 'mock':
        default:
          return this.mockSendSMS(phone, message);
      }
    } catch (error) {
      logger.error('SMS notification error:', error);
      throw new Error('Failed to send SMS notification');
    }
  }
}

module.exports = new SMSService();