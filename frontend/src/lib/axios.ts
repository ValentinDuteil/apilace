// axios.ts — Configured Axios instance for Apilace
// Handles base URL, CSRF header injection, and automatic access token refresh on 401

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3008/api',
  withCredentials: true, // required to send and receive HttpOnly cookies
})

// Request interceptor — attaches the XSRF-TOKEN cookie value as X-XSRF-TOKEN header
// The backend csrf.middleware.ts validates this header on every mutating request
api.interceptors.request.use((config) => {
  const xsrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]

  if (xsrfToken) {
    config.headers['X-XSRF-TOKEN'] = xsrfToken
  }

  return config
})

// Tracks whether a refresh is already in progress
// Prevents multiple concurrent 401s from each triggering a separate refresh call
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  })
  failedQueue = []
}

// Response interceptor — on 401, attempts to refresh the access token once
// If refresh succeeds, retries the original request transparently
// If refresh fails, clears the queue and lets the error propagate
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh on 401 and if not already retried
    if (error.response?.status !== 401 || originalRequest._retry || originalRequest._skipRefresh) {
      return Promise.reject(error)
    }

    // Queue concurrent requests while refresh is in progress
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(() => api(originalRequest))
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // Refresh sets new accessToken + XSRF-TOKEN cookies automatically
      await axios.post(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:3008/api'}/auth/refresh`,
        {},
        { withCredentials: true }
      )

      processQueue(null)
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError)
      // Redirect to login — session is fully expired
      window.location.href = '/connexion'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

// Extend Axios config to support custom flags used by interceptors
declare module 'axios' {
  export interface AxiosRequestConfig {
    _skipRefresh?: boolean
    _retry?: boolean
  }
  export interface InternalAxiosRequestConfig {
    _skipRefresh?: boolean
    _retry?: boolean
  }
}

export default api