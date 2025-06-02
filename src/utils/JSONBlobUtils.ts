const JSONBlobUrlBaseUrl = "https://jsonblob.com/api/jsonBlob/";
const blobId = "1379082578547630080"
export const getJSONBlobUrl = () => {
  return `${JSONBlobUrlBaseUrl}${blobId}`;
};

export async function getJSONBlob() {
  const res = await fetch(getJSONBlobUrl());
  if (!res.ok) throw new Error(`Failed to fetch JSONBlob: ${res.status}`);
  return res.json();
}

export async function updateJSONBlob(data: any) {
  const res = await fetch(getJSONBlobUrl(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update JSONBlob: ${res.status}`);
  return res.json();
}

