#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
附件元数据提取服务
提供REST API接口，用于提取附件的额外元数据信息，包括：
1. 飞书文档的最后更新时间和更新人
2. 视频文件的时长信息
3. 其他扩展元数据
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import tempfile
import subprocess
import json
import mimetypes
from datetime import datetime
from urllib.parse import urlparse, parse_qs
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 飞书API配置
FEISHU_APP_ID = os.getenv("FEISHU_APP_ID", "")
FEISHU_APP_SECRET = os.getenv("FEISHU_APP_SECRET", "")
FEISHU_API_BASE = "https://open.feishu.cn"


class FeishuAPI:
    """飞书API客户端"""

    def __init__(self, app_id, app_secret):
        self.app_id = app_id
        self.app_secret = app_secret
        self.access_token = None

    def get_tenant_access_token(self):
        """获取租户访问令牌"""
        try:
            url = f"{FEISHU_API_BASE}/open-apis/auth/v3/tenant_access_token"
            headers = {"Content-Type": "application/json; charset=utf-8"}
            data = {"app_id": self.app_id, "app_secret": self.app_secret}

            response = requests.post(url, headers=headers, json=data, timeout=10)
            result = response.json()

            if result.get("code") == 0:
                self.access_token = result["tenant_access_token"]
                return self.access_token
            else:
                logger.error(f"获取访问令牌失败: {result}")
                return None
        except Exception as e:
            logger.error(f"获取访问令牌异常: {e}")
            return None

    def get_file_metadata(self, file_token, file_type="file"):
        """获取文件元数据"""
        if not self.access_token:
            if not self.get_tenant_access_token():
                return None

        try:
            url = f"{FEISHU_API_BASE}/open-apis/drive/v1/metas/batch_query"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json; charset=utf-8",
            }
            data = {
                "request_docs": [{"doc_token": file_token, "doc_type": file_type}],
                "with_url": True,
            }

            response = requests.post(url, headers=headers, json=data, timeout=10)
            result = response.json()

            if result.get("code") == 0 and result.get("data", {}).get("metas"):
                meta = result["data"]["metas"][0]
                return {
                    "title": meta.get("title", ""),
                    "owner_id": meta.get("owner_id", ""),
                    "create_time": meta.get("create_time", ""),
                    "latest_modify_user": meta.get("latest_modify_user", ""),
                    "latest_modify_time": meta.get("latest_modify_time", ""),
                    "url": meta.get("url", ""),
                }
            else:
                logger.error(f"获取文件元数据失败: {result}")
                return None
        except Exception as e:
            logger.error(f"获取文件元数据异常: {e}")
            return None


class VideoMetadataExtractor:
    """视频元数据提取器"""

    @staticmethod
    def extract_video_duration(video_url):
        """提取视频时长"""
        try:
            # 下载视频文件头部
            response = requests.get(video_url, stream=True, timeout=30)
            if response.status_code != 200:
                return None

            # 创建临时文件
            with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as temp_file:
                # 只下载前几MB用于元数据提取
                downloaded = 0
                max_download = 5 * 1024 * 1024  # 5MB

                for chunk in response.iter_content(chunk_size=8192):
                    if downloaded >= max_download:
                        break
                    temp_file.write(chunk)
                    downloaded += len(chunk)

                temp_file_path = temp_file.name

            try:
                # 使用ffprobe提取元数据
                result = VideoMetadataExtractor.get_video_info_with_ffprobe(
                    temp_file_path
                )
                return result
            finally:
                # 清理临时文件
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)

        except Exception as e:
            logger.error(f"提取视频时长异常: {e}")
            return None

    @staticmethod
    def get_video_info_with_ffprobe(file_path):
        """使用ffprobe获取视频信息"""
        try:
            cmd = [
                "ffprobe",
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                file_path,
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

            if result.returncode == 0:
                data = json.loads(result.stdout)

                # 提取视频流信息
                video_streams = [
                    s for s in data.get("streams", []) if s.get("codec_type") == "video"
                ]
                if video_streams:
                    video_stream = video_streams[0]
                    duration = float(data.get("format", {}).get("duration", 0))

                    return {
                        "duration_seconds": duration,
                        "duration_formatted": VideoMetadataExtractor.format_duration(
                            duration
                        ),
                        "width": video_stream.get("width"),
                        "height": video_stream.get("height"),
                        "codec": video_stream.get("codec_name"),
                        "fps": (
                            eval(video_stream.get("r_frame_rate", "0/1"))
                            if video_stream.get("r_frame_rate")
                            else None
                        ),
                    }

            return None

        except subprocess.TimeoutExpired:
            logger.error("ffprobe执行超时")
            return None
        except Exception as e:
            logger.error(f"ffprobe执行异常: {e}")
            return None

    @staticmethod
    def format_duration(seconds):
        """格式化时长"""
        if not seconds:
            return "0:00"

        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)

        if hours > 0:
            return f"{hours}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes}:{secs:02d}"


def extract_feishu_token_from_url(url):
    """从飞书URL中提取token"""
    try:
        parsed = urlparse(url)
        path_parts = parsed.path.strip("/").split("/")

        # 不同类型的飞书文档URL格式
        if "docs" in path_parts:
            return path_parts[-1], "doc"
        elif "sheets" in path_parts:
            return path_parts[-1], "sheet"
        elif "base" in path_parts:
            return path_parts[-1], "bitable"
        elif "wiki" in path_parts:
            return path_parts[-1], "wiki"
        elif "file" in path_parts:
            return path_parts[-1], "file"

        return None, None
    except Exception as e:
        logger.error(f"解析飞书URL异常: {e}")
        return None, None


def is_video_file(mime_type, filename):
    """判断是否为视频文件"""
    if mime_type and mime_type.startswith("video/"):
        return True

    video_extensions = {".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv", ".m4v"}
    if filename:
        ext = os.path.splitext(filename.lower())[1]
        return ext in video_extensions

    return False


@app.route("/health", methods=["GET"])
def health_check():
    """健康检查接口"""
    return jsonify(
        {
            "status": "ok",
            "service": "attachment-metadata-service",
            "timestamp": datetime.now().isoformat(),
        }
    )


@app.route("/extract_metadata", methods=["POST"])
def extract_metadata():
    """提取附件元数据的主接口"""
    try:
        data = request.get_json()

        if not data or "attachments" not in data:
            return jsonify({"error": "Missing attachments data", "code": 400}), 400

        attachments = data["attachments"]
        if not isinstance(attachments, list):
            attachments = [attachments]

        results = []

        for attachment in attachments:
            result = {
                "name": attachment.get("name", ""),
                "size": attachment.get("size", 0),
                "type": attachment.get("type", ""),
                "tmp_url": attachment.get("tmp_url", ""),
                "extra_metadata": {},
            }

            # 尝试提取飞书文档元数据
            if attachment.get("tmp_url"):
                feishu_token, file_type = extract_feishu_token_from_url(
                    attachment["tmp_url"]
                )
                if feishu_token and FEISHU_APP_ID and FEISHU_APP_SECRET:
                    feishu_api = FeishuAPI(FEISHU_APP_ID, FEISHU_APP_SECRET)
                    feishu_meta = feishu_api.get_file_metadata(feishu_token, file_type)
                    if feishu_meta:
                        result["extra_metadata"]["feishu"] = feishu_meta

            # 尝试提取视频元数据
            if is_video_file(attachment.get("type"), attachment.get("name")):
                if attachment.get("tmp_url"):
                    video_meta = VideoMetadataExtractor.extract_video_duration(
                        attachment["tmp_url"]
                    )
                    if video_meta:
                        result["extra_metadata"]["video"] = video_meta

            results.append(result)

        return jsonify(
            {"success": True, "data": results, "timestamp": datetime.now().isoformat()}
        )

    except Exception as e:
        logger.error(f"提取元数据异常: {e}")
        return jsonify({"error": str(e), "code": 500}), 500


@app.route("/extract_feishu_metadata", methods=["POST"])
def extract_feishu_metadata():
    """专门提取飞书文档元数据的接口"""
    try:
        data = request.get_json()

        if not data or "url" not in data:
            return jsonify({"error": "Missing url parameter", "code": 400}), 400

        url = data["url"]
        feishu_token, file_type = extract_feishu_token_from_url(url)

        if not feishu_token:
            return jsonify({"error": "Invalid feishu URL", "code": 400}), 400

        if not FEISHU_APP_ID or not FEISHU_APP_SECRET:
            return (
                jsonify(
                    {"error": "Feishu API credentials not configured", "code": 500}
                ),
                500,
            )

        feishu_api = FeishuAPI(FEISHU_APP_ID, FEISHU_APP_SECRET)
        metadata = feishu_api.get_file_metadata(feishu_token, file_type)

        if metadata:
            return jsonify(
                {
                    "success": True,
                    "data": metadata,
                    "timestamp": datetime.now().isoformat(),
                }
            )
        else:
            return (
                jsonify({"error": "Failed to fetch feishu metadata", "code": 404}),
                404,
            )

    except Exception as e:
        logger.error(f"提取飞书元数据异常: {e}")
        return jsonify({"error": str(e), "code": 500}), 500


@app.route("/extract_video_metadata", methods=["POST"])
def extract_video_metadata():
    """专门提取视频元数据的接口"""
    try:
        data = request.get_json()

        if not data or "url" not in data:
            return jsonify({"error": "Missing url parameter", "code": 400}), 400

        url = data["url"]
        metadata = VideoMetadataExtractor.extract_video_duration(url)

        if metadata:
            return jsonify(
                {
                    "success": True,
                    "data": metadata,
                    "timestamp": datetime.now().isoformat(),
                }
            )
        else:
            return (
                jsonify({"error": "Failed to extract video metadata", "code": 404}),
                404,
            )

    except Exception as e:
        logger.error(f"提取视频元数据异常: {e}")
        return jsonify({"error": str(e), "code": 500}), 500


if __name__ == "__main__":
    # 检查依赖
    required_env_vars = ["FEISHU_APP_ID", "FEISHU_APP_SECRET"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]

    if missing_vars:
        logger.warning(f"缺少环境变量: {missing_vars}，飞书API功能将不可用")

    # 检查ffprobe是否可用
    try:
        subprocess.run(["ffprobe", "-version"], capture_output=True, timeout=5)
        logger.info("ffprobe 可用，视频元数据提取功能已启用")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        logger.warning("ffprobe 不可用，视频元数据提取功能将不可用")

    # 启动服务
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "false").lower() == "true"

    logger.info(f"启动附件元数据服务，端口: {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
