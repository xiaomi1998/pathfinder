# 🔄 Pathfinder 系统状态保存指南

## 🚀 快速开始

### 一键保存当前系统状态
```bash
./save-system-state.sh
```

## 📋 保存内容

这个脚本会完整保存：

### 1. 📦 代码快照
- **前端代码** - 完整的 Vue 3 应用
- **后端代码** - 完整的 Node.js API
- **排除文件** - node_modules, .git, dist, logs 等

### 2. 🗃️ 数据库状态
- **数据库导出** - 完整的 PostgreSQL 数据备份
- **Prisma Schema** - 数据模型定义
- **结构和数据** - 完整的表结构和数据内容

### 3. ⚙️ 配置文件
- **Docker配置** - docker-compose.yml 等
- **包管理文件** - package.json, package-lock.json
- **环境配置** - .env.example (不含敏感信息)
- **Nginx配置** - 反向代理设置

### 4. 📚 项目文档
- **所有Markdown文件** - README, API文档, 指南等
- **项目说明** - 完整的项目状态文档

### 5. 🖥️ 系统环境信息
- **软件版本** - Node.js, npm, Docker, PostgreSQL
- **Git状态** - 当前提交、未提交更改
- **依赖信息** - 前后端依赖列表
- **运行状态** - 端口占用、服务状态

### 6. 📋 详细状态文档
- **功能完成度** - 详细的功能状态清单
- **技术栈状态** - 完整的技术栈信息
- **数据模型** - 数据库模型状态
- **部署建议** - 生产部署指南

## 📁 输出结构

```
system-snapshots/
└── pathfinder_snapshot_YYYYMMDD_HHMMSS/
    ├── frontend/                 # 前端代码
    ├── backend/                  # 后端代码
    ├── database/                 # 数据库备份
    ├── configs/                  # 配置文件
    ├── docs/                     # 项目文档
    ├── logs/                     # 日志文件
    ├── system-info.txt           # 系统环境信息
    ├── runtime-status.txt        # 运行时状态
    ├── SYSTEM_STATE_XXX.md       # 详细状态文档
    └── restore.sh                # 恢复脚本
```

## 🔄 恢复系统状态

### 1. 进入快照目录
```bash
cd system-snapshots/pathfinder_snapshot_YYYYMMDD_HHMMSS/
```

### 2. 运行恢复脚本
```bash
./restore.sh
```

### 3. 手动恢复数据库 (如需要)
```bash
psql -h localhost -p 5432 -U pathfinder -d pathfinder < ./database/database_dump.sql
```

## 📊 快照管理

### 查看快照列表
```bash
cat system-snapshots/snapshot-index.txt
```

### 清理旧快照
```bash
# 删除7天前的快照 (示例)
find system-snapshots/ -name "pathfinder_snapshot_*" -mtime +7 -exec rm -rf {} \;
```

### 压缩快照 (节省空间)
```bash
cd system-snapshots/
tar -czf pathfinder_snapshot_YYYYMMDD_HHMMSS.tar.gz pathfinder_snapshot_YYYYMMDD_HHMMSS/
```

## 🎯 使用场景

### 开发阶段
- **功能节点保存** - 完成重要功能后保存状态
- **实验前备份** - 进行重大更改前保存当前状态
- **版本发布前** - 发布前保存稳定状态

### 部署阶段
- **生产部署前** - 保存完整的开发状态
- **环境迁移** - 在不同环境间迁移项目
- **故障恢复** - 快速回滚到已知稳定状态

### 协作开发
- **状态共享** - 与团队成员共享完整项目状态
- **环境同步** - 确保开发环境一致性
- **问题调试** - 保存问题状态便于分析

## ⚠️ 注意事项

1. **敏感信息** - 脚本会排除敏感的环境变量文件
2. **磁盘空间** - 每个快照可能占用几百MB空间
3. **数据库备份** - 需要数据库访问权限才能完整备份
4. **权限问题** - 确保脚本有读写项目文件的权限

## 🛠️ 自定义配置

### 修改备份排除规则
编辑 `save-system-state.sh` 中的 rsync 参数：
```bash
--exclude='node_modules' \
--exclude='.git' \
--exclude='your_custom_exclusion'
```

### 修改备份目录
修改脚本中的 `BACKUP_DIR` 变量：
```bash
BACKUP_DIR="./your_custom_backup_dir"
```

---

**快速执行**: `./save-system-state.sh`  
**文档位置**: `system-snapshots/latest/SYSTEM_STATE_XXX.md`  
**恢复方法**: `cd system-snapshots/snapshot_dir && ./restore.sh`