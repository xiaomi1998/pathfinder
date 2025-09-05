#!/bin/bash

# Pathfinder 安全加固脚本
# 涵盖系统层、应用层、网络层的安全加固措施

set -euo pipefail

# ==========================================
# 配置变量
# ==========================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/pathfinder/security-hardening.log"
BACKUP_DIR="/var/backups/security-configs"

# 创建必要目录
mkdir -p "$(dirname "$LOG_FILE")" "$BACKUP_DIR"

# ==========================================
# 工具函数
# ==========================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR" "$1"
    exit 1
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error_exit "此脚本需要 root 权限运行"
    fi
}

backup_config() {
    local config_file=$1
    if [[ -f "$config_file" ]]; then
        cp "$config_file" "$BACKUP_DIR/$(basename "$config_file").backup.$(date +%s)"
        log "INFO" "已备份配置文件: $config_file"
    fi
}

# ==========================================
# 系统层安全加固
# ==========================================

# 更新系统和安全补丁
update_system() {
    log "INFO" "开始更新系统和安全补丁"
    
    if command -v apt >/dev/null; then
        apt update && apt upgrade -y
        apt install -y fail2ban ufw unattended-upgrades
    elif command -v yum >/dev/null; then
        yum update -y
        yum install -y fail2ban firewalld
    fi
    
    log "INFO" "系统更新完成"
}

# 配置自动安全更新
configure_auto_updates() {
    log "INFO" "配置自动安全更新"
    
    if command -v apt >/dev/null; then
        # Ubuntu/Debian 自动更新配置
        cat > /etc/apt/apt.conf.d/50unattended-upgrades <<EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESM:\${distro_codename}";
};
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "admin@pathfinder.com";
EOF
        
        cat > /etc/apt/apt.conf.d/20auto-upgrades <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
    fi
    
    log "INFO" "自动安全更新配置完成"
}

# SSH 安全加固
harden_ssh() {
    log "INFO" "开始 SSH 安全加固"
    
    backup_config "/etc/ssh/sshd_config"
    
    # SSH 安全配置
    cat > /etc/ssh/sshd_config.d/pathfinder-hardening.conf <<EOF
# Pathfinder SSH 安全配置

# 禁用 root 直接登录
PermitRootLogin no

# 禁用密码认证，仅允许密钥认证
PasswordAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey

# 禁用空密码
PermitEmptyPasswords no

# 限制登录尝试
MaxAuthTries 3
MaxSessions 2

# 协议和加密
Protocol 2
Ciphers aes256-gcm@openssh.com,chacha20-poly1305@openssh.com,aes256-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com
KexAlgorithms diffie-hellman-group16-sha512,diffie-hellman-group18-sha512,ecdh-sha2-nistp521

# 其他安全设置
X11Forwarding no
AllowTcpForwarding no
GatewayPorts no
PermitTunnel no
ClientAliveInterval 300
ClientAliveCountMax 2

# 限制用户和组
AllowUsers pathfinder-admin pathfinder-deploy
DenyUsers root
EOF
    
    # 重启 SSH 服务
    systemctl restart sshd
    
    log "INFO" "SSH 安全加固完成"
}

# 配置防火墙
configure_firewall() {
    log "INFO" "配置防火墙规则"
    
    if command -v ufw >/dev/null; then
        # Ubuntu/Debian UFW 配置
        ufw --force reset
        ufw default deny incoming
        ufw default allow outgoing
        
        # 允许 SSH (限制 IP)
        ufw allow from 192.168.1.0/24 to any port 22
        ufw allow from 10.0.0.0/8 to any port 22
        
        # 允许 HTTP/HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # 允许数据库 (仅内网)
        ufw allow from 172.20.0.0/16 to any port 5432
        
        # 启用防火墙
        ufw --force enable
        
    elif command -v firewall-cmd >/dev/null; then
        # CentOS/RHEL FirewallD 配置
        systemctl enable firewalld
        systemctl start firewalld
        
        firewall-cmd --permanent --remove-service=ssh
        firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" port protocol="tcp" port="22" accept'
        firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="10.0.0.0/8" port protocol="tcp" port="22" accept'
        
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        
        firewall-cmd --reload
    fi
    
    log "INFO" "防火墙配置完成"
}

# 配置 Fail2Ban
configure_fail2ban() {
    log "INFO" "配置 Fail2Ban"
    
    backup_config "/etc/fail2ban/jail.local"
    
    cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
# 全局设置
ignoreip = 127.0.0.1/8 192.168.1.0/24 10.0.0.0/8
bantime = 3600
findtime = 600
maxretry = 3
backend = auto
usedns = warn
logencoding = auto
enabled = false
mode = normal
filter = %(__name__)s[mode=%(mode)s]
destemail = admin@pathfinder.com
sender = fail2ban@pathfinder.com
mta = sendmail
protocol = tcp
chain = <known/chain>
port = 0:65535
fail2ban_agent = Fail2Ban/%(fail2ban_version)s

# SSH 保护
[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
maxretry = 3
bantime = 1800

# Nginx 保护
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 10
bantime = 600

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 3600

# PostgreSQL 保护
[postgresql]
enabled = true
filter = postgresql
logpath = /var/log/postgresql/postgresql-*.log
maxretry = 5
bantime = 3600

# 应用程序保护
[pathfinder-auth]
enabled = true
filter = pathfinder-auth
logpath = /app/logs/auth.log
maxretry = 5
bantime = 1800
EOF

    # 创建自定义过滤器
    cat > /etc/fail2ban/filter.d/pathfinder-auth.conf <<EOF
[Definition]
failregex = ^.*\[ERROR\].*Authentication failed for user.*from <HOST>.*$
            ^.*\[WARN\].*Too many login attempts from <HOST>.*$
            ^.*\[ERROR\].*Invalid token from <HOST>.*$
ignoreregex =
EOF
    
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    log "INFO" "Fail2Ban 配置完成"
}

# ==========================================
# 应用层安全加固
# ==========================================

# 生成安全的配置文件
generate_security_configs() {
    log "INFO" "生成应用安全配置"
    
    # JWT 密钥
    JWT_SECRET=$(openssl rand -base64 64)
    
    # 数据库密码
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    # 加密密钥
    ENCRYPTION_KEY=$(openssl rand -base64 32)
    
    # 会话密钥
    SESSION_SECRET=$(openssl rand -base64 32)
    
    # 创建安全的 .env 文件
    cat > /opt/pathfinder/.env.security <<EOF
# Pathfinder 安全配置
# 生成时间: $(date)

# 数据库配置
DATABASE_URL="postgresql://pathfinder_app:${POSTGRES_PASSWORD}@localhost:5432/pathfinder_db"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"

# Redis 配置
REDIS_URL="redis://:${REDIS_PASSWORD}@localhost:6379"
REDIS_PASSWORD="${REDIS_PASSWORD}"

# JWT 配置
JWT_SECRET="${JWT_SECRET}"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# 加密配置
ENCRYPTION_KEY="${ENCRYPTION_KEY}"
SESSION_SECRET="${SESSION_SECRET}"

# 安全配置
CORS_ORIGIN="https://pathfinder.com"
SECURE_COOKIES="true"
RATE_LIMIT_WINDOW_MS="900000"  # 15分钟
RATE_LIMIT_MAX="100"           # 每15分钟100次请求
BCRYPT_ROUNDS="12"

# 日志配置
LOG_LEVEL="info"
SECURITY_LOG_LEVEL="warn"

# 外部服务配置
AI_API_KEY="${AI_API_KEY}"
SMTP_HOST="${SMTP_HOST}"
SMTP_USER="${SMTP_USER}"
SMTP_PASS="${SMTP_PASS}"
EOF
    
    # 设置文件权限
    chmod 600 /opt/pathfinder/.env.security
    chown pathfinder:pathfinder /opt/pathfinder/.env.security
    
    log "INFO" "安全配置文件生成完成"
}

# 配置 HTTPS 和 SSL
configure_ssl() {
    log "INFO" "配置 SSL/TLS"
    
    # 生成 DH 参数
    if [[ ! -f /etc/nginx/ssl/dhparam.pem ]]; then
        mkdir -p /etc/nginx/ssl
        openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
    fi
    
    # SSL 配置
    cat > /etc/nginx/ssl/ssl-params.conf <<EOF
# SSL 安全配置
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_dhparam /etc/nginx/ssl/dhparam.pem;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
ssl_ecdh_curve secp384r1;
ssl_session_timeout  10m;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# 安全头
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
EOF
    
    log "INFO" "SSL/TLS 配置完成"
}

# ==========================================
# 数据库安全加固
# ==========================================

# PostgreSQL 安全配置
harden_postgresql() {
    log "INFO" "PostgreSQL 安全加固"
    
    backup_config "/etc/postgresql/14/main/postgresql.conf"
    backup_config "/etc/postgresql/14/main/pg_hba.conf"
    
    # 安全配置
    cat >> /etc/postgresql/14/main/postgresql.conf <<EOF

# Pathfinder 安全配置
# 连接和认证
ssl = on
ssl_cert_file = '/etc/ssl/certs/postgresql.crt'
ssl_key_file = '/etc/ssl/private/postgresql.key'
ssl_ca_file = '/etc/ssl/certs/ca-certificates.crt'

# 日志配置
log_connections = on
log_disconnections = on
log_checkpoints = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0
log_error_verbosity = default
log_min_duration_statement = 1000
log_statement = 'ddl'
log_hostname = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# 安全参数
password_encryption = scram-sha-256
shared_preload_libraries = 'pg_stat_statements'
EOF
    
    # 访问控制配置
    cat > /etc/postgresql/14/main/pg_hba.conf <<EOF
# Pathfinder PostgreSQL 访问控制
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# 本地连接
local   all             postgres                                peer
local   all             pathfinder_app                         scram-sha-256

# IPv4 本地连接
host    all             postgres        127.0.0.1/32            reject
host    pathfinder_db   pathfinder_app  127.0.0.1/32            scram-sha-256
host    pathfinder_db   pathfinder_app  172.20.0.0/16           scram-sha-256

# IPv6 本地连接
host    all             all             ::1/128                 reject

# 复制连接
host    replication     postgres        127.0.0.1/32            scram-sha-256
EOF
    
    # 重启 PostgreSQL
    systemctl restart postgresql
    
    log "INFO" "PostgreSQL 安全配置完成"
}

# ==========================================
# 容器安全加固
# ==========================================

# Docker 安全配置
harden_docker() {
    log "INFO" "Docker 安全加固"
    
    backup_config "/etc/docker/daemon.json"
    
    # Docker daemon 安全配置
    cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp-profile.json",
  "icc": false,
  "disable-legacy-registry": true
}
EOF
    
    # Docker Compose 安全覆盖
    cat > /opt/pathfinder/docker-compose.security.yml <<EOF
version: '3.8'

services:
  backend:
    security_opt:
      - no-new-privileges:true
      - seccomp:/etc/docker/seccomp-profile.json
    read_only: true
    tmpfs:
      - /tmp:exec,nosuid,nodev,size=100m
      - /var/tmp:exec,nosuid,nodev,size=100m
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    user: "1001:1001"
    
  frontend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:exec,nosuid,nodev,size=100m
      - /var/cache/nginx:exec,nosuid,nodev,size=100m
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
      - CHOWN
      - SETUID
      - SETGID
    user: "101:101"
    
  postgres:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - SETUID
      - SETGID
      - DAC_OVERRIDE
    user: "999:999"
    
  redis:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:exec,nosuid,nodev,size=100m
    cap_drop:
      - ALL
    user: "999:999"
EOF
    
    # 创建 seccomp 配置文件
    curl -o /etc/docker/seccomp-profile.json \
        https://raw.githubusercontent.com/docker/engine/master/profiles/seccomp/default.json
    
    systemctl restart docker
    
    log "INFO" "Docker 安全配置完成"
}

# ==========================================
# 安全监控和审计
# ==========================================

# 配置安全审计
configure_security_audit() {
    log "INFO" "配置安全审计"
    
    # 安装 auditd
    if command -v apt >/dev/null; then
        apt install -y auditd audispd-plugins
    elif command -v yum >/dev/null; then
        yum install -y audit
    fi
    
    # 审计规则
    cat > /etc/audit/rules.d/pathfinder.rules <<EOF
# Pathfinder 安全审计规则

# 删除规则
-D

# 缓冲设置
-b 8192

# 系统调用失败审计
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time-change
-a always,exit -F arch=b32 -S adjtimex -S settimeofday -S stime -k time-change

# 网络配置变更
-a always,exit -F arch=b64 -S sethostname -S setdomainname -k system-locale
-a always,exit -F arch=b32 -S sethostname -S setdomainname -k system-locale

# 文件访问审计
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k identity

# SSH 配置变更
-w /etc/ssh/sshd_config -p wa -k sshd

# PostgreSQL 审计
-w /etc/postgresql/ -p wa -k postgresql_config
-w /var/log/postgresql/ -p wa -k postgresql_logs

# Docker 审计
-w /etc/docker/daemon.json -p wa -k docker
-w /var/lib/docker -p wa -k docker

# 应用配置审计
-w /opt/pathfinder/ -p wa -k pathfinder_config

# 权限提升审计
-a always,exit -F arch=b64 -S chmod -S fchmod -S fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_mod
-a always,exit -F arch=b32 -S chmod -S fchmod -S fchmodat -F auid>=1000 -F auid!=4294967295 -k perm_mod
EOF
    
    # 启动审计服务
    systemctl enable auditd
    systemctl restart auditd
    
    log "INFO" "安全审计配置完成"
}

# ==========================================
# 安全检查和验证
# ==========================================

# 执行安全扫描
security_scan() {
    log "INFO" "执行安全扫描"
    
    # 端口扫描检查
    if command -v nmap >/dev/null; then
        nmap -sS -O localhost > /tmp/port_scan.txt 2>&1
        log "INFO" "端口扫描完成，结果保存到 /tmp/port_scan.txt"
    fi
    
    # 文件权限检查
    find /opt/pathfinder -type f -perm /o+w -exec ls -la {} \; > /tmp/world_writable_files.txt
    if [[ -s /tmp/world_writable_files.txt ]]; then
        log "WARN" "发现全局可写文件，详情见 /tmp/world_writable_files.txt"
    fi
    
    # SUID/SGID 文件检查
    find / -type f \( -perm -4000 -o -perm -2000 \) -exec ls -la {} \; > /tmp/suid_sgid_files.txt 2>/dev/null
    log "INFO" "SUID/SGID 文件列表保存到 /tmp/suid_sgid_files.txt"
    
    # 网络连接检查
    netstat -tuln > /tmp/network_connections.txt
    log "INFO" "网络连接状态保存到 /tmp/network_connections.txt"
    
    log "INFO" "安全扫描完成"
}

# 生成安全报告
generate_security_report() {
    log "INFO" "生成安全报告"
    
    local report_file="/tmp/pathfinder_security_report_$(date +%Y%m%d).txt"
    
    cat > "$report_file" <<EOF
Pathfinder 安全状态报告
生成时间: $(date)

==== 系统信息 ====
$(uname -a)
$(lsb_release -a 2>/dev/null || cat /etc/os-release | head -5)

==== 防火墙状态 ====
$(ufw status verbose 2>/dev/null || firewall-cmd --list-all 2>/dev/null || echo "防火墙状态检查失败")

==== SSH 配置 ====
$(sshd -T | grep -E "(permitrootlogin|passwordauthentication|pubkeyauthentication|maxauthtries)")

==== 失败登录尝试 ====
$(fail2ban-client status 2>/dev/null || echo "Fail2ban 未运行")

==== 运行的服务 ====
$(systemctl list-units --type=service --state=running | grep -E "(ssh|nginx|postgresql|docker|fail2ban)")

==== 安全更新 ====
$(apt list --upgradable 2>/dev/null | grep -i security || yum check-update --security 2>/dev/null || echo "无可用的安全更新信息")

==== Docker 容器状态 ====
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker 未运行")

EOF
    
    log "INFO" "安全报告生成完成: $report_file"
    
    # 发送邮件通知 (如果配置了)
    if command -v mail >/dev/null && [[ -n "${EMAIL_RECIPIENTS:-}" ]]; then
        mail -s "Pathfinder 安全报告 $(date +%Y-%m-%d)" "$EMAIL_RECIPIENTS" < "$report_file"
    fi
}

# ==========================================
# 主要入口函数
# ==========================================

show_help() {
    cat <<EOF
Pathfinder 安全加固脚本

用法: $0 [选项] <命令>

命令:
  all               执行完整的安全加固
  system            系统层安全加固
  application       应用层安全加固
  database          数据库安全加固
  container         容器安全加固
  scan              执行安全扫描
  report            生成安全报告
  
选项:
  -h, --help        显示此帮助信息
  -f, --force       强制执行所有操作
  
示例:
  $0 all            # 执行完整的安全加固
  $0 system         # 仅系统层加固
  $0 scan           # 执行安全扫描
  
EOF
}

main() {
    local command=""
    local force=false
    
    # 检查 root 权限
    check_root
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -f|--force)
                force=true
                shift
                ;;
            all|system|application|database|container|scan|report)
                command="$1"
                shift
                ;;
            *)
                echo "未知选项: $1" >&2
                show_help
                exit 1
                ;;
        esac
    done
    
    if [[ -z "$command" ]]; then
        echo "错误: 必须指定命令" >&2
        show_help
        exit 1
    fi
    
    log "INFO" "开始执行安全加固: $command"
    
    case $command in
        all)
            update_system
            configure_auto_updates
            harden_ssh
            configure_firewall
            configure_fail2ban
            generate_security_configs
            configure_ssl
            harden_postgresql
            harden_docker
            configure_security_audit
            security_scan
            generate_security_report
            ;;
        system)
            update_system
            configure_auto_updates
            harden_ssh
            configure_firewall
            configure_fail2ban
            ;;
        application)
            generate_security_configs
            configure_ssl
            ;;
        database)
            harden_postgresql
            ;;
        container)
            harden_docker
            ;;
        scan)
            security_scan
            ;;
        report)
            generate_security_report
            ;;
    esac
    
    log "INFO" "安全加固完成"
}

main "$@"