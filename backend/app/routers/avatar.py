# backend/app/routers/avatar.py
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
import httpx
from typing import Optional
from urllib.parse import urlencode
import base64

router = APIRouter()

@router.get("/generate")
async def generate_avatar(
    style: str,
    seed: str,
    backgroundColor: Optional[str] = None,
    chars: Optional[str] = None,
):
    """
    从DiceBear生成头像
    
    - style: 头像风格 (例如: "pixel-art", "lorelei", "micah")
    - seed: 用于生成头像的种子
    - backgroundColor: 可选的背景色 (不含#号)
    - chars: 对于'initials'风格，需要显示的字符
    """
    try:
        # 构建API参数
        params = {"seed": seed}
        
        # 添加可选参数
        if backgroundColor:
            params["backgroundColor"] = backgroundColor
        
        if chars and style == "initials":
            params["chars"] = chars
        
        # 构建完整的DiceBear URL
        dicebear_url = f"https://api.dicebear.com/7.x/{style}/svg?{urlencode(params)}"
        
        # 获取SVG数据
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(dicebear_url)
            if response.status_code == 200:
                svg_content = response.text
                # 转换为data URL
                base64_content = base64.b64encode(svg_content.encode('utf-8')).decode('utf-8')
                avatar_data_url = f"data:image/svg+xml;base64,{base64_content}"
                return {"avatar": avatar_data_url}
            else:
                raise Exception(f"DiceBear API返回错误: {response.text}")
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"生成头像时发生错误: {str(e)}"
        ) 