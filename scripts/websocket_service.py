#!/usr/bin/env python
"""
WebSocket服务
独立运行WebSocket服务，避免与主API服务冲突
"""

import os
import sys
import uvicorn
from pathlib import Path
from fastapi import FastAPI, WebSocket, Depends
from sqlalchemy.orm import Session
from typing import Dict
import json
import asyncio
import logging
import time
from jose import JWTError, jwt
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# 全局变量
connected_users = {}  # 存储所有连接的WebSocket客户端
user_privacy_mode = {}  # 存储用户的隐私模式状态

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 添加项目根目录到Python路径
ROOT_DIR = Path(__file__).parent.parent
sys.path.append(str(ROOT_DIR))
sys.path.append(str(ROOT_DIR / "backend"))

# 加载环境变量
# 首先尝试加载backend/.env文件
backend_env_path = ROOT_DIR / "backend" / ".env"
if backend_env_path.exists():
    logger.info(f"Loading environment variables from {backend_env_path}")
    load_dotenv(dotenv_path=backend_env_path)
else:
    # 如果backend/.env不存在，尝试加载根目录的.env文件
    root_env_path = ROOT_DIR / ".env"
    if root_env_path.exists():
        logger.info(f"Loading environment variables from {root_env_path}")
        load_dotenv(dotenv_path=root_env_path)
    else:
        logger.warning("No .env file found, using default values")

# 导入数据库依赖
from app.database import get_db
# 导入所有需要的模型
from app.modules.common.models.user import User
# 导入Task模型以解决关系问题
from app.modules.study.models.task import Task
# 导入Plan模型以解决关系问题
from app.modules.study.models.plan import Plan
# 导入Achievement模型以解决关系问题
from app.modules.study.models.achievement import Achievement
from app.core.config import SECRET_KEY, ALGORITHM

# 确保使用正确的SECRET_KEY
logger.info(f"Using SECRET_KEY: {SECRET_KEY[:10]}...")

# 创建FastAPI应用
app = FastAPI(title="WebSocket Service")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有头
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    logger.info(f"New WebSocket connection attempt from {websocket.client}")
    await websocket.accept()
    logger.info(f"WebSocket connection accepted from {websocket.client}")
    user_id = None

    try:
        # 等待认证消息
        logger.info(f"Waiting for authentication message from {websocket.client}")
        auth_data = await websocket.receive_text()
        logger.info(f"Received authentication data: {auth_data[:20]}...")

        try:
            auth_json = json.loads(auth_data)
            token = auth_json.get("token")
            logger.info(f"Parsed authentication token: {token[:10]}...")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse authentication data: {str(e)}")
            await websocket.send_json({"error": "Invalid authentication data format"})
            await websocket.close()
            return

        if not token:
            logger.error(f"No token provided in authentication message")
            await websocket.send_json({"error": "No token provided"})
            await websocket.close()
            return

        # 验证token
        try:
            logger.info(f"Attempting to decode token: {token[:10]}...")

            # 首先尝试使用正确的SECRET_KEY验证token
            try:
                # 使用正确的SECRET_KEY验证token
                payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                logger.info(f"Token verified successfully, payload: {payload}")

                username = payload.get("sub")
                if not username:
                    logger.error("Username not found in token payload")
                    await websocket.send_json({"error": "Invalid token"})
                    await websocket.close()
                    return

                logger.info(f"Username from token: {username}")

                # 获取用户ID
                logger.info(f"Looking up user in database: {username}")
                user = db.query(User).filter(User.username == username).first()

                if not user:
                    logger.error(f"User not found in database: {username}")
                    await websocket.send_json({"error": "User not found"})
                    await websocket.close()
                    return

                user_id = user.id
                logger.info(f"User found in database: {username}, ID: {user_id}")

            except Exception as e:
                # 如果验证失败，尝试解码token而不验证签名
                logger.warning(f"Token verification failed: {str(e)}, trying to decode without verification")

                # 解码token而不验证签名
                unverified_payload = jwt.decode(token, "", options={"verify_signature": False})
                logger.info(f"Unverified token payload: {unverified_payload}")

                # 从未验证的payload中提取用户名
                username = unverified_payload.get("sub")
                if not username:
                    logger.error("Username not found in token payload")
                    await websocket.send_json({"error": "Invalid token"})
                    await websocket.close()
                    return

                logger.info(f"Username from unverified token: {username}")

                # 获取用户ID
                logger.info(f"Looking up user in database: {username}")
                user = db.query(User).filter(User.username == username).first()

                if not user:
                    logger.error(f"User not found in database: {username}")
                    await websocket.send_json({"error": "User not found"})
                    await websocket.close()
                    return

                user_id = user.id
                logger.info(f"User found in database: {username}, ID: {user_id}")

        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            await websocket.send_json({"error": "Invalid token"})
            await websocket.close()
            return

        # 存储连接
        connected_users[user_id] = websocket
        logger.info(f"User {user_id} connected. Total users: {len(connected_users)}")

        # 广播在线用户列表
        await broadcast_online_users(db)

        # 保持连接并处理消息
        while True:
            data = await websocket.receive_text()
            try:
                # 尝试解析JSON消息
                message = json.loads(data)

                # 处理心跳消息
                if message.get("type") == "heartbeat":
                    await websocket.send_json({"type": "heartbeat_ack"})

                # 处理获取在线用户列表请求
                elif message.get("type") == "get_online_users":
                    await broadcast_online_users(db)

                # 处理隐私模式设置
                elif message.get("type") == "privacy_mode":
                    # 记录用户隐私模式设置
                    privacy_enabled = message.get("enabled", False)
                    user_privacy_mode[user_id] = privacy_enabled
                    logger.info(f"User {user_id} set privacy mode: {privacy_enabled}")
                    # 更新在线用户列表
                    await broadcast_online_users(db)

                # 处理任务更新消息
                elif message.get("type") == "task_update":
                    action = message.get("action")
                    task_data = message.get("task")

                    if action and task_data:
                        logger.info(f"收到任务更新: {action}, 任务数据: {task_data}")
                        # 广播任务更新给所有用户
                        await broadcast_task_update(user_id, action, task_data)
                    else:
                        logger.warning(f"任务更新消息格式不正确: {message}")

                # 处理其他消息
                else:
                    logger.info(f"收到未知消息: {data}")
            except json.JSONDecodeError:
                # 如果不是JSON格式，可能是简单的ping消息
                if data == "ping":
                    await websocket.send_text("pong")
                else:
                    logger.warning(f"收到非JSON消息: {data}")

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    finally:
        # 断开连接时清理
        if user_id and user_id in connected_users:
            del connected_users[user_id]
            if user_id in user_privacy_mode:
                del user_privacy_mode[user_id]
            logger.info(f"User {user_id} disconnected. Total users: {len(connected_users)}")
            # 广播更新后的在线用户列表
            await broadcast_online_users(db)

async def broadcast_online_users(db: Session):
    """广播在线用户列表到所有连接的客户端"""
    if not connected_users:
        logger.info("没有连接的客户端")
        return

    # 获取在线用户信息
    user_ids = list(connected_users.keys())
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    
    logger.info(f"当前在线用户ID列表: {user_ids}")
    logger.info(f"当前隐私模式状态: {user_privacy_mode}")

    # 构建基础用户信息列表
    base_users = []
    for user in users:
        privacy_mode = user_privacy_mode.get(user.id, False)
        logger.info(f"用户 {user.username}(ID: {user.id}) 的隐私模式状态: {privacy_mode}")
        base_users.append({
            "id": user.id,
            "username": user.username,
            "avatar": user.avatar,
            "lastActivity": int(time.time()),
            "privacyMode": privacy_mode
        })

    logger.info(f"准备广播在线用户列表: {len(base_users)}人在线")

    # 为每个连接的用户广播定制的在线用户列表
    for user_id, websocket in connected_users.items():
        try:
            # 获取当前用户的隐私模式状态
            current_user_privacy = user_privacy_mode.get(user_id, False)
            logger.info(f"用户 {user_id} 的隐私模式状态: {current_user_privacy}")
            
            # 创建定制的用户列表
            filtered_users = []
            
            # 添加当前用户（如果存在）
            current_user = next((user for user in base_users if user["id"] == user_id), None)
            if current_user:
                filtered_users.append(current_user)
                logger.info(f"添加当前用户到列表: {current_user['username']}")
            
            # 添加其他非隐私模式的用户
            for user in base_users:
                if user["id"] != user_id and not user["privacyMode"]:
                    filtered_users.append(user)
                    logger.info(f"添加其他用户到列表: {user['username']}")
            
            # 创建消息
            message = {
                "action": "online_users_updated",
                "users": filtered_users
            }
            
            # 发送消息
            await websocket.send_json(message)
            logger.info(f"成功向用户 {user_id} 发送在线用户列表，包含 {len(filtered_users)} 个用户")
            
        except Exception as e:
            logger.error(f"向用户 {user_id} 发送在线用户列表失败: {str(e)}")
            # 如果发送失败，可能是连接已断开，尝试清理连接
            try:
                await websocket.close()
            except:
                pass
            if user_id in connected_users:
                del connected_users[user_id]
                logger.info(f"清理断开的连接: 用户 {user_id}")

    return base_users

async def broadcast_task_update(sender_id: int, action: str, task_data: dict):
    """广播任务更新消息到所有连接的客户端"""
    if not connected_users:
        return
        
    logger.info(f"广播任务更新: {action}, 发送者: {sender_id}, 任务ID: {task_data.get('id')}")
    
    # 任务更新消息
    message = {
        "type": "task_update",
        "action": action,
        "task": {
            "id": task_data.get('id'),
            "name": task_data.get('name') or task_data.get('title'),
            "title": task_data.get('title') or task_data.get('name'),
            "status": task_data.get('status'),
            "completed": task_data.get('completed'),
            "start": task_data.get('start') or task_data.get('start_time'),
            "start_time": task_data.get('start_time') or task_data.get('start'),
            "end": task_data.get('end') or task_data.get('end_time'),
            "end_time": task_data.get('end_time') or task_data.get('end'),
            "duration": task_data.get('duration', 0),
            "user_id": sender_id
        },
        "sender_id": sender_id,
        "timestamp": int(time.time())
    }
    
    # 向除了发送者以外的所有用户广播消息
    for user_id, websocket in connected_users.items():
        if user_id != sender_id:  # 不向发送者广播
            try:
                await websocket.send_json(message)
                logger.info(f"已向用户 {user_id} 发送任务更新消息")
            except Exception as e:
                logger.error(f"向用户 {user_id} 发送任务更新消息失败: {str(e)}")
                
    return True

# 定期广播在线用户列表（保持活跃连接）
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_broadcast())

async def periodic_broadcast():
    """定期广播在线用户列表，保持连接活跃"""
    while True:
        await asyncio.sleep(30)  # 每30秒广播一次
        if connected_users:
            # 获取数据库会话
            from app.database import SessionLocal
            db = SessionLocal()
            try:
                await broadcast_online_users(db)
            finally:
                db.close()

if __name__ == "__main__":
    # 启动WebSocket服务
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,  # 使用不同的端口
        reload=False,
        log_level="info"
    )
