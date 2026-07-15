import Cookies from "js-cookie";
import axiosInstance from "@/api/axiosInstance";

/** Parse ``mxc://server/mediaId`` into path parts. */
export function parseMxcUrl(mxc: string): { server: string; mediaId: string } | null {
  if (!mxc?.startsWith("mxc://")) return null;
  const rest = mxc.slice("mxc://".length);
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  return {
    server: rest.slice(0, slash),
    mediaId: rest.slice(slash + 1),
  };
}

export async function uploadMatrixMedia(file: File): Promise<string> {
  const accessToken = Cookies.get("synapse_access_token");
  if (!accessToken) {
    throw new Error("Matrix access token missing");
  }
  const form = new FormData();
  form.append("file", file);

  const { data } = await axiosInstance.post<{ content_uri: string }>(
    "/synapse/media/upload",
    form,
    {
      headers: {
        "Synapse-Authorization": `Bearer ${accessToken}`,
        // Let the browser set multipart boundary (do not force form-urlencoded).
        "Content-Type": undefined as unknown as string,
      },
      timeout: 60_000,
    }
  );
  if (!data.content_uri) {
    throw new Error("Upload returned no content_uri");
  }
  return data.content_uri;
}

/** Upload an image and set it as the caller's Matrix profile avatar. */
export async function uploadAndSetMatrixAvatar(file: File): Promise<string> {
  const contentUri = await uploadMatrixMedia(file);
  const accessToken = Cookies.get("synapse_access_token");
  if (!accessToken) {
    throw new Error("Matrix access token missing");
  }
  const { data } = await axiosInstance.put<{ avatar_url: string }>(
    "/synapse/profile/avatar",
    { avatar_url: contentUri },
    {
      headers: {
        "Content-Type": "application/json",
        "Synapse-Authorization": `Bearer ${accessToken}`,
      },
    }
  );
  return data.avatar_url || contentUri;
}

/** Fetch authenticated Matrix media as a blob object URL. */
export async function fetchMatrixMediaObjectUrl(mxc: string): Promise<string> {
  const parts = parseMxcUrl(mxc);
  if (!parts) {
    throw new Error("Invalid mxc URL");
  }
  const accessToken = Cookies.get("synapse_access_token");
  if (!accessToken) {
    throw new Error("Matrix access token missing");
  }
  const { data } = await axiosInstance.get<Blob>(
    `/synapse/media/${encodeURIComponent(parts.server)}/${encodeURIComponent(parts.mediaId)}`,
    {
      headers: {
        "Synapse-Authorization": `Bearer ${accessToken}`,
      },
      responseType: "blob",
      timeout: 60_000,
    }
  );
  return URL.createObjectURL(data);
}
