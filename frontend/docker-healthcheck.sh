#!/bin/bash
# Frontend service health check for Docker

set -e

# 检查 Nginx 是否响应
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "Frontend health check passed"
    exit 0
else
    echo "Frontend health check failed"
    exit 1
fi