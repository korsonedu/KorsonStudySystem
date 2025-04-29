# backend/app/services/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import (
    MAIL_SERVER, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD,
    MAIL_FROM, MAIL_TLS, MAIL_SSL
)

# 邮件发送者名称
EMAIL_FROM_NAME = "科晟智慧金融"

# 检查邮件配置
if not MAIL_PASSWORD:
    print("警告: MAIL_PASSWORD 环境变量未设置，邮件发送功能将不可用")

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
        if not MAIL_PASSWORD:
            print(f"邮件未发送 (to: {to_email}, subject: {subject})，因为 MAIL_PASSWORD 未设置")
            return False

        try:
            # 创建邮件
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{EMAIL_FROM_NAME} <{MAIL_FROM}>"
            message["To"] = to_email

            # 添加HTML内容
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

            print(f"尝试连接SMTP服务器: {MAIL_SERVER}:{MAIL_PORT}")
            print(f"使用账户: {MAIL_USERNAME}")

            # 连接SMTP服务器并发送邮件
            try:
                with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
                    if MAIL_TLS:
                        print("SMTP连接成功，启用TLS...")
                        server.starttls()  # 启用TLS加密

                    print("尝试登录...")
                    server.login(MAIL_USERNAME, MAIL_PASSWORD)
                    print("登录成功，发送邮件...")

                    server.sendmail(MAIL_FROM, to_email, message.as_string())
                    print("邮件发送完成")
            except smtplib.SMTPAuthenticationError as auth_error:
                print(f"SMTP认证失败: {auth_error}")
                print("如果使用Gmail，请确保：")
                print("1. 已启用两步验证")
                print("2. 使用的是应用密码而不是账户密码")
                print("3. 应用密码正确无误")
                raise
            except smtplib.SMTPException as smtp_error:
                print(f"SMTP错误: {smtp_error}")
                raise

            print(f"邮件发送成功 (to: {to_email}, subject: {subject})")
            return True

        except Exception as e:
            print(f"邮件发送失败 (to: {to_email}, subject: {subject}): {str(e)}")
            print(f"错误类型: {type(e).__name__}")
            import traceback
            print(f"详细错误信息: {traceback.format_exc()}")
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
        # 构建验证链接 - 使用前端URL
        # 从base_url中提取协议和主机部分
        import re
        protocol_host_match = re.match(r'(https?://[^:/]+)(:\d+)?', base_url)
        if protocol_host_match:
            protocol_host = protocol_host_match.group(1)
            # 假设前端运行在5173端口
            frontend_url = f"{protocol_host}:5173"
            verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        else:
            # 如果无法解析，则使用默认的前端URL
            verification_link = f"http://localhost:5173/verify-email?token={verification_token}"

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
