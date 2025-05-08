/**
 * 邮件配置
 * 集中管理邮件相关的配置项
 */

// 邮件发送者配置
export const EMAIL_SENDER = {
  // 发送邮件的地址
  ADDRESS: 'korsonedu@gmail.com',
  // 发送邮件的名称
  NAME: '科晟智慧金融'
};

// 邮件模板配置
export const EMAIL_TEMPLATES = {
  // 注册确认邮件
  REGISTRATION: {
    // 邮件主题
    SUBJECT: '欢迎注册科晟智慧金融学习平台',
    // 邮件内容模板
    BODY: (username: string, confirmationLink: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #3498db;">欢迎加入科晟智慧金融学习平台</h2>
        </div>
        
        <p>亲爱的 <strong>${username}</strong>，</p>
        
        <p>感谢您注册科晟智慧金融学习平台。请点击下面的链接确认您的邮箱地址：</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationLink}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">确认邮箱</a>
        </div>
        
        <p>或者，您可以复制以下链接到浏览器地址栏：</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${confirmationLink}</p>
        
        <p>如果您没有注册我们的平台，请忽略此邮件。</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
          <p>此邮件由系统自动发送，请勿回复。</p>
          <p>© ${new Date().getFullYear()} 科晟智慧金融 版权所有</p>
        </div>
      </div>
    `
  },
  
  // 密码重置邮件
  PASSWORD_RESET: {
    // 邮件主题
    SUBJECT: '科晟智慧金融学习平台 - 密码重置',
    // 邮件内容模板
    BODY: (username: string, resetLink: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #3498db;">密码重置请求</h2>
        </div>
        
        <p>亲爱的 <strong>${username}</strong>，</p>
        
        <p>我们收到了您的密码重置请求。请点击下面的链接重置您的密码：</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">重置密码</a>
        </div>
        
        <p>或者，您可以复制以下链接到浏览器地址栏：</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${resetLink}</p>
        
        <p>如果您没有请求重置密码，请忽略此邮件。</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
          <p>此邮件由系统自动发送，请勿回复。</p>
          <p>© ${new Date().getFullYear()} 科晟智慧金融 版权所有</p>
        </div>
      </div>
    `
  }
};

export default {
  SENDER: EMAIL_SENDER,
  TEMPLATES: EMAIL_TEMPLATES
};
