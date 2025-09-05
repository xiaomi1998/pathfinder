#!/bin/bash

# =================================================================
# Pathfinder 测试执行脚本
# 运行前后端测试套件，生成测试报告和覆盖率分析
# =================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 创建测试报告目录
setup_test_environment() {
    log_info "设置测试环境..."
    
    # 创建测试报告目录
    mkdir -p test-reports/{backend,frontend,coverage}
    mkdir -p logs/tests
    
    # 确保测试数据库运行
    docker-compose -f docker-compose.dev.yml up -d db redis >/dev/null 2>&1
    
    # 等待数据库启动
    sleep 3
    
    log_success "测试环境准备完成"
}

# 运行后端测试
run_backend_tests() {
    log_step "运行后端测试套件"
    
    cd backend
    
    # 检查测试配置
    if [ ! -f "jest.config.js" ] && [ ! -f "package.json" ]; then
        log_warning "未找到 Jest 配置，创建默认配置..."
        cat > jest.config.js << 'EOL'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/app.ts'
  ],
  coverageDirectory: '../test-reports/coverage/backend',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts']
};
EOL
        
        # 创建测试设置文件
        mkdir -p src/test
        cat > src/test/setup.ts << 'EOL'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://pathfinder:dev123@localhost:5432/pathfinder_test'
    }
  }
});

beforeAll(async () => {
  // 测试前的设置
});

afterAll(async () => {
  // 清理测试数据
  await prisma.$disconnect();
});
EOL
    fi
    
    # 安装测试依赖（如果需要）
    if ! npm ls jest >/dev/null 2>&1; then
        log_info "安装测试依赖..."
        npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
    fi
    
    # 运行测试
    log_info "运行单元测试..."
    
    # 如果存在测试文件，运行测试
    if find src -name "*.test.ts" -o -name "*.spec.ts" | grep -q .; then
        npm test -- --coverage --testResultsProcessor=jest-junit 2>&1 | tee ../logs/tests/backend-test.log
        local test_exit_code=${PIPESTATUS[0]}
        
        if [ $test_exit_code -eq 0 ]; then
            log_success "后端测试通过"
        else
            log_error "后端测试失败 (退出码: $test_exit_code)"
            return $test_exit_code
        fi
    else
        log_warning "未找到后端测试文件，创建示例测试..."
        
        # 创建示例测试文件
        mkdir -p src/test/integration
        cat > src/test/integration/api.test.ts << 'EOL'
import request from 'supertest';
import app from '../../app';

describe('API Health Check', () => {
  it('should return 200 for health endpoint', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'ok');
  });
});

describe('Authentication API', () => {
  it('should reject invalid login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      })
      .expect(401);
    
    expect(response.body).toHaveProperty('error');
  });
});
EOL
        
        # 创建服务测试
        mkdir -p src/test/unit
        cat > src/test/unit/funnel.test.ts << 'EOL'
import { FunnelService } from '../../services/FunnelService';

describe('FunnelService', () => {
  let funnelService: FunnelService;
  
  beforeEach(() => {
    funnelService = new FunnelService();
  });
  
  describe('calculateConversionRate', () => {
    it('should calculate conversion rate correctly', () => {
      const result = funnelService.calculateConversionRate(100, 25);
      expect(result).toBe(25);
    });
    
    it('should handle zero division', () => {
      const result = funnelService.calculateConversionRate(0, 0);
      expect(result).toBe(0);
    });
  });
  
  describe('findBottleneck', () => {
    it('should identify the step with lowest conversion', () => {
      const funnelData = [
        { name: 'Awareness', count: 1000, conversion: 100 },
        { name: 'Interest', count: 500, conversion: 50 },
        { name: 'Purchase', count: 100, conversion: 10 }
      ];
      
      const bottleneck = funnelService.findBottleneck(funnelData);
      expect(bottleneck.name).toBe('Purchase');
    });
  });
});
EOL
        
        log_info "运行示例测试..."
        npm test 2>&1 | tee ../logs/tests/backend-test.log
    fi
    
    cd ..
}

# 运行前端测试
run_frontend_tests() {
    log_step "运行前端测试套件"
    
    cd frontend
    
    # 检查测试配置
    if [ ! -f "vitest.config.ts" ] && [ ! -f "vite.config.ts" ]; then
        log_warning "创建 Vitest 配置..."
        cat > vitest.config.ts << 'EOL'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
EOL
    fi
    
    # 安装测试依赖（如果需要）
    if ! npm ls vitest >/dev/null 2>&1; then
        log_info "安装前端测试依赖..."
        npm install --save-dev vitest jsdom @vue/test-utils @testing-library/vue @testing-library/jest-dom
    fi
    
    # 创建测试设置文件
    mkdir -p src/test
    if [ ! -f "src/test/setup.ts" ]; then
        cat > src/test/setup.ts << 'EOL'
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
EOL
    fi
    
    # 运行测试
    log_info "运行前端测试..."
    
    # 如果存在测试文件，运行测试
    if find src -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.test.vue" | grep -q .; then
        npm run test:unit -- --coverage --reporter=verbose 2>&1 | tee ../logs/tests/frontend-test.log
        local test_exit_code=${PIPESTATUS[0]}
        
        if [ $test_exit_code -eq 0 ]; then
            log_success "前端测试通过"
        else
            log_error "前端测试失败 (退出码: $test_exit_code)"
            return $test_exit_code
        fi
    else
        log_warning "未找到前端测试文件，创建示例测试..."
        
        # 创建组件测试示例
        mkdir -p src/test/components
        cat > src/test/components/FunnelNode.test.ts << 'EOL'
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FunnelNode from '../../components/funnel/FunnelNode.vue'

describe('FunnelNode', () => {
  it('renders node with correct data', () => {
    const nodeData = {
      id: 'node-1',
      name: 'Test Node',
      value: 100,
      conversion: 25.5
    }
    
    const wrapper = mount(FunnelNode, {
      props: { node: nodeData }
    })
    
    expect(wrapper.text()).toContain('Test Node')
    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('25.5%')
  })
  
  it('emits edit event when clicked', async () => {
    const nodeData = {
      id: 'node-1',
      name: 'Test Node',
      value: 100
    }
    
    const wrapper = mount(FunnelNode, {
      props: { node: nodeData }
    })
    
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('edit')
  })
})
EOL
        
        # 创建工具函数测试
        mkdir -p src/test/utils
        cat > src/test/utils/funnel.test.ts << 'EOL'
import { describe, it, expect } from 'vitest'
import { calculateConversion, findBottleneck } from '../../utils/funnel'

describe('Funnel Utilities', () => {
  describe('calculateConversion', () => {
    it('should calculate conversion rate correctly', () => {
      expect(calculateConversion(100, 25)).toBe(25)
      expect(calculateConversion(200, 50)).toBe(25)
    })
    
    it('should handle edge cases', () => {
      expect(calculateConversion(0, 0)).toBe(0)
      expect(calculateConversion(100, 0)).toBe(0)
    })
  })
  
  describe('findBottleneck', () => {
    it('should identify lowest conversion step', () => {
      const steps = [
        { name: 'Step 1', value: 1000, conversion: 80 },
        { name: 'Step 2', value: 800, conversion: 60 },
        { name: 'Step 3', value: 480, conversion: 20 }
      ]
      
      const bottleneck = findBottleneck(steps)
      expect(bottleneck?.name).toBe('Step 3')
    })
  })
})
EOL
        
        # 添加测试脚本到 package.json（如果不存在）
        if ! grep -q '"test:unit"' package.json; then
            log_info "添加测试脚本到 package.json..."
            npm pkg set scripts.test:unit="vitest"
            npm pkg set scripts.test:coverage="vitest --coverage"
        fi
        
        log_info "运行示例测试..."
        npx vitest run 2>&1 | tee ../logs/tests/frontend-test.log
    fi
    
    cd ..
}

# 运行端到端测试
run_e2e_tests() {
    log_step "运行端到端测试"
    
    # 检查是否有 E2E 测试配置
    if [ -d "e2e" ] || [ -d "tests/e2e" ]; then
        log_info "运行 E2E 测试..."
        
        # 确保应用正在运行
        if ! curl -f -s http://localhost:3000 >/dev/null 2>&1; then
            log_warning "前端应用未运行，启动开发服务器..."
            ./dev.sh &
            DEV_PID=$!
            sleep 10
        fi
        
        # 运行 E2E 测试（假设使用 Playwright 或 Cypress）
        if command -v npx >/dev/null 2>&1; then
            if [ -f "playwright.config.ts" ]; then
                npx playwright test 2>&1 | tee logs/tests/e2e-test.log
            elif [ -f "cypress.config.ts" ]; then
                npx cypress run 2>&1 | tee logs/tests/e2e-test.log
            fi
        fi
        
        # 清理
        if [ -n "${DEV_PID:-}" ]; then
            kill $DEV_PID 2>/dev/null || true
        fi
    else
        log_info "未找到 E2E 测试配置，跳过..."
        
        # 创建简单的 API 端点测试
        log_info "运行 API 端点测试..."
        if [ -f "backend/scripts/test-api-endpoints.js" ]; then
            node backend/scripts/test-api-endpoints.js 2>&1 | tee logs/tests/api-test.log
        fi
    fi
}

# 生成测试报告
generate_test_report() {
    log_step "生成测试报告"
    
    local report_file="test-reports/test-summary.html"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Pathfinder 测试报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #007cba; }
        .success { border-color: #28a745; background: #f8f9fa; }
        .warning { border-color: #ffc107; background: #fff3cd; }
        .error { border-color: #dc3545; background: #f8d7da; }
        .stats { display: flex; gap: 20px; margin: 15px 0; }
        .stat-box { padding: 10px; background: white; border-radius: 5px; text-align: center; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Pathfinder 测试报告</h1>
        <p>生成时间: $timestamp</p>
    </div>
EOF
    
    # 后端测试结果
    if [ -f "logs/tests/backend-test.log" ]; then
        echo '<div class="section success">' >> "$report_file"
        echo '<h2>后端测试结果</h2>' >> "$report_file"
        echo '<pre>' >> "$report_file"
        tail -20 logs/tests/backend-test.log >> "$report_file"
        echo '</pre>' >> "$report_file"
        echo '</div>' >> "$report_file"
    fi
    
    # 前端测试结果
    if [ -f "logs/tests/frontend-test.log" ]; then
        echo '<div class="section success">' >> "$report_file"
        echo '<h2>前端测试结果</h2>' >> "$report_file"
        echo '<pre>' >> "$report_file"
        tail -20 logs/tests/frontend-test.log >> "$report_file"
        echo '</pre>' >> "$report_file"
        echo '</div>' >> "$report_file"
    fi
    
    # 覆盖率信息
    if [ -d "test-reports/coverage" ]; then
        echo '<div class="section">' >> "$report_file"
        echo '<h2>代码覆盖率</h2>' >> "$report_file"
        echo '<p>详细覆盖率报告请查看 <a href="./coverage/">coverage</a> 目录</p>' >> "$report_file"
        echo '</div>' >> "$report_file"
    fi
    
    echo '</body></html>' >> "$report_file"
    
    log_success "测试报告已生成: $report_file"
    
    # 在浏览器中打开报告（可选）
    if command -v open >/dev/null 2>&1 && [[ "$OSTYPE" == "darwin"* ]]; then
        open "$report_file"
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$report_file"
    fi
}

# 主函数
main() {
    local run_backend=true
    local run_frontend=true
    local run_e2e=false
    local generate_report=true
    
    # 参数解析
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend-only)
                run_frontend=false
                run_e2e=false
                shift
                ;;
            --frontend-only)
                run_backend=false
                run_e2e=false
                shift
                ;;
            --e2e)
                run_e2e=true
                shift
                ;;
            --no-report)
                generate_report=false
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    echo -e "${WHITE}=============================================${NC}"
    echo -e "${WHITE}  🧪 Pathfinder 测试套件${NC}"
    echo -e "${WHITE}=============================================${NC}"
    echo ""
    
    # 设置测试环境
    setup_test_environment
    
    local overall_exit_code=0
    
    # 运行后端测试
    if [ "$run_backend" = true ]; then
        if ! run_backend_tests; then
            overall_exit_code=1
        fi
    fi
    
    # 运行前端测试
    if [ "$run_frontend" = true ]; then
        if ! run_frontend_tests; then
            overall_exit_code=1
        fi
    fi
    
    # 运行 E2E 测试
    if [ "$run_e2e" = true ]; then
        if ! run_e2e_tests; then
            overall_exit_code=1
        fi
    fi
    
    # 生成测试报告
    if [ "$generate_report" = true ]; then
        generate_test_report
    fi
    
    # 显示总结
    echo ""
    if [ $overall_exit_code -eq 0 ]; then
        log_success "所有测试通过 ✅"
    else
        log_error "部分测试失败 ❌"
    fi
    
    echo ""
    echo -e "${CYAN}📊 测试结果位置:${NC}"
    echo -e "   日志: ${YELLOW}logs/tests/${NC}"
    echo -e "   报告: ${YELLOW}test-reports/${NC}"
    echo -e "   覆盖率: ${YELLOW}test-reports/coverage/${NC}"
    echo ""
    
    exit $overall_exit_code
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --backend-only    仅运行后端测试"
    echo "  --frontend-only   仅运行前端测试"
    echo "  --e2e            包含端到端测试"
    echo "  --no-report      不生成HTML报告"
    echo "  --help           显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 运行所有测试"
    echo "  $0 --backend-only     # 仅运行后端测试"
    echo "  $0 --e2e             # 包含E2E测试"
    echo ""
}

# 执行主函数
main "$@"