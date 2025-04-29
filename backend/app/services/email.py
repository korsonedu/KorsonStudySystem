# backend/app/services/email.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 获取邮件配置
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME", "korsonedu@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "korsonedu@gmail.com")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "科晟智慧金融")

# 检查邮件配置
if not EMAIL_PASSWORD:
    print("警告: EMAIL_PASSWORD 环境变量未设置，邮件发送功能将不可用")

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str) -> bool:
        """
        发送HTML格式的邮件
        
        Args:
            to_email: 收件人邮箱
            subject: 邮件主题
            html_content: HTML格式的邮件内容
            
        Returns:
            bool: 是否发送成功
        """
        # 如果没有设置邮箱密码，则不发送邮件
        if not EMAIL_PASSWORD:
            print(f"邮件未发送 (to: {to_email}, subject: {subject})，因为 EMAIL_PASSWORD 未设置")
            return False
            
        try:
            # 创建邮件
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{EMAIL_FROM_NAME} <{EMAIL_FROM}>"
            message["To"] = to_email
            
            # 添加HTML内容
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # 连接SMTP服务器并发送邮件
            with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
                server.starttls()  # 启用TLS加密
                server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
                server.sendmail(EMAIL_FROM, to_email, message.as_string())
                
            print(f"邮件发送成功 (to: {to_email}, subject: {subject})")
            return True
            
        except Exception as e:
            print(f"邮件发送失败 (to: {to_email}, subject: {subject}): {str(e)}")
            return False
    
    @staticmethod
    def send_verification_email(to_email: str, username: str, verification_token: str, base_url: str) -> bool:
        """
        发送邮箱验证邮件
        
        Args:
            to_email: 收件人邮箱
            username: 用户名
            verification_token: 验证令牌
            base_url: 网站基础URL
            
        Returns:
            bool: 是否发送成功
        """
        # 构建验证链接
        verification_link = f"{base_url}/verify-email?token={verification_token}"
        
        # 邮件主题
        subject = "请验证您的邮箱 - 科晟智慧金融学习平台"
        
        # 邮件内容
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #3498db;">欢迎加入科晟智慧金融学习平台</h2>
            </div>
            
            <p>亲爱的 <strong>{username}</strong>，</p>
            
            <p>感谢您注册科晟智慧金融学习平台。请点击下面的链接验证您的邮箱地址：</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_link}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">验证邮箱</a>
            </div>
            
            <p>或者，您可以复制以下链接到浏览器地址栏：</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">{verification_link}</p>
            
            <p>如果您没有注册我们的平台，请忽略此邮件。</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
                <p>此邮件由系统自动发送，请勿回复。</p>
                <p>© {EmailService.get_current_year()} 科晟智慧金融 版权所有</p>
            </div>
        </div>
        """
        
        # 发送邮件
        return EmailService.send_email(to_email, subject, html_content)
    
    @staticmethod
    def get_current_year() -> str:
        """获取当前年份"""
        from datetime import datetime
        return str(datetime.now().year)
