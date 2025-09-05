import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  admin: AdminUser;
  access_token: string;
  expires_in: number;
}

export interface UserWithAiUsage {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationId: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  aiLimit?: {
    dailyLimit: number;
    monthlyLimit: number;
    currentDaily: number;
    currentMonthly: number;
  } | null;
  aiUsageStats: {
    todayUsage: number;
    weekUsage: number;
    monthUsage: number;
    totalUsage: number;
  };
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'username' | 'email' | 'createdAt' | 'lastLoginAt' | 'aiUsage';
  sortOrder?: 'asc' | 'desc';
}

export interface GetUsersResponse {
  users: UserWithAiUsage[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateUserLimitsRequest {
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface UsageStats {
  totalUsers: number;
  activeUsers: number;
  totalAiRequests: number;
  todayAiRequests: number;
  weekAiRequests: number;
  monthAiRequests: number;
  topUsers: {
    id: string;
    username: string;
    email: string;
    totalUsage: number;
    monthUsage: number;
  }[];
  usageByType: {
    type: string;
    count: number;
    percentage: number;
  }[];
}

// 基准数据管理接口
export interface BenchmarkData {
  id: string;
  industry: string;
  region?: string;
  companySize?: string;
  metricType: string;
  metricName: string;
  value: number;
  percentile: number;
  sampleSize: number;
  periodStart: string;
  periodEnd: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BenchmarkDataInput {
  industry: string;
  region?: string;
  companySize?: string;
  metricType: string;
  metricName: string;
  value: number;
  percentile: number;
  sampleSize: number;
  periodStart: string;
  periodEnd: string;
}

export interface BenchmarkDataFilter {
  industry?: string;
  region?: string;
  companySize?: string;
  metricType?: string;
  metricName?: string;
  percentile?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetBenchmarksParams {
  page?: number;
  limit?: number;
  industry?: string;
  region?: string;
  companySize?: string;
  metricType?: string;
  metricName?: string;
  percentile?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetBenchmarksResponse {
  data: BenchmarkData[];
  total: number;
  page: number;
  limit: number;
}

export interface BenchmarkBatchImportResult {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  errors: {
    row: number;
    error: string;
  }[];
}

export interface BenchmarkStats {
  totalRecords: number;
  industriesCount: number;
  metricsCount: number;
  lastUpdated: string | null;
  dataQuality: {
    completeness: number;
    recentness: number;
    sampleSizeAverage: number;
  };
}

export const useAdminStore = defineStore('admin', () => {
  // State
  const admin = ref<AdminUser | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isAuthenticated = computed(() => !!admin.value && !!token.value);
  const isLoggedIn = computed(() => isAuthenticated.value);

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

  // Create axios instance with auth header
  const createAuthAxios = () => {
    const instance = axios.create({
      baseURL: `${API_BASE_URL}/admin`,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // For cookie-based auth
    });

    // Add auth header if token exists
    if (token.value) {
      instance.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
    }

    return instance;
  };

  // Actions
  const login = async (credentials: AdminLoginRequest): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      const response = await axios.post(`${API_BASE_URL}/admin/login`, credentials, {
        withCredentials: true
      });

      const data: AdminLoginResponse = response.data.data;
      
      admin.value = data.admin;
      token.value = data.access_token;
      
      // Store token in localStorage for persistence
      localStorage.setItem('admin_token', data.access_token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));

    } catch (err: any) {
      error.value = err.response?.data?.error || '登录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint if authenticated
      if (token.value) {
        const authAxios = createAuthAxios();
        await authAxios.post('/logout');
      }
    } catch (err) {
      console.error('Logout API call failed:', err);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local state
      admin.value = null;
      token.value = null;
      error.value = null;
      
      // Clear localStorage
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  };

  const initializeAuth = (): boolean => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');

    if (storedToken && storedUser) {
      try {
        token.value = storedToken;
        admin.value = JSON.parse(storedUser);
        return true;
      } catch (err) {
        console.error('Failed to parse stored admin user:', err);
        // Clear corrupted data
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }

    return false;
  };

  const verifyAuth = async (): Promise<boolean> => {
    if (!token.value) return false;

    try {
      const authAxios = createAuthAxios();
      const response = await authAxios.get('/profile');
      
      admin.value = response.data.data.admin;
      return true;
    } catch (err) {
      console.error('Auth verification failed:', err);
      await logout();
      return false;
    }
  };

  const getUsers = async (params: GetUsersParams = {}): Promise<GetUsersResponse> => {
    try {
      const authAxios = createAuthAxios();
      const response = await authAxios.get('/users', { params });
      return response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '获取用户列表失败';
      throw err;
    }
  };

  const updateUserLimits = async (userId: string, limits: UpdateUserLimitsRequest): Promise<void> => {
    try {
      const authAxios = createAuthAxios();
      await authAxios.put(`/users/${userId}/limits`, limits);
    } catch (err: any) {
      error.value = err.response?.data?.error || '更新用户限制失败';
      throw err;
    }
  };

  const getUsageStats = async (): Promise<UsageStats> => {
    try {
      const authAxios = createAuthAxios();
      const response = await authAxios.get('/usage-stats');
      return response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '获取使用统计失败';
      throw err;
    }
  };

  const checkHealth = async (): Promise<any> => {
    try {
      const authAxios = createAuthAxios();
      const response = await authAxios.get('/health');
      return response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '健康检查失败';
      throw err;
    }
  };

  const clearError = (): void => {
    error.value = null;
  };

  // ===================== 基准数据管理方法 =====================

  const getBenchmarks = async (params: GetBenchmarksParams = {}): Promise<GetBenchmarksResponse> => {
    try {
      const authAxios = createAuthAxios();
      const response = await authAxios.get('/benchmarks', { params });
      return response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '获取基准数据列表失败';
      throw err;
    }
  };

  const createBenchmark = async (data: BenchmarkDataInput): Promise<BenchmarkData> => {
    try {
      const authAxios = createAuthAxios();
      const response = await authAxios.post('/benchmarks', data);
      return response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '创建基准数据失败';
      throw err;
    }
  };

  const updateBenchmark = async (id: string, data: Partial<BenchmarkDataInput>): Promise<BenchmarkData> => {
    try {
      const authAxios = createAuthAxios();
      const response = await authAxios.put(`/benchmarks/${id}`, data);
      return response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '更新基准数据失败';
      throw err;
    }
  };

  const deleteBenchmark = async (id: string): Promise<void> => {
    try {
      const authAxios = createAuthAxios();
      await authAxios.delete(`/benchmarks/${id}`);
    } catch (err: any) {
      error.value = err.response?.data?.error || '删除基准数据失败';
      throw err;
    }
  };

  const batchImportBenchmarks = async (records: BenchmarkDataInput[]): Promise<BenchmarkBatchImportResult> => {
    try {
      const authAxios = createAuthAxios();
      const response = await authAxios.post('/benchmarks/batch-import', { records });
      return response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '批量导入基准数据失败';
      throw err;
    }
  };

  const getBenchmarkStats = async (): Promise<BenchmarkStats> => {
    try {
      const authAxios = createAuthAxios();
      const response = await authAxios.get('/benchmarks/stats');
      return response.data.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || '获取基准数据统计失败';
      throw err;
    }
  };

  return {
    // State
    admin,
    token,
    loading,
    error,
    
    // Computed
    isAuthenticated,
    isLoggedIn,
    
    // Actions
    login,
    logout,
    initializeAuth,
    verifyAuth,
    getUsers,
    updateUserLimits,
    getUsageStats,
    checkHealth,
    clearError,
    
    // 基准数据管理方法
    getBenchmarks,
    createBenchmark,
    updateBenchmark,
    deleteBenchmark,
    batchImportBenchmarks,
    getBenchmarkStats,
  };
});