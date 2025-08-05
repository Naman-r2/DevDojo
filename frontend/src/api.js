const API_BASE_URL = 'http://127.0.0.1:8000'; 

const api = {
  async request(endpoint, { body, method = 'GET', ...customConfig } = {}) {
    const token = localStorage.getItem('dojo_token');
    const headers = { 'Content-Type': 'application/json' };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      method,
      ...customConfig,
      headers: { ...headers, ...customConfig.headers },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Something went wrong');
      }
      return response.status === 204 ? {} : response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  login: (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Login failed');
      }
      return res.json();
    });
  },

  register: (username, email, password) =>
    api.request('/auth/register', {
      method: 'POST',
      body: { username, email, password },
    }),

  getMe: () => api.request('/auth/me'),

  updateMe: (github_username) =>
    api.request('/auth/me', {
      method: 'PUT',
      body: { github_username },
    }),

  getGroups: () => api.request('/groups/'),

  createGroup: (name, description) =>
    api.request('/groups/', {
      method: 'POST',
      body: { name, description },
    }),

  joinGroup: (groupId) =>
    api.request(`/groups/${groupId}/join`, {
      method: 'POST',
    }),

  getGroupLeaderboard: async (groupId) => {
    const response = await api.request(`/leaderboard/group/${groupId}`);
    debugger
    console.log(response)
    return response
  },

  createChallenge: ({ group_id, Topic, difficulty }) =>
    api.request('/challenges/', {
      method: 'POST',
      body: { group_id, Topic, difficulty },
    }),

  getPreviousChallenges: (groupId) =>
    api.request(`/challenges/group/${groupId}/previous`),

  fetchFeedback: async (userId) => {
    const res = await fetch(`${API_BASE_URL}/challenges/feedback/${userId}`);
    if (!res.ok) throw new Error("Failed to fetch feedback");
    return res.json();
  },
};

export default api;
