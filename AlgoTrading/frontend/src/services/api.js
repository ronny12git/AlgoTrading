import axios from 'axios'

const api = axios.create({
  baseURL: 'https://algotrading-orr6.onrender.com',
  timeout: 30000,
})

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err?.response?.data || { error: 'Network error' })
)

export const portfolioApi = {
  get:         () => api.get('/portfolio'),
  deposit:     (amount) => api.post('/deposit', { amount }),
  transactions:(limit=50) => api.get(`/transactions?limit=${limit}`),
  deposits:    () => api.get('/deposits'),
}

export const aiApi = {
  signals:  () => api.get('/signals'),
  status:   () => api.get('/ai-status'),
  runCycle: () => api.post('/run-ai'),
}

export const marketApi = {
  indices:   () => api.get('/market/indices'),
  watchlist: () => api.get('/market/watchlist'),
}

export const healthApi = {
  check: () => api.get('/health'),
}