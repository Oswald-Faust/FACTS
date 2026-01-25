/**
 * FACTS - API Service
 * Interact with the backend API
 */

import Constants from 'expo-constants';
import * as Storage from './storage';
import { ApiResponse, User, FactCheckResult, HistoryItem } from '../types';

// Get API URL from environment
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Custom API Error
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setToken(token: string | null) {
    this.token = token;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    } else {
      // Try to get token from storage if not in memory
      const token = await Storage.getAuthToken();
      if (token) {
        this.token = token;
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}/api${endpoint}`;
    const headers = await this.getHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.error || data.message || 'Une erreur est survenue', response.status);
      }

      return data.data;
    } catch (error) {
      console.error(`API Request Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth Methods
  public async register(email: string, password: string, displayName?: string) {
    const data = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    
    // Save token
    this.setToken(data.token);
    await Storage.saveAuthToken(data.token);
    await Storage.saveUser(data.user);
    
    return data;
  }

  public async login(email: string, password: string) {
    const data = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Save token
    this.setToken(data.token);
    await Storage.saveAuthToken(data.token);
    await Storage.saveUser(data.user);

    return data;
  }

  public async getProfile() {
    const data = await this.request<{ user: User }>('/users/profile');
    await Storage.saveUser(data.user);
    return data.user;
  }

  public async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore logout errors
    } finally {
      this.token = null;
      await Storage.removeUser();
    }
  }

  public async upgradeToPremium() {
    const data = await this.request<{ user: User }>('/users/premium/upgrade', { method: 'POST' });
    if (data.user) {
        await Storage.saveUser(data.user);
    }
    return data.user;
  }

  // Fact Check Methods
  public async getHistory(page = 1, limit = 20) {
    const data = await this.request<{ factChecks: FactCheckResult[], pagination: any }>(
      `/fact-checks?page=${page}&limit=${limit}`
    );
    return data.factChecks.map(fc => ({
      id: fc.id,
      userId: this.token ? 'api' : 'local',
      factCheck: fc,
      savedAt: new Date(fc.createdAt),
    } as HistoryItem));
  }

  public async verifyFactCheck(claim: string, imageUri?: string) {
    // If imageUri is local file (starts with file://), use FormData
    if (imageUri && imageUri.startsWith('file://')) {
       // FormData upload
       const url = `${API_URL}/api/fact-checks/verify`;
       const headers: any = await this.getHeaders();
       delete headers['Content-Type']; 

       const fd = new FormData();
       fd.append('claim', claim);
       
       const filename = imageUri.split('/').pop() || 'image.jpg';
       const match = /\.(\w+)$/.exec(filename);
       const type = match ? `image/${match[1]}` : `image/jpeg`;
       
       fd.append('image', { uri: imageUri, name: filename, type } as any);

       try {
         const response = await fetch(url, {
           method: 'POST',
           headers,
           body: fd,
         });

         const data = await response.json();

         if (!response.ok) {
           throw new ApiError(data.error || data.message || 'Vérification échouée', response.status);
         }
         return data.data.factCheck;
       } catch (error) {
         console.error('Verify Upload Error:', error);
         throw error;
       }
    } else {
       // JSON request for text or remote URL
       const data = await this.request<{ factCheck: FactCheckResult }>('/fact-checks/verify', {
         method: 'POST',
         body: JSON.stringify({ claim, imageUrl: imageUri }),
       });
       return data.factCheck;
    }
  }

  public async saveFactCheck(factCheck: Omit<FactCheckResult, 'id' | 'createdAt' | 'processingTimeMs'> & { processingTimeMs: number }) {
    const data = await this.request<{ factCheck: FactCheckResult }>('/fact-checks', {
      method: 'POST',
      body: JSON.stringify(factCheck),
    });
    return data.factCheck;
  }

  public async deleteFactCheck(id: string) {
    await this.request(`/fact-checks/${id}`, { method: 'DELETE' });
  }

  public async clearHistory() {
    await this.request('/fact-checks', { method: 'DELETE' });
  }

  public async uploadAvatar(formData: any) {
    const url = `${API_URL}/api/users/avatar`;
    const headers: any = await this.getHeaders();
    delete headers['Content-Type']; // Let fetch handle multipart/form-data boundary

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.error || data.message || 'Upload failed', response.status);
      }

      // Update local storage if user is returned
      if (data.data?.user) {
        await Storage.saveUser(data.data.user);
      }
      
      return data.data;
    } catch (error) {
      console.error('Avatar Upload Error:', error);
      throw error;
    }
  }
}

export default ApiService.getInstance();
