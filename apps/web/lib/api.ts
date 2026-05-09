const DEFAULT_API_BASE_URL = 'http://localhost:4000/api'
const ACCESS_TOKEN_KEY = 'hi-dorri.accessToken'

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  token?: string | null
  skipAuth?: boolean
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_API_BASE_URL

export function getAccessToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }
}

export function clearAccessToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}) {
  const { body, headers, token, skipAuth = false, ...init } = options
  const requestHeaders = new Headers(headers)

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const accessToken = token ?? getAccessToken()
  if (!skipAuth && accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data, response.statusText), response.status, data)
  }

  return data as T
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('Content-Type')

  if (response.status === 204) {
    return null
  }

  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message: unknown }).message

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    if (typeof message === 'string') {
      return message
    }
  }

  return fallback || 'API request failed'
}
