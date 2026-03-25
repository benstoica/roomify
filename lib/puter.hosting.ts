import puter from "@heyputer/puter.js";
import {
  createHostingSlug,
  fetchBlobFromUrl,
  getHostedUrl,
  getImageExtension,
  HOSTING_CONFIG_KEY,
  imageUrlToPngBlob,
  isHostedUrl,
} from "./utils";

const sanitizePathSegment = (segment: string): string =>
  segment.replace(/[^a-zA-Z0-9_-]/g, "");

export const getOrCreateHostingConfig =
  async (): Promise<HostingConfig | null> => {
    try {
      if (!puter?.kv || !puter?.hosting) {
        return null;
      }

      const existing = (await puter.kv.get(
        HOSTING_CONFIG_KEY,
      )) as HostingConfig | null;

      if (existing?.subdomain) {
        return {
          subdomain: existing.subdomain,
        };
      }

      const subdomain = createHostingSlug();
      const created = await puter.hosting.create(subdomain, ".");
      const config = { subdomain: created.subdomain };
      await puter.kv.set(HOSTING_CONFIG_KEY, config);
      return config;
    } catch (e) {
      console.warn("Could not create hosting subdomain", e);
      return null;
    }
  };

export const uploadImageToHosting = async ({
  hosting,
  url,
  projectId,
  label,
}: StoreHostedImageParams): Promise<HostedAsset | null> => {
  const safeProjectId = sanitizePathSegment(projectId);
  if (!safeProjectId) {
    return null;
  }

  if (!hosting || !url) {
    return null;
  }

  if (!puter?.fs) {
    return null;
  }

  if (isHostedUrl(url)) {
    return { url };
  }

  try {
    const resolved =
      label === "rendered"
        ? await imageUrlToPngBlob(url).then((blob) =>
            blob ? { blob, contentType: "image/png" } : null,
          )
        : await fetchBlobFromUrl(url);

    if (!resolved) {
      return null;
    }

    const contentType = resolved.contentType || resolved.blob.type || "";
    const ext = getImageExtension(contentType, url);
    const dir = `projects/${safeProjectId}`;
    const filePath = `${dir}/${label}.${ext}`;

    const uploadFile = new File([resolved.blob], `${label}.${ext}`, {
      type: contentType,
    });

    await puter.fs.mkdir(dir, { createMissingParents: true });
    await puter.fs.write(filePath, uploadFile);

    const hostedUrl = getHostedUrl({ subdomain: hosting.subdomain }, filePath);
    return hostedUrl ? { url: hostedUrl } : null;
  } catch (e) {
    console.warn("Failed to store hosted image", e);
    return null;
  }
};
