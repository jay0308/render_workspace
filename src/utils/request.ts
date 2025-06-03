export async function get<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  if (typeof window !== "undefined") {
    const profileId = localStorage.getItem("cricheroes_profile_id");
    if (profileId) headers["x-profile-id"] = profileId;
  }
  try {
    const res = await fetch(url, {
      method: 'GET',
      ...options,
      headers,
    });
    if (!res.ok) {
      throw new Error(`GET ${url} failed: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    throw error;
  }
}

export async function post<T = unknown>(url: string, body: unknown, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (typeof window !== "undefined") {
    const profileId = localStorage.getItem("cricheroes_profile_id");
    if (profileId) headers["x-profile-id"] = profileId;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
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