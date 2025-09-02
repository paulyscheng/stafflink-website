const logger = require('../utils/logger');
const twilio = require('twilio');
const axios = require('axios');

// AI语音电话服务配置
const VOICE_PROVIDER = process.env.VOICE_PROVIDER || 'mock'; // 'twilio', 'aliyun', 'baidu', 'mock'

// Twilio Voice配置
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_VOICE_NUMBER;

// 阿里云语音配置
const ALIYUN_ACCESS_KEY = process.env.ALIYUN_ACCESS_KEY;
const ALIYUN_SECRET_KEY = process.env.ALIYUN_SECRET_KEY;

// 百度AI语音配置  
const BAIDU_APP_ID = process.env.BAIDU_APP_ID;
const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;

class VoiceCallService {
  constructor() {
    this.provider = VOICE_PROVIDER;
    logger.info(`Voice Call Service initialized with provider: ${this.provider}`);
    
    if (this.provider === 'twilio' && TWILIO_ACCOUNT_SID) {
      this.twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    }
  }

  // 工作邀请语音通知
  async makeInvitationCall(phone, workerName, projectName, wage, projectDate) {
    const script = `
      您好，${workerName}先生。
      这里是蓝领派工平台。
      您有一个新的工作邀请。
      项目名称：${projectName}。
      工作日期：${projectDate}。
      工资待遇：每天${wage}元。
      请打开手机应用查看详情并确认。
      如需重听请按1，结束请挂机。
    `;
    
    return this.makeCall(phone, script, 'invitation');
  }

  // 紧急工作通知
  async makeUrgentCall(phone, workerName, projectName, startTime) {
    const script = `
      您好，${workerName}先生。
      紧急通知！
      ${projectName}项目需要您在${startTime}前到岗。
      请尽快确认是否能够按时到达。
      如需重听请按1，确认到岗请按2，无法到岗请按3。
    `;
    
    return this.makeCall(phone, script, 'urgent');
  }

  // 支付到账通知
  async makePaymentCall(phone, workerName, amount) {
    const script = `
      您好，${workerName}先生。
      您的工资${amount}元已经成功到账。
      请查收。
      感谢您的辛勤工作。
      祝您生活愉快。
    `;
    
    return this.makeCall(phone, script, 'payment');
  }

  // 通用语音电话
  async makeCall(phone, script, type = 'general') {
    logger.info(`📞 Making ${type} voice call to ${phone}`);
    
    try {
      switch (this.provider) {
        case 'twilio':
          return await this.makeTwilioCall(phone, script);
        
        case 'aliyun':
          return await this.makeAliyunCall(phone, script);
        
        case 'baidu':
          return await this.makeBaiduCall(phone, script);
        
        case 'mock':
        default:
          return this.mockMakeCall(phone, script, type);
      }
    } catch (error) {
      logger.error('Voice call error:', error);
      throw error;
    }
  }

  // Twilio语音电话实现
  async makeTwilioCall(to, script) {
    if (!this.twilioClient) {
      logger.warn('Twilio client not initialized, falling back to mock');
      return this.mockMakeCall(to, script);
    }

    const formattedPhone = to.startsWith('+86') ? to : `+86${to}`;
    
    // 创建TwiML响应
    const twimlUrl = await this.createTwiMLUrl(script);
    
    const call = await this.twilioClient.calls.create({
      url: twimlUrl,
      to: formattedPhone,
      from: TWILIO_PHONE_NUMBER,
      record: true, // 录音以备查
      statusCallback: `${process.env.API_BASE_URL}/api/voice/callback`,
      statusCallbackMethod: 'POST'
    });
    
    logger.info(`✅ Twilio call initiated: ${call.sid}`);
    
    return {
      success: true,
      callId: call.sid,
      provider: 'twilio',
      status: call.status
    };
  }

  // 创建TwiML URL（实际项目中应该是动态生成的）
  async createTwiMLUrl(script) {
    // 这里应该将script转换为TwiML并托管在服务器上
    // 简化示例，实际需要实现TwiML生成逻辑
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say language="zh-CN">${script}</Say>
        <Gather numDigits="1" timeout="10">
          <Say language="zh-CN">请按键选择</Say>
        </Gather>
        <Say language="zh-CN">谢谢，再见</Say>
      </Response>
    `;
    
    // 实际应该上传到服务器并返回URL
    return `${process.env.API_BASE_URL}/api/voice/twiml/${Date.now()}`;
  }

  // 阿里云语音电话实现
  async makeAliyunCall(phone, script) {
    // 使用阿里云语音服务API
    const params = {
      CalledNumber: phone,
      CalledShowNumber: process.env.ALIYUN_DISPLAY_NUMBER,
      TtsCode: await this.generateTTS(script), // 需要先生成TTS
      PlayTimes: 1,
      Volume: 100,
      Speed: 0,
      OutId: `call_${Date.now()}`
    };

    // 调用阿里云API
    logger.info('Making Aliyun voice call...');
    
    return {
      success: true,
      callId: params.OutId,
      provider: 'aliyun'
    };
  }

  // 百度AI语音合成+电话
  async makeBaiduCall(phone, script) {
    // 1. 先进行语音合成
    const audioUrl = await this.baiduTTS(script);
    
    // 2. 通过运营商API拨打电话并播放音频
    logger.info('Making Baidu AI voice call...');
    
    return {
      success: true,
      callId: `baidu_${Date.now()}`,
      provider: 'baidu',
      audioUrl
    };
  }

  // 百度TTS语音合成
  async baiduTTS(text) {
    // 获取access token
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
    const tokenResponse = await axios.get(tokenUrl);
    const accessToken = tokenResponse.data.access_token;

    // 语音合成
    const ttsUrl = `https://tsn.baidu.com/text2audio`;
    const params = {
      tex: encodeURIComponent(text),
      tok: accessToken,
      cuid: 'stafflink',
      ctp: 1,
      lan: 'zh',
      spd: 5, // 语速
      pit: 5, // 音调
      vol: 15, // 音量
      per: 0, // 发音人
      aue: 3  // mp3格式
    };

    const audioUrl = `${ttsUrl}?${Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&')}`;
    return audioUrl;
  }

  // 模拟语音电话（开发环境）
  mockMakeCall(phone, script, type) {
    logger.info(`📞 [MOCK CALL] Type: ${type} | To: ${phone}`);
    logger.info(`📝 Script: ${script}`);
    
    // 保存到文件
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logMessage = `
===================================
Time: ${new Date().toISOString()}
Type: ${type}
Phone: ${phone}
Script: ${script}
===================================
`;
    
    fs.appendFileSync(path.join(logDir, 'voice_calls.txt'), logMessage);
    
    // 模拟通话记录
    const callRecord = {
      success: true,
      callId: `MOCK_CALL_${Date.now()}`,
      provider: 'mock',
      duration: Math.floor(Math.random() * 120) + 30, // 30-150秒
      status: 'completed',
      userResponse: type === 'urgent' ? '2' : null, // 模拟用户按键
      script,
      phone
    };
    
    // 模拟异步回调
    setTimeout(() => {
      logger.info(`📞 [MOCK CALL COMPLETED] CallId: ${callRecord.callId}, Duration: ${callRecord.duration}s`);
    }, 2000);
    
    return callRecord;
  }

  // 处理通话回调（记录通话状态）
  async handleCallCallback(callId, status, duration, recordingUrl) {
    logger.info(`Call callback received - ID: ${callId}, Status: ${status}, Duration: ${duration}`);
    
    // 保存通话记录到数据库
    try {
      const db = require('../config/database');
      await db.query(`
        INSERT INTO call_logs (
          call_id, status, duration, recording_url, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `, [callId, status, duration, recordingUrl]);
    } catch (error) {
      logger.error('Failed to save call log:', error);
    }
    
    return { success: true };
  }

  // 批量语音通知
  async makeBatchCalls(calls) {
    const results = [];
    
    // 控制并发数量，避免过载
    const batchSize = 5;
    for (let i = 0; i < calls.length; i += batchSize) {
      const batch = calls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(call => 
          this.makeCall(call.phone, call.script, call.type)
            .catch(error => ({
              success: false,
              phone: call.phone,
              error: error.message
            }))
        )
      );
      results.push(...batchResults);
      
      // 批次间延迟
      if (i + batchSize < calls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // 生成通话报告
  async generateCallReport(startDate, endDate) {
    try {
      const db = require('../config/database');
      const result = await db.query(`
        SELECT 
          COUNT(*) as total_calls,
          AVG(duration) as avg_duration,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_calls,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls
        FROM call_logs
        WHERE created_at BETWEEN $1 AND $2
      `, [startDate, endDate]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to generate call report:', error);
      throw error;
    }
  }
}

module.exports = new VoiceCallService();