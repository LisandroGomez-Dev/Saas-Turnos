const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
    body:
      options.body && typeof options.body === 'object'
        ? JSON.stringify(options.body)
        : (options.body as BodyInit | undefined),
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorBody: Record<string, unknown> = {};
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { message: response.statusText };
    }

    const message =
      (errorBody.detail as string) ||
      (errorBody.message as string) ||
      'Ocurrió un error al procesar la solicitud';

    throw new ApiError(response.status, message, errorBody);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

