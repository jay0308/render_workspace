export async function fetchCricheroesDataViaCorsProxy(url: string): Promise<any> {
  // Use a public CORS proxy for personal/testing use only
  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch page: ${res.status}`);
  }
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match || !match[1]) {
    throw new Error("__NEXT_DATA__ not found");
  }
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    throw new Error("Failed to parse __NEXT_DATA__ JSON");
  }
} 