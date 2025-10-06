import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './config';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

class ApiService {
  private baseURL: string;
  private timeout: number;
  private isTestingConnection: boolean = false;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Test connection và tự động tìm URL đúng
  private async testConnection(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout cho test

      const response = await fetch(`${url}/auth/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.status === 401 || response.status === 200; // 401 = server hoạt động nhưng chưa auth
    } catch (error) {
      return false;
    }
  }

  async findWorkingURL(): Promise<string> {
    if (this.isTestingConnection) return this.baseURL;

    this.isTestingConnection = true;
    console.log('Testing API connections...');

    // Test URL hiện tại trước
    if (await this.testConnection(this.baseURL)) {
      console.log('Current URL is working:', this.baseURL);
      this.isTestingConnection = false;
      return this.baseURL;
    }

    // Test các fallback URLs
    for (const url of API_CONFIG.FALLBACK_URLS) {
      console.log('Testing URL:', url);
      if (await this.testConnection(url)) {
        console.log('Found working URL:', url);
        this.baseURL = url;
        this.isTestingConnection = false;
        return url;
      }
    }

    console.log('No working URL found, using default');
    this.isTestingConnection = false;
    return this.baseURL;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('token');
    console.log('🔑 Token from AsyncStorage:', token ? 'EXISTS' : 'NOT FOUND');
    if (token) {
      console.log('🔑 Token length:', token.length);
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    } else {
      console.log('🔑 No token found in AsyncStorage');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    console.log('📤 Request headers:', headers);
    console.log('📤 Authorization header:', headers.Authorization || 'NOT SET');
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const startTime = Date.now();

    try {
      const headers = await this.getAuthHeaders();

      // Tạo AbortController để có thể cancel request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const config: RequestInit = {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        signal: controller.signal,
      };

      // Tự động tìm URL hoạt động nếu request đầu tiên fail
      const workingBaseURL = await this.findWorkingURL();
      const url = `${workingBaseURL}${endpoint}`;
      console.log('Making API request to:', url);
      console.log('Request config:', {
        method: config.method,
        headers: config.headers,
      });

      if (config.body) {
        console.log('Request body:', config.body);
      }

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      console.log(`Response received in ${responseTime}ms`);

      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      // Debug 401 specifically
      if (response.status === 401) {
        console.log('🚨 401 Unauthorized - Debug Info:');
        console.log('🚨 URL:', url);
        console.log('🚨 Headers sent:', config.headers);
        console.log('🚨 Response headers:', response.headers);
        console.log('🚨 Response body:', data);
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: data.success ? data : { ...data, success: true },
        message: data.message,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error(`API Error after ${responseTime}ms:`, error);

      let errorMessage = 'Network error occurred';

      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - Vui lòng kiểm tra kết nối mạng';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Không thể kết nối đến server - Vui lòng kiểm tra backend';
      } else {
        errorMessage = error.message || 'Network error occurred';
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Save token to AsyncStorage
  async saveToken(token: string): Promise<void> {
    await AsyncStorage.setItem('token', token);
  }

  // Remove token from AsyncStorage
  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem('token');
  }

  // Get token from AsyncStorage
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  }
}

export default new ApiService();
