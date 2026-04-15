import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});

// Attach access token from storage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem('access_token', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ── Typed API helpers ─────────────────────────────────────────────────────────

export const promptsApi = {
  list: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/prompts`),
  get: (id: string) => api.get(`/prompts/${id}`),
  create: (workspaceId: string, body: object) => api.post(`/workspaces/${workspaceId}/prompts`, body),
  pushVersion: (promptId: string, body: object) => api.post(`/prompts/${promptId}/versions`, body),
  listVersions: (promptId: string) => api.get(`/prompts/${promptId}/versions`),
  diff: (promptId: string, from: string, to: string) =>
    api.get(`/prompts/${promptId}/diff?from=${from}&to=${to}`),
  promote: (promptId: string, versionId: string, env: string) =>
    api.post(`/prompts/${promptId}/versions/${versionId}/promote`, { environment: env }),
};

export const aiEnhanceApi = {
  enhance: (versionId: string, body: object) => api.post(`/ai-enhance/${versionId}`, body),
  accept: (enhancementId: string) => api.post(`/ai-enhance/${enhancementId}/accept`),
  history: (versionId: string) => api.get(`/ai-enhance/${versionId}/history`),
};

export const evalsApi = {
  createSuite: (promptId: string, body: object) => api.post(`/prompts/${promptId}/test-suites`, body),
  runEval: (suiteId: string, versionId: string, model: string) =>
    api.post(`/evals/runs`, { suiteId, versionId, model }),
  getResult: (runId: string) => api.get(`/evals/runs/${runId}`),
};

export const skillsApi = {
  list: () => api.get('/skills'),
  get: (id: string) => api.get(`/skills/${id}`),
  generate: (promptId: string) => api.post(`/skills/generate/${promptId}`),
  publish: (id: string) => api.post(`/skills/${id}/publish`),
};

export const marketplaceApi = {
  browse: (params: object) => api.get('/marketplace/packs', { params }),
  getPack: (id: string) => api.get(`/marketplace/packs/${id}`),
  purchase: (packId: string) => api.post(`/marketplace/packs/${packId}/purchase`),
  review: (packId: string, body: object) => api.post(`/marketplace/packs/${packId}/reviews`, body),
};
