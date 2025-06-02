export async function get<T = any>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      ...options,
    });
    if (!res.ok) {
      throw new Error(`GET ${url} failed: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function post<T = any>(url: string, body: any, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      body: JSON.stringify(body),
      ...options,
    });
    if (!res.ok) {
      throw new Error(`POST ${url} failed: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
} 