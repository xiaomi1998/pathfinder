# Pathfinder 项目打包指南

## 概述

`package-for-deployment.sh` 是一个智能的项目打包脚本，专为 Pathfinder 项目设计。它提供了多种打包模式，自动排除不需要的文件，并进行完整性验证。

## 快速开始

```bash
# 基本使用（完整模式）
./package-for-deployment.sh

# 最小化打包
./package-for-deployment.sh --mode minimal

# Docker 部署打包
./package-for-deployment.sh --mode docker --output ./docker-packages
```

## 功能特性

### 1. 多种打包模式

#### Minimal 模式 (`--mode minimal`)
- **用途**: 仅用于代码审查或快速部署
- **包含**: 核心源码、基本配置文件
- **排除**: 文档、测试文件、示例代码、开发工具配置
- **典型大小**: 最小（约 10-30MB）

```bash
./package-for-deployment.sh --mode minimal
```

#### Full 模式 (`--mode full`) - 默认
- **用途**: 完整项目交付或归档
- **包含**: 所有源码、文档、脚本、配置
- **排除**: 仅基本的临时文件和缓存
- **典型大小**: 中等（约 50-100MB）

```bash
./package-for-deployment.sh --mode full
```

#### Docker 模式 (`--mode docker`)
- **用途**: Docker 容器构建
- **包含**: 源码、Dockerfile、构建脚本、必要配置
- **排除**: 文档（除关键部署文档）、测试文件
- **典型大小**: 适中（约 20-60MB）

```bash
./package-for-deployment.sh --mode docker
```

### 2. 自动文件排除

脚本会智能排除以下文件和目录：

#### 基础排除（所有模式）
- `node_modules/` - Node.js 依赖包
- `.git/` - Git 版本控制文件
- `*.log` - 日志文件
- `logs/`, `tmp/` - 临时和日志目录
- `data/postgres/`, `data/redis/` - 数据库数据文件
- `.cache/`, `.parcel-cache/` - 构建缓存
- `.DS_Store`, `Thumbs.db` - 系统文件
- `.env.local`, `.env.*.local` - 本地环境变量

#### 开发工具排除
- `.vscode/`, `.idea/` - IDE 配置
- `coverage/` - 测试覆盖率报告
- `*.swp`, `*.swo` - 编辑器临时文件

### 3. 文件完整性验证

脚本会自动验证打包后的文件完整性：

- 检查必需的配置文件（package.json、docker-compose.yml等）
- 验证前端核心文件（main.ts、App.vue等）
- 验证后端核心文件（app.ts、schema.prisma等）
- 统计文件数量和目录结构

### 4. 配置文件验证

自动检查关键配置文件的语法：
- JSON 文件格式验证
- YAML 文件格式验证（如果安装了 yq）
- 数据库配置验证

## 命令行选项

### 基本选项

| 选项 | 简写 | 默认值 | 说明 |
|------|------|---------|------|
| `--mode` | `-m` | `full` | 打包模式：minimal/full/docker |
| `--output` | `-o` | `./dist` | 输出目录路径 |
| `--name` | `-n` | `pathfinder` | 项目名称（影响文件命名） |
| `--help` | `-h` | - | 显示帮助信息 |

### 控制选项

| 选项 | 默认行为 | 说明 |
|------|----------|------|
| `--no-clean` | 清理临时文件 | 保留临时文件用于调试 |
| `--no-verify` | 验证完整性 | 跳过文件完整性检查 |
| `--no-config-check` | 检查配置 | 跳过配置文件格式验证 |
| `--no-size-compare` | 显示大小对比 | 不显示压缩前后大小对比 |

## 使用示例

### 1. 开发环境快速打包
```bash
# 最小化打包，用于快速传输
./package-for-deployment.sh -m minimal -o ./quick-packages
```

### 2. 生产环境部署
```bash
# 完整打包，包含所有必要文件
./package-for-deployment.sh --mode full --output /var/packages
```

### 3. Docker 容器构建
```bash
# Docker 模式，优化容器大小
./package-for-deployment.sh --mode docker --no-size-compare
```

### 4. 调试模式
```bash
# 保留临时文件，跳过验证，用于问题排查
./package-for-deployment.sh --no-clean --no-verify --no-config-check
```

## 输出文件

### 文件命名格式
```
{项目名}_{模式}_{时间戳}.tar.gz
```

示例：
- `pathfinder_full_20231201_143022.tar.gz`
- `pathfinder_minimal_20231201_143156.tar.gz`
- `pathfinder_docker_20231201_143301.tar.gz`

### 附加文件
- `*.sha256` - SHA256 校验和文件
- `PACKAGE_INFO.txt` - 包信息文件（包含在压缩包内）

## 故障排除

### 常见问题

#### 1. 权限错误
```bash
chmod +x package-for-deployment.sh
```

#### 2. 配置文件格式错误
脚本会自动检测并报告配置文件错误：
```
[ERROR] 发现无效的配置文件:
  - frontend/package.json
```

#### 3. 缺少必需文件
脚本会验证关键文件是否存在：
```
[ERROR] 打包验证失败，缺少必需文件:
  - backend/src/app.ts
```

#### 4. 磁盘空间不足
检查输出目录的磁盘空间：
```bash
df -h ./dist
```

### 调试技巧

#### 1. 保留临时文件进行检查
```bash
./package-for-deployment.sh --no-clean
# 检查临时目录内容
ls -la ./dist/temp_*/
```

#### 2. 跳过验证加快打包
```bash
./package-for-deployment.sh --no-verify --no-config-check
```

#### 3. 查看详细排除规则
```bash
# 修改脚本中的 get_exclude_patterns 函数
# 或查看生成的排除文件
cat ./dist/temp_*/exclude_patterns.txt
```

## 高级配置

### 自定义排除规则

修改脚本中的 `get_exclude_patterns` 函数来添加项目特定的排除规则：

```bash
# 在相应模式的数组中添加新规则
local minimal_excludes=(
    "${base_excludes[@]}"
    "custom-temp-dir"
    "*.custom-ext"
)
```

### 环境变量支持

可以通过环境变量设置默认值：

```bash
export PATHFINDER_PACKAGE_MODE=docker
export PATHFINDER_OUTPUT_DIR=/custom/output
./package-for-deployment.sh
```

### 集成到 CI/CD

在 CI/CD 管道中使用：

```yaml
# GitHub Actions 示例
- name: Package for deployment
  run: |
    ./package-for-deployment.sh --mode docker --output ./artifacts
    
- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    name: pathfinder-package
    path: ./artifacts/*.tar.gz
```

## 性能优化

### 大型项目优化
- 使用 `--no-size-compare` 跳过大小计算
- 使用 `minimal` 模式减少文件数量
- 定期清理 `dist` 目录避免磁盘空间问题

### 网络传输优化
- 优先使用 `minimal` 或 `docker` 模式
- 考虑进一步压缩：`gzip -9` 或 `xz`
- 使用增量传输工具如 `rsync`

## 最佳实践

1. **版本控制**: 为重要版本创建标记化的包
2. **自动化**: 集成到 CI/CD 流程中
3. **验证**: 始终启用完整性检查
4. **文档**: 在 `PACKAGE_INFO.txt` 中记录版本信息
5. **清理**: 定期清理旧的打包文件
6. **测试**: 在不同环境中测试解压和部署

## 支持与反馈

如果遇到问题或有改进建议，请：
1. 检查脚本输出的错误信息
2. 使用调试选项获取更多信息
3. 查看生成的 `PACKAGE_INFO.txt` 文件
4. 记录具体的错误场景和环境信息