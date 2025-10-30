import api from './api';

class AIStatsApi {
  // 获取工具使用统计
  async getToolUsageStats(days = 30) {
    try {
      const response = await api.get(`/ai-stats/tool-usage?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('获取工具使用统计失败:', error);
      throw error;
    }
  }

  // 获取用户积分消费统计
  async getUserCreditStats(userId, days = 30) {
    try {
      const response = await api.get(`/ai-stats/user-credits/${userId}?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('获取用户积分消费统计失败:', error);
      throw error;
    }
  }

  // 获取所有用户积分消费统计
  async getAllUserCreditStats(days = 30) {
    try {
      const response = await api.get(`/ai-stats/all-user-credits?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('获取所有用户积分消费统计失败:', error);
      throw error;
    }
  }
}

const aiStatsApi = new AIStatsApi();
export default aiStatsApi;