#!/bin/bash
# Backend service health check for Docker

set -e

# 检查应用端口是否响应
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "Backend health check passed"
    exit 0
else
    echo "Backend health check failed"
    exit 1
fi