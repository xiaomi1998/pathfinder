#!/bin/bash

# Pathfinder Deployment Checker Script
# Version: 1.0
# Description: Comprehensive deployment environment checker for Pathfinder application
# Usage: ./deployment-checker.sh [--pre-deploy|--post-deploy|--full]

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_FILE="deployment-check-report-$(date +%Y%m%d-%H%M%S).txt"
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0
ERRORS=()
WARNINGS=()

# Configuration
MIN_MEMORY_GB=2
MIN_DISK_GB=10
REQUIRED_PORTS=(3000 5000 5432 6379 80 443)
API_ENDPOINTS=(
    "http://localhost:5000/api/auth/health"
    "http://localhost:5000/api/funnels"
    "http://localhost:5000/api/nodes"
)

# Initialize report
init_report() {
    echo "# Pathfinder Deployment Check Report" > "$REPORT_FILE"
    echo "Generated: $(date)" >> "$REPORT_FILE"
    echo "Host: $(hostname)" >> "$REPORT_FILE"
    echo "User: $(whoami)" >> "$REPORT_FILE"
    echo "Working Directory: $SCRIPT_DIR" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$REPORT_FILE"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$REPORT_FILE"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$REPORT_FILE"
    WARNINGS+=("$1")
    ((WARNING_CHECKS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$REPORT_FILE"
    ERRORS+=("$1")
    ((FAILED_CHECKS++))
}

log_header() {
    echo -e "\n${PURPLE}===============================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}===============================================${NC}\n"
    echo "" >> "$REPORT_FILE"
    echo "=== $1 ===" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# Increment total checks counter
check_counter() {
    ((TOTAL_CHECKS++))
}

# System Environment Checks
check_system_environment() {
    log_header "System Environment Checks"
    
    # OS Version and Architecture
    check_counter
    log_info "Checking operating system and architecture..."
    if command -v uname >/dev/null 2>&1; then
        local os_info="$(uname -a)"
        log_success "OS Info: $os_info"
        
        # Check if it's a supported OS
        if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
            log_success "Operating system is supported: $OSTYPE"
        else
            log_warning "Operating system may not be fully supported: $OSTYPE"
        fi
    else
        log_error "Unable to determine operating system information"
    fi

    # Docker version check
    check_counter
    log_info "Checking Docker installation..."
    if command -v docker >/dev/null 2>&1; then
        local docker_version=$(docker --version 2>/dev/null || echo "Unknown")
        log_success "Docker is installed: $docker_version"
        
        # Check Docker daemon status
        if docker info >/dev/null 2>&1; then
            log_success "Docker daemon is running"
        else
            log_error "Docker daemon is not running or accessible"
        fi
    else
        log_error "Docker is not installed"
    fi

    # Docker Compose version check
    check_counter
    log_info "Checking Docker Compose installation..."
    if command -v docker-compose >/dev/null 2>&1; then
        local compose_version=$(docker-compose --version 2>/dev/null || echo "Unknown")
        log_success "Docker Compose is installed: $compose_version"
    elif docker compose version >/dev/null 2>&1; then
        local compose_version=$(docker compose version 2>/dev/null || echo "Unknown")
        log_success "Docker Compose (plugin) is installed: $compose_version"
    else
        log_error "Docker Compose is not installed"
    fi

    # Memory check
    check_counter
    log_info "Checking available memory..."
    if command -v free >/dev/null 2>&1; then
        local mem_total=$(free -g | awk 'NR==2{printf "%.1f", $2}')
        if (( $(echo "$mem_total >= $MIN_MEMORY_GB" | bc -l) )); then
            log_success "Memory check passed: ${mem_total}GB available (minimum: ${MIN_MEMORY_GB}GB)"
        else
            log_warning "Low memory: ${mem_total}GB available (recommended: ${MIN_MEMORY_GB}GB+)"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        local mem_total=$(sysctl -n hw.memsize | awk '{print $1/1024/1024/1024}')
        if (( $(echo "$mem_total >= $MIN_MEMORY_GB" | bc -l 2>/dev/null || echo "0") )); then
            log_success "Memory check passed: ${mem_total}GB available (minimum: ${MIN_MEMORY_GB}GB)"
        else
            log_warning "Low memory: ${mem_total}GB available (recommended: ${MIN_MEMORY_GB}GB+)"
        fi
    else
        log_warning "Unable to check memory on this system"
    fi

    # Disk space check
    check_counter
    log_info "Checking available disk space..."
    local disk_available=$(df -BG "$SCRIPT_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ -n "$disk_available" ]] && (( disk_available >= MIN_DISK_GB )); then
        log_success "Disk space check passed: ${disk_available}GB available (minimum: ${MIN_DISK_GB}GB)"
    else
        log_warning "Low disk space: ${disk_available}GB available (recommended: ${MIN_DISK_GB}GB+)"
    fi

    # Node.js version check
    check_counter
    log_info "Checking Node.js installation..."
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        log_success "Node.js is installed: $node_version"
        
        # Check if version is recent enough (v16+)
        local major_version=$(echo "$node_version" | sed 's/v\([0-9]*\).*/\1/')
        if (( major_version >= 16 )); then
            log_success "Node.js version is supported (v16+)"
        else
            log_warning "Node.js version may be outdated. Recommended: v16+"
        fi
    else
        log_error "Node.js is not installed"
    fi

    # npm version check
    check_counter
    log_info "Checking npm installation..."
    if command -v npm >/dev/null 2>&1; then
        local npm_version=$(npm --version)
        log_success "npm is installed: v$npm_version"
    else
        log_error "npm is not installed"
    fi
}

# Network and Port Checks
check_network_ports() {
    log_header "Network and Port Availability Checks"
    
    for port in "${REQUIRED_PORTS[@]}"; do
        check_counter
        log_info "Checking port $port availability..."
        
        if command -v netstat >/dev/null 2>&1; then
            if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                log_warning "Port $port is already in use"
            else
                log_success "Port $port is available"
            fi
        elif command -v ss >/dev/null 2>&1; then
            if ss -tuln 2>/dev/null | grep -q ":$port "; then
                log_warning "Port $port is already in use"
            else
                log_success "Port $port is available"
            fi
        elif command -v lsof >/dev/null 2>&1; then
            if lsof -i ":$port" >/dev/null 2>&1; then
                log_warning "Port $port is already in use"
            else
                log_success "Port $port is available"
            fi
        else
            log_warning "Cannot check port $port - no suitable network tool found"
        fi
    done
    
    # Network connectivity check
    check_counter
    log_info "Checking internet connectivity..."
    if ping -c 1 8.8.8.8 >/dev/null 2>&1 || ping -c 1 google.com >/dev/null 2>&1; then
        log_success "Internet connectivity is available"
    else
        log_warning "Internet connectivity may be limited"
    fi
}

# File Integrity Checks
check_file_integrity() {
    log_header "File Integrity Checks"
    
    # Core project files
    local core_files=(
        "package.json"
        "docker-compose.yml"
        "docker-compose.prod.yml"
        "backend/package.json"
        "frontend/package.json"
        "backend/src/app.ts"
        "frontend/src/main.ts"
        "backend/prisma/schema.prisma"
    )
    
    for file in "${core_files[@]}"; do
        check_counter
        log_info "Checking existence of $file..."
        if [[ -f "$SCRIPT_DIR/$file" ]]; then
            log_success "File exists: $file"
            
            # Check file permissions
            if [[ -r "$SCRIPT_DIR/$file" ]]; then
                log_success "File is readable: $file"
            else
                log_error "File is not readable: $file"
            fi
        else
            log_error "Missing required file: $file"
        fi
    done
    
    # Docker configuration files
    local docker_files=(
        "Dockerfile.backend"
        "Dockerfile.frontend"
        "backend/Dockerfile.prod"
        "frontend/Dockerfile.prod"
    )
    
    for file in "${docker_files[@]}"; do
        check_counter
        log_info "Checking Docker file: $file..."
        if [[ -f "$SCRIPT_DIR/$file" ]]; then
            log_success "Docker file exists: $file"
            
            # Basic syntax check for Dockerfile
            if grep -q "^FROM" "$SCRIPT_DIR/$file"; then
                log_success "Docker file has valid FROM instruction: $file"
            else
                log_error "Docker file missing FROM instruction: $file"
            fi
        else
            log_warning "Optional Docker file missing: $file"
        fi
    done
    
    # Directory structure check
    local required_dirs=(
        "backend"
        "frontend"
        "backend/src"
        "frontend/src"
        "backend/prisma"
    )
    
    for dir in "${required_dirs[@]}"; do
        check_counter
        log_info "Checking directory: $dir..."
        if [[ -d "$SCRIPT_DIR/$dir" ]]; then
            log_success "Directory exists: $dir"
        else
            log_error "Missing required directory: $dir"
        fi
    done
}

# Configuration Validation
check_configuration() {
    log_header "Configuration Validation"
    
    # Environment file checks
    local env_files=(
        ".env"
        "backend/.env"
        "frontend/.env"
        ".env.production"
    )
    
    for env_file in "${env_files[@]}"; do
        check_counter
        log_info "Checking environment file: $env_file..."
        if [[ -f "$SCRIPT_DIR/$env_file" ]]; then
            log_success "Environment file exists: $env_file"
            
            # Check for common required variables
            local required_vars=("DATABASE_URL" "REDIS_URL" "JWT_SECRET" "NODE_ENV")
            for var in "${required_vars[@]}"; do
                if grep -q "^$var=" "$SCRIPT_DIR/$env_file" 2>/dev/null; then
                    log_success "Environment variable defined: $var in $env_file"
                else
                    log_warning "Environment variable missing: $var in $env_file"
                fi
            done
        else
            log_warning "Environment file not found: $env_file"
        fi
    done
    
    # Docker Compose validation
    check_counter
    log_info "Validating docker-compose.yml configuration..."
    if [[ -f "$SCRIPT_DIR/docker-compose.yml" ]]; then
        if command -v docker-compose >/dev/null 2>&1; then
            if docker-compose -f "$SCRIPT_DIR/docker-compose.yml" config >/dev/null 2>&1; then
                log_success "docker-compose.yml is valid"
            else
                log_error "docker-compose.yml has syntax errors"
            fi
        elif docker compose -f "$SCRIPT_DIR/docker-compose.yml" config >/dev/null 2>&1; then
            log_success "docker-compose.yml is valid"
        else
            log_warning "Cannot validate docker-compose.yml - Docker Compose not available"
        fi
    else
        log_error "docker-compose.yml not found"
    fi
    
    # Package.json validation
    for package_json in "package.json" "backend/package.json" "frontend/package.json"; do
        check_counter
        log_info "Validating $package_json..."
        if [[ -f "$SCRIPT_DIR/$package_json" ]]; then
            if command -v node >/dev/null 2>&1; then
                if node -e "JSON.parse(require('fs').readFileSync('$SCRIPT_DIR/$package_json', 'utf8'))" 2>/dev/null; then
                    log_success "Valid JSON format: $package_json"
                else
                    log_error "Invalid JSON format: $package_json"
                fi
            else
                log_warning "Cannot validate JSON - Node.js not available"
            fi
        else
            log_warning "Package.json not found: $package_json"
        fi
    done
}

# Database Connection Test
check_database_connection() {
    log_header "Database Connection Tests"
    
    # Check if PostgreSQL is accessible
    check_counter
    log_info "Testing PostgreSQL connection..."
    
    # Try to read DATABASE_URL from environment files
    local database_url=""
    for env_file in ".env" "backend/.env"; do
        if [[ -f "$SCRIPT_DIR/$env_file" ]]; then
            database_url=$(grep "^DATABASE_URL=" "$SCRIPT_DIR/$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            if [[ -n "$database_url" ]]; then
                break
            fi
        fi
    done
    
    if [[ -n "$database_url" ]]; then
        # Extract connection details
        if command -v psql >/dev/null 2>&1; then
            if psql "$database_url" -c "SELECT 1;" >/dev/null 2>&1; then
                log_success "PostgreSQL connection successful"
            else
                log_warning "PostgreSQL connection failed - database may not be running"
            fi
        else
            log_warning "Cannot test PostgreSQL connection - psql not available"
        fi
    else
        log_warning "DATABASE_URL not found in environment files"
    fi
    
    # Check if Redis is accessible
    check_counter
    log_info "Testing Redis connection..."
    
    local redis_url=""
    for env_file in ".env" "backend/.env"; do
        if [[ -f "$SCRIPT_DIR/$env_file" ]]; then
            redis_url=$(grep "^REDIS_URL=" "$SCRIPT_DIR/$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            if [[ -n "$redis_url" ]]; then
                break
            fi
        fi
    done
    
    if command -v redis-cli >/dev/null 2>&1; then
        if [[ -n "$redis_url" ]]; then
            if redis-cli -u "$redis_url" ping >/dev/null 2>&1; then
                log_success "Redis connection successful"
            else
                log_warning "Redis connection failed - Redis may not be running"
            fi
        else
            # Try default connection
            if redis-cli ping >/dev/null 2>&1; then
                log_success "Redis connection successful (default settings)"
            else
                log_warning "Redis connection failed"
            fi
        fi
    else
        log_warning "Cannot test Redis connection - redis-cli not available"
    fi
}

# Service Health Checks (Post-deployment)
check_service_health() {
    log_header "Service Health Checks"
    
    # Check Docker containers
    check_counter
    log_info "Checking Docker containers status..."
    if command -v docker >/dev/null 2>&1; then
        local containers=$(docker ps -a --format "table {{.Names}}\t{{.Status}}" 2>/dev/null)
        if [[ -n "$containers" ]]; then
            log_success "Docker containers found:"
            echo "$containers" | tail -n +2 | while read -r line; do
                local container_name=$(echo "$line" | awk '{print $1}')
                local status=$(echo "$line" | awk '{print $2}')
                if [[ "$status" == "Up" ]]; then
                    log_success "Container $container_name is running"
                else
                    log_warning "Container $container_name is not running: $status"
                fi
            done
        else
            log_warning "No Docker containers found"
        fi
    else
        log_warning "Cannot check Docker containers - Docker not available"
    fi
    
    # Check services via docker-compose
    check_counter
    log_info "Checking docker-compose services..."
    if [[ -f "$SCRIPT_DIR/docker-compose.yml" ]]; then
        if command -v docker-compose >/dev/null 2>&1; then
            local services=$(docker-compose -f "$SCRIPT_DIR/docker-compose.yml" ps 2>/dev/null)
            if [[ -n "$services" ]]; then
                log_success "Docker Compose services status retrieved"
                echo "$services"
            else
                log_warning "No active Docker Compose services found"
            fi
        elif docker compose -f "$SCRIPT_DIR/docker-compose.yml" ps >/dev/null 2>&1; then
            local services=$(docker compose -f "$SCRIPT_DIR/docker-compose.yml" ps 2>/dev/null)
            if [[ -n "$services" ]]; then
                log_success "Docker Compose services status retrieved"
                echo "$services"
            else
                log_warning "No active Docker Compose services found"
            fi
        fi
    fi
}

# API Endpoint Tests (Post-deployment)
check_api_endpoints() {
    log_header "API Endpoint Response Tests"
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10
    
    for endpoint in "${API_ENDPOINTS[@]}"; do
        check_counter
        log_info "Testing API endpoint: $endpoint..."
        
        local response_code=""
        if command -v curl >/dev/null 2>&1; then
            response_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null || echo "000")
            
            if [[ "$response_code" -ge 200 && "$response_code" -lt 300 ]]; then
                log_success "API endpoint responding: $endpoint (HTTP $response_code)"
            elif [[ "$response_code" -ge 400 && "$response_code" -lt 500 ]]; then
                log_warning "API endpoint client error: $endpoint (HTTP $response_code)"
            elif [[ "$response_code" -ge 500 ]]; then
                log_error "API endpoint server error: $endpoint (HTTP $response_code)"
            else
                log_error "API endpoint not accessible: $endpoint"
            fi
        elif command -v wget >/dev/null 2>&1; then
            if wget --spider -q "$endpoint" 2>/dev/null; then
                log_success "API endpoint responding: $endpoint"
            else
                log_error "API endpoint not accessible: $endpoint"
            fi
        else
            log_warning "Cannot test API endpoint - no HTTP client available: $endpoint"
        fi
    done
}

# Database Initialization Check
check_database_initialization() {
    log_header "Database Initialization Checks"
    
    check_counter
    log_info "Checking database schema initialization..."
    
    # Check if Prisma migrations have been run
    if [[ -d "$SCRIPT_DIR/backend/prisma/migrations" ]]; then
        local migration_count=$(find "$SCRIPT_DIR/backend/prisma/migrations" -type d -name "*_*" | wc -l)
        if [[ "$migration_count" -gt 0 ]]; then
            log_success "Found $migration_count database migrations"
        else
            log_warning "No database migrations found"
        fi
    else
        log_warning "Prisma migrations directory not found"
    fi
    
    # Try to check if tables exist (if database connection is available)
    check_counter
    log_info "Checking database tables..."
    
    local database_url=""
    for env_file in ".env" "backend/.env"; do
        if [[ -f "$SCRIPT_DIR/$env_file" ]]; then
            database_url=$(grep "^DATABASE_URL=" "$SCRIPT_DIR/$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            if [[ -n "$database_url" ]]; then
                break
            fi
        fi
    done
    
    if [[ -n "$database_url" ]] && command -v psql >/dev/null 2>&1; then
        local table_count=$(psql "$database_url" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
        if [[ "$table_count" -gt 0 ]]; then
            log_success "Database contains $table_count tables"
        else
            log_warning "Database appears to be empty"
        fi
    else
        log_warning "Cannot check database tables - connection not available"
    fi
}

# Generate Summary Report
generate_summary() {
    log_header "Deployment Check Summary"
    
    echo "" >> "$REPORT_FILE"
    echo "=== SUMMARY ===" >> "$REPORT_FILE"
    echo "Total Checks: $TOTAL_CHECKS" >> "$REPORT_FILE"
    echo "Passed: $PASSED_CHECKS" >> "$REPORT_FILE"
    echo "Warnings: $WARNING_CHECKS" >> "$REPORT_FILE"
    echo "Failed: $FAILED_CHECKS" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    log_info "Assessment Results:"
    echo -e "  ${GREEN}✓ Passed: $PASSED_CHECKS${NC}"
    echo -e "  ${YELLOW}⚠ Warnings: $WARNING_CHECKS${NC}"
    echo -e "  ${RED}✗ Failed: $FAILED_CHECKS${NC}"
    echo -e "  ${BLUE}Total Checks: $TOTAL_CHECKS${NC}"
    
    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    log_info "Success Rate: ${success_rate}%"
    
    if [[ ${#ERRORS[@]} -gt 0 ]]; then
        echo -e "\n${RED}Critical Issues Found:${NC}"
        echo "=== CRITICAL ISSUES ===" >> "$REPORT_FILE"
        for error in "${ERRORS[@]}"; do
            echo -e "  ${RED}• $error${NC}"
            echo "- $error" >> "$REPORT_FILE"
        done
    fi
    
    if [[ ${#WARNINGS[@]} -gt 0 ]]; then
        echo -e "\n${YELLOW}Warnings:${NC}"
        echo "=== WARNINGS ===" >> "$REPORT_FILE"
        for warning in "${WARNINGS[@]}"; do
            echo -e "  ${YELLOW}• $warning${NC}"
            echo "- $warning" >> "$REPORT_FILE"
        done
    fi
    
    echo -e "\n${CYAN}Detailed report saved to: $REPORT_FILE${NC}"
    
    # Deployment readiness assessment
    if [[ $FAILED_CHECKS -eq 0 ]]; then
        echo -e "\n${GREEN}🎉 DEPLOYMENT READY${NC}"
        echo "RESULT: DEPLOYMENT READY" >> "$REPORT_FILE"
    elif [[ $FAILED_CHECKS -le 2 ]]; then
        echo -e "\n${YELLOW}⚠️  DEPLOYMENT POSSIBLE WITH CAUTION${NC}"
        echo "RESULT: DEPLOYMENT POSSIBLE WITH CAUTION" >> "$REPORT_FILE"
    else
        echo -e "\n${RED}❌ DEPLOYMENT NOT RECOMMENDED${NC}"
        echo "RESULT: DEPLOYMENT NOT RECOMMENDED" >> "$REPORT_FILE"
    fi
}

# Usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Pathfinder Deployment Checker - Comprehensive environment validation"
    echo ""
    echo "Options:"
    echo "  --pre-deploy    Run pre-deployment checks only"
    echo "  --post-deploy   Run post-deployment checks only"
    echo "  --full          Run all checks (default)"
    echo "  --help, -h      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Run full check"
    echo "  $0 --pre-deploy      # Check before deployment"
    echo "  $0 --post-deploy     # Verify after deployment"
    echo ""
}

# Main execution
main() {
    local mode="${1:-full}"
    
    case "$mode" in
        "--help"|"-h")
            show_usage
            exit 0
            ;;
        "--pre-deploy")
            mode="pre-deploy"
            ;;
        "--post-deploy")
            mode="post-deploy"
            ;;
        "--full"|"")
            mode="full"
            ;;
        *)
            echo -e "${RED}Error: Unknown option '$mode'${NC}"
            show_usage
            exit 1
            ;;
    esac
    
    # Initialize
    init_report
    
    echo -e "${WHITE}"
    echo "██████╗  █████╗ ████████╗██╗  ██╗███████╗██╗███╗   ██╗██████╗ ███████╗██████╗ "
    echo "██╔══██╗██╔══██╗╚══██╔══╝██║  ██║██╔════╝██║████╗  ██║██╔══██╗██╔════╝██╔══██╗"
    echo "██████╔╝███████║   ██║   ███████║█████╗  ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝"
    echo "██╔═══╝ ██╔══██║   ██║   ██╔══██║██╔══╝  ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗"
    echo "██║     ██║  ██║   ██║   ██║  ██║██║     ██║██║ ╚████║██████╔╝███████╗██║  ██║"
    echo "╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝"
    echo -e "${NC}"
    echo -e "${CYAN}Deployment Environment Checker${NC}"
    echo -e "${BLUE}Mode: $(echo "$mode" | tr '[:lower:]' '[:upper:]')${NC}"
    echo ""
    
    # Execute checks based on mode
    case "$mode" in
        "pre-deploy"|"full")
            check_system_environment
            check_network_ports
            check_file_integrity
            check_configuration
            check_database_connection
            ;;
    esac
    
    case "$mode" in
        "post-deploy"|"full")
            check_service_health
            check_api_endpoints
            check_database_initialization
            ;;
    esac
    
    # Generate summary
    generate_summary
    
    # Exit with appropriate code
    if [[ $FAILED_CHECKS -eq 0 ]]; then
        exit 0
    else
        exit 1
    fi
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi