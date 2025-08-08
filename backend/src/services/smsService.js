const logger = require('../utils/logger');

// Mock SMS service for development
// In production, integrate with Aliyun SMS or other SMS providers
class SMSService {
  async sendCode(phone, code) {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Mock SMS sending in development
        logger.info(`[SMS] Sending code ${code} to ${phone}`);
        return {
          success: true,
          messageId: `mock_${Date.now()}`
        };
      }

      // TODO: Implement real SMS service integration
      // Example for Aliyun SMS:
      /*
      const Core = require('@alicloud/pop-core');
      
      const client = new Core({
        accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
        endpoint: 'https://dysmsapi.aliyuncs.com',
        apiVersion: '2017-05-25'
      });

      const params = {
        PhoneNumbers: phone,
        SignName: process.env.SMS_SIGN_NAME,
        TemplateCode: process.env.SMS_TEMPLATE_CODE,
        TemplateParam: JSON.stringify({ code })
      };

      const result = await client.request('SendSms', params);
      
      if (result.Code === 'OK') {
        logger.info(`SMS sent successfully to ${phone}`);
        return {
          success: true,
          messageId: result.BizId
        };
      } else {
        logger.error(`SMS failed for ${phone}:`, result);
        throw new Error(`SMS sending failed: ${result.Message}`);
      }
      */

      // For now, return mock success
      return {
        success: true,
        messageId: `production_mock_${Date.now()}`
      };

    } catch (error) {
      logger.error('SMS service error:', error);
      throw new Error('Failed to send SMS verification code');
    }
  }

  async sendNotification(phone, message) {
    try {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[SMS Notification] Sending to ${phone}: ${message}`);
        return { success: true };
      }

      // TODO: Implement notification SMS
      return { success: true };

    } catch (error) {
      logger.error('SMS notification error:', error);
      throw new Error('Failed to send SMS notification');
    }
  }
}

module.exports = new SMSService();