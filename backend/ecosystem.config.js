module.exports = {
  apps: [
    {
      name: 'pathfinder-backend',
      script: 'dist/app.js',
      
      // 集群模式配置
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: 'cluster',
      
      // 环境变量
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // 日志配置
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_file: 'logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 内存和重启配置
      max_memory_restart: '1G',
      node_args: ['--max-old-space-size=1024', '--optimize-for-size'],
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // 自动重启
      autorestart: true,
      watch: false,
      
      // 集群配置
      listen_timeout: 3000,
      kill_timeout: 5000,
      wait_ready: true,
      
      // 健康检查
      health_check_grace_period: 5000,
      
      // 性能监控
      pmx: true,
      
      // 优雅关闭
      shutdown_with_message: true,
      
      // 环境特定配置
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000
      }
    }
  ],
  
  // 部署配置（可选）
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server'],
      ref: 'origin/main',
      repo: 'git@github.com:pathfinder/backend.git',
      path: '/var/www/pathfinder-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};