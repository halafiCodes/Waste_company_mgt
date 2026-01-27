const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api").replace(/\/$/, "")

export type Tokens = {
  access: string
  refresh: string
}

export type ApiUser = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  user_type: "central_authority" | "waste_company" | "resident"
  role?: {
    id?: number
    name?: string
    slug?: string
    description?: string
  }
}

export type AuthResponse = {
  user: ApiUser
  tokens: Tokens
}

const STORAGE_KEY = "aacma.auth"

const isBrowser = typeof window !== "undefined"

export function getStoredTokens(): Tokens | null {
  if (!isBrowser) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch (err) {
    console.error("Failed to read tokens", err)
    return null
  }
}

export function storeTokens(tokens: Tokens) {
  if (!isBrowser) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

export function clearTokens() {
  if (!isBrowser) return
  window.localStorage.removeItem(STORAGE_KEY)
}

async function refreshAccessToken(refresh: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })
  if (!res.ok) {
    throw new Error("Session expired")
  }
  const json = (await res.json()) as { access: string }
  return json.access
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; retry?: boolean } = { auth: true, retry: false }
): Promise<T> {
  const tokens = getStoredTokens()
  const headers = new Headers(init.headers || {})
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData
  if (!headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json")
  }

  if (options.auth !== false && tokens?.access) {
    headers.set("Authorization", `Bearer ${tokens.access}`)
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  if (res.status === 401 && options.auth !== false && tokens?.refresh && !options.retry) {
    try {
      const newAccess = await refreshAccessToken(tokens.refresh)
      storeTokens({ ...tokens, access: newAccess })
      return apiRequest<T>(path, init, { ...options, retry: true })
    } catch (err) {
      clearTokens()
      throw err
    }
  }

  if (!res.ok) {
    let message = "Request failed"
    try {
      const data = (await res.json()) as { detail?: string; error?: string; message?: string }
      message = data.detail || data.error || data.message || message
    } catch (err) {
      // fall back to status text
      message = res.statusText || message
    }
    throw new Error(message)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
}

export async function login(payload: { username: string; password: string }): Promise<AuthResponse> {
  const trimmed = {
    username: payload.username?.trim?.() ?? payload.username,
    password: payload.password?.trim?.() ?? payload.password,
  }
  return apiRequest<AuthResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify(trimmed),
  }, { auth: false })
}

export async function register(payload: {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  address?: string
  zone?: number | null
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { auth: false })
}

export async function fetchMe(): Promise<ApiUser> {
  return apiRequest<ApiUser>("/auth/me/")
}

export async function authorizedGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path)
}

export async function publicGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, {}, { auth: false })
}

export async function authorizedPost<T>(path: string, body: any): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function authorizedPostForm<T>(path: string, body: FormData): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body,
  })
}

export async function authorizedPut<T>(path: string, body: any): Promise<T> {
  return apiRequest<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
  })
}
