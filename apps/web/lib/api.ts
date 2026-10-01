const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let body: { error?: { code?: string; message?: string } } = {};
    try { body = await res.json(); } catch {}
    throw new ApiError(
      res.status,
      body.error?.code ?? 'UNKNOWN_ERROR',
      body.error?.message ?? 'An error occurred.',
    );
  }

  // Handle PDF/binary responses
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('application/pdf') || contentType.includes('text/csv')) {
    return res.blob() as unknown as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, formData: FormData) =>
    apiFetch<T>(path, { method: 'POST', body: formData }),
};
