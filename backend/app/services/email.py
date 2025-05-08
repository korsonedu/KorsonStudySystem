# backend/app/services/email.py
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..core.config import (
    MAIL_SERVER, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD,
    MAIL_FROM, MAIL_TLS, MAIL_SSL, SECRET_KEY, ALGORITHM,
    ENVIRONMENT, FRONTEND_URL
)
from datetime import datetime, timedelta
from jose import jwt

# 配置日志
logger = logging.getLogger(__name__)

# 邮件发送者名称
EMAIL_FROM_NAME = "科晟智慧金融"

# 检查邮件配置
if not MAIL_PASSWORD and ENVIRONMENT != "test":
    logger.warning("MAIL_PASSWORD 环境变量未设置，邮件发送功能将不可用")

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
        # 检查必要参数
        if not to_email:
            logger.error("邮件发送失败: 收件人邮箱为空")
            return False

        # 检查邮件配置
        if not MAIL_SERVER or not MAIL_PORT:
            logger.error(f"邮件发送失败: SMTP服务器配置不完整 (server: {MAIL_SERVER}, port: {MAIL_PORT})")
            return False

        # 如果没有设置邮箱密码，则不发送邮件
        if not MAIL_PASSWORD and ENVIRONMENT != "test":
            logger.warning(f"邮件未发送 (to: {to_email}, subject: {subject})，因为 MAIL_PASSWORD 未设置")
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

            logger.info(f"尝试连接SMTP服务器: {MAIL_SERVER}:{MAIL_PORT}")

            # 连接SMTP服务器并发送邮件
            try:
                with smtplib.SMTP(MAIL_SERVER, MAIL_PORT) as server:
                    if MAIL_TLS:
                        logger.debug("SMTP连接成功，启用TLS...")
                        server.starttls()  # 启用TLS加密

                    logger.debug(f"尝试登录SMTP服务器 (username: {MAIL_USERNAME})...")
                    server.login(MAIL_USERNAME, MAIL_PASSWORD)

                    logger.debug(f"发送邮件 (from: {MAIL_FROM}, to: {to_email})...")
                    server.sendmail(MAIL_FROM, to_email, message.as_string())
                    logger.debug("邮件发送完成")
            except smtplib.SMTPAuthenticationError as auth_error:
                logger.error(f"SMTP认证失败: {auth_error}")
                logger.error(f"使用的用户名: {MAIL_USERNAME}")
                logger.error("如果使用Gmail，请确保已启用两步验证并使用应用密码")
                raise
            except smtplib.SMTPRecipientsRefused as recipients_error:
                logger.error(f"收件人被拒绝: {recipients_error}")
                logger.error(f"收件人邮箱: {to_email}")
                raise
            except smtplib.SMTPSenderRefused as sender_error:
                logger.error(f"发件人被拒绝: {sender_error}")
                logger.error(f"发件人邮箱: {MAIL_FROM}")
                raise
            except smtplib.SMTPException as smtp_error:
                logger.error(f"SMTP错误: {smtp_error}")
                raise

            logger.info(f"邮件发送成功 (to: {to_email}, subject: {subject})")
            return True

        except Exception as e:
            logger.error(f"邮件发送失败 (to: {to_email}, subject: {subject}): {str(e)}")
            logger.error(f"错误类型: {type(e).__name__}")
            if ENVIRONMENT == "development":
                import traceback
                logger.error(f"详细错误信息: {traceback.format_exc()}")
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
        # 直接使用传入的 base_url 构建验证链接
        # base_url 应该是完整的前端 URL，如 https://plt.korsonedu.com
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


def send_verification_email(user_email: str, username: str, user_id: int) -> bool:
    """
    创建验证令牌并发送邮箱验证邮件

    Args:
        user_email: 用户邮箱
        username: 用户名
        user_id: 用户ID

    Returns:
        bool: 是否发送成功
    """
    try:
        # 检查邮箱是否为空
        if not user_email:
            logger.warning("无法发送验证邮件：用户邮箱为空")
            return False

        # 创建验证令牌 (有效期7天)
        # 使用 UTC 时间
        expires = datetime.utcnow() + timedelta(days=7)
        jwt_payload = {
            "sub": str(user_id),
            "exp": expires.timestamp(),
            "type": "email_verification"
        }
        verification_token = jwt.encode(jwt_payload, SECRET_KEY, algorithm=ALGORITHM)

        # 使用环境变量中的前端 URL
        base_url = FRONTEND_URL
        if not base_url:
            logger.error("无法发送验证邮件：FRONTEND_URL 环境变量未设置")
            return False

        # 调用EmailService发送验证邮件
        success = EmailService.send_verification_email(
            to_email=user_email,
            username=username,
            verification_token=verification_token,
            base_url=base_url
        )

        if success:
            logger.info(f"验证邮件已发送至: {user_email}")
        else:
            logger.warning(f"验证邮件发送失败: {user_email}")

        return success
    except Exception as e:
        logger.error(f"创建验证邮件时出错: {str(e)}")
        if ENVIRONMENT == "development":
            import traceback
            logger.error(f"详细错误信息: {traceback.format_exc()}")
        return False
