import axios, { AxiosInstance } from 'axios'
import { 
  LoginRequest, 
  CreateUserRequest, 
  AuthResponse, 
  ApiResponse,
  User,
  Quest,
  Reward,
  Family,
  CreateQuestRequest,
  CompleteQuestRequest,
  CreateRewardRequest,
  RedeemRewardRequest
} from '@questkit/shared'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = this.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = this.getRefreshToken()
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh', {
                refreshToken
              })

              const { token, refreshToken: newRefreshToken } = response.data.data
              this.setTokens(token, newRefreshToken)
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${token}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            this.clearTokens()
            window.location.href = '/auth/login'
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    const auth = localStorage.getItem('questkit-auth')
    if (auth) {
      try {
        const parsed = JSON.parse(auth)
        return parsed.state?.token || null
      } catch {
        return null
      }
    }
    return null
  }

  private getRefreshToken(): string | null {
    const auth = localStorage.getItem('questkit-auth')
    if (auth) {
      try {
        const parsed = JSON.parse(auth)
        return parsed.state?.refreshToken || null
      } catch {
        return null
      }
    }
    return null
  }

  private setTokens(token: string, refreshToken: string) {
    const auth = localStorage.getItem('questkit-auth')
    if (auth) {
      try {
        const parsed = JSON.parse(auth)
        parsed.state.token = token
        parsed.state.refreshToken = refreshToken
        localStorage.setItem('questkit-auth', JSON.stringify(parsed))
      } catch (error) {
        console.error('Failed to update tokens:', error)
      }
    }
  }

  private clearTokens() {
    localStorage.removeItem('questkit-auth')
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
    return response.data.data!
  }

  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>('/auth/register', userData)
    return response.data.data!
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const response = await this.client.post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken
    })
    return response.data.data!
  }

  // User endpoints
  async getUserProfile(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/users/profile')
    return response.data.data!
  }

  async updateUserProfile(data: Partial<User>): Promise<User> {
    const response = await this.client.put<ApiResponse<User>>('/users/profile', data)
    return response.data.data!
  }

  // Family endpoints
  async getFamily(): Promise<Family> {
    const response = await this.client.get<ApiResponse<Family>>('/families')
    return response.data.data!
  }

  async createFamily(name: string, description?: string): Promise<Family> {
    const response = await this.client.post<ApiResponse<Family>>('/auth/create-family', {
      userId: this.getToken(), // This should be handled by auth middleware
      name,
      description
    })
    return response.data.data!
  }

  async joinFamily(inviteCode: string): Promise<Family> {
    const response = await this.client.post<ApiResponse<Family>>('/auth/join-family', {
      userId: this.getToken(), // This should be handled by auth middleware
      inviteCode
    })
    return response.data.data!
  }

  // Quest endpoints
  async getQuests(params?: any): Promise<{ quests: Quest[]; pagination: any }> {
    const response = await this.client.get<ApiResponse<{ quests: Quest[]; pagination: any }>>('/quests', { params })
    return response.data.data!
  }

  async getQuest(questId: string): Promise<Quest> {
    const response = await this.client.get<ApiResponse<Quest>>(`/quests/${questId}`)
    return response.data.data!
  }

  async createQuest(questData: CreateQuestRequest): Promise<Quest> {
    const response = await this.client.post<ApiResponse<Quest>>('/quests', questData)
    return response.data.data!
  }

  async completeQuest(questId: string, data: CompleteQuestRequest): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/quests/${questId}/complete`, data)
    return response.data.data!
  }

  // Reward endpoints
  async getRewards(params?: any): Promise<{ rewards: Reward[]; pagination: any }> {
    const response = await this.client.get<ApiResponse<{ rewards: Reward[]; pagination: any }>>('/rewards', { params })
    return response.data.data!
  }

  async createReward(rewardData: CreateRewardRequest): Promise<Reward> {
    const response = await this.client.post<ApiResponse<Reward>>('/rewards', rewardData)
    return response.data.data!
  }

  async redeemReward(rewardId: string, data: RedeemRewardRequest): Promise<any> {
    const response = await this.client.post<ApiResponse<any>>(`/rewards/${rewardId}/redeem`, data)
    return response.data.data!
  }

  async getUserRedemptions(params?: any): Promise<{ redemptions: any[]; pagination: any }> {
    const response = await this.client.get<ApiResponse<{ redemptions: any[]; pagination: any }>>('/rewards/my-redemptions', { params })
    return response.data.data!
  }

  // Stats endpoints
  async getUserStats(userId?: string): Promise<any> {
    const params = userId ? { userId } : {}
    const response = await this.client.get<ApiResponse<any>>('/stats/user', { params })
    return response.data.data!
  }

  async getFamilyStats(): Promise<any> {
    const response = await this.client.get<ApiResponse<any>>('/stats/family')
    return response.data.data!
  }

  async getLeaderboard(metric?: string, period?: string): Promise<any> {
    const params = { metric, period }
    const response = await this.client.get<ApiResponse<any>>('/stats/leaderboard', { params })
    return response.data.data!
  }
}

// Create singleton instance
const apiClient = new ApiClient()

// Export service objects
export const authService = {
  login: apiClient.login.bind(apiClient),
  register: apiClient.register.bind(apiClient),
  refreshToken: apiClient.refreshToken.bind(apiClient)
}

export const userService = {
  getProfile: apiClient.getUserProfile.bind(apiClient),
  updateProfile: apiClient.updateUserProfile.bind(apiClient)
}

export const familyService = {
  getFamily: apiClient.getFamily.bind(apiClient),
  createFamily: apiClient.createFamily.bind(apiClient),
  joinFamily: apiClient.joinFamily.bind(apiClient)
}

export const questService = {
  getQuests: apiClient.getQuests.bind(apiClient),
  getQuest: apiClient.getQuest.bind(apiClient),
  createQuest: apiClient.createQuest.bind(apiClient),
  completeQuest: apiClient.completeQuest.bind(apiClient)
}

export const rewardService = {
  getRewards: apiClient.getRewards.bind(apiClient),
  createReward: apiClient.createReward.bind(apiClient),
  redeemReward: apiClient.redeemReward.bind(apiClient),
  getUserRedemptions: apiClient.getUserRedemptions.bind(apiClient)
}

export const statsService = {
  getUserStats: apiClient.getUserStats.bind(apiClient),
  getFamilyStats: apiClient.getFamilyStats.bind(apiClient),
  getLeaderboard: apiClient.getLeaderboard.bind(apiClient)
}

export default apiClient