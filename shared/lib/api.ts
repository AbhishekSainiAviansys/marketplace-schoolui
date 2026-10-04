/**
 * Shared axios client. One instance for all three panels.
 *
 * API_URL is read from each app's own .env (Vite only exposes VITE_* vars from
 * the app root), so the fallback is identical to the old per-app value.
 */
import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api/v1'

/** Origin of the API (no trailing slash, no /api/v1) - used for /storage/... files. */
export const apiOrigin = () => API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token')
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

// Expired/revoked token -> drop the stale session so the UI falls back to /login
// instead of rendering a broken shell full of failed requests.
// The backend returns 401 (not 500) for guarded routes, so this reliably fires.
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && location.pathname !== '/login') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      location.replace('/login')
    }
    return Promise.reject(err)
  },
)

/** Normalised message from an axios error. */
export const errMsg = (e: unknown, fallback = 'Something went wrong') => {
  const ax = e as { response?: { data?: { message?: string } }; message?: string }
  return ax?.response?.data?.message || ax?.message || fallback
}

/* ---------------------------------------------------------------------------
 * Response-shape helpers.
 *
 * The API is inconsistent on purpose-free: list endpoints such as
 * /admin/vendors return a Laravel paginator ({ data, total, last_page, ... })
 * while /categories returns a plain array. Normalising here stops every screen
 * from re-guarding the same two shapes.
 * ------------------------------------------------------------------------ */
export type Paged<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

/** True when the payload looks like a Laravel paginator. */
export const isPaged = (r: unknown): r is Paged<unknown> =>
  !!r && typeof r === 'object' && Array.isArray((r as Paged<unknown>).data)

/** Rows for a paginator OR a bare array. */
export const rowsOf = <T,>(r: unknown): T[] => {
  if (Array.isArray(r)) return r as T[]
  if (isPaged(r)) return r.data as T[]
  return []
}

/** Pagination meta, with safe defaults for bare-array responses. */
export const metaOf = (r: unknown) => {
  if (isPaged(r)) {
    return {
      page: r.current_page ?? 1,
      lastPage: Math.max(1, r.last_page ?? 1),
      total: r.total ?? r.data?.length ?? 0,
    }
  }
  const n = Array.isArray(r) ? r.length : 0
  return { page: 1, lastPage: 1, total: n }
}
