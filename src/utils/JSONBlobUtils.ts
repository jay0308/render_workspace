const JSONBlobUrlBaseUrl = "https://jsonblob.com/api/jsonBlob/";

export enum BlobType {
  MVP_DATA = 'MVP_DATA',
  CONFIG_DATA = 'CONFIG_DATA',
  TEAM_STATS = 'TEAM_STATS'
}

const BLOB_IDS: Record<BlobType, string> = {
  [BlobType.MVP_DATA]: "1379082578547630080", // Current MVP data
  [BlobType.CONFIG_DATA]: "1381995549015859200", // Add your config blob ID here
  [BlobType.TEAM_STATS]: "", // Add your team stats blob ID here
};

export const getJSONBlobUrl = (blobType: BlobType) => {
  const blobId = BLOB_IDS[blobType];
  if (!blobId) {
    throw new Error(`Blob ID not configured for type: ${blobType}`);
  }
  return `${JSONBlobUrlBaseUrl}${blobId}`;
};

export async function getJSONBlob(blobType: BlobType) {
  const res = await fetch(getJSONBlobUrl(blobType));
  if (!res.ok) throw new Error(`Failed to fetch JSONBlob for ${blobType}: ${res.status}`);
  return res.json();
}

export async function updateJSONBlob(blobType: BlobType, data: any) {
  console.log(`Updating JSONBlob (${blobType}) with data:`, JSON.stringify(data));
  const res = await fetch(getJSONBlobUrl(blobType), {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`JSONBlob update failed for ${blobType}:`, {
      status: res.status,
      statusText: res.statusText,
      error: errorText
    });
    throw new Error(`Failed to update JSONBlob for ${blobType}: ${res.status} - ${errorText}`);
  }
  
  const response = await res.json();
  console.log(`JSONBlob update response for ${blobType}:`, JSON.stringify(response));
  return response;
}

// Convenience functions for each blob type
export const getMVPData = () => getJSONBlob(BlobType.MVP_DATA);
export const updateMVPData = (data: any) => updateJSONBlob(BlobType.MVP_DATA, data);

export const getConfigData = () => getJSONBlob(BlobType.CONFIG_DATA);
export const updateConfigData = (data: any) => updateJSONBlob(BlobType.CONFIG_DATA, data);

export const getTeamStats = () => getJSONBlob(BlobType.TEAM_STATS);
export const updateTeamStats = (data: any) => updateJSONBlob(BlobType.TEAM_STATS, data);

// Utility function to update blob IDs (for configuration purposes)
export const setBlobId = (blobType: BlobType, blobId: string) => {
  BLOB_IDS[blobType] = blobId;
};

// Function to get current blob ID for a type
export const getBlobId = (blobType: BlobType): string => {
  return BLOB_IDS[blobType];
};

// Function to get all blob types and their IDs
export const getAllBlobIds = (): Record<BlobType, string> => {
  return { ...BLOB_IDS };
};

