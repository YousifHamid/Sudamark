import { getApiUrl } from "./query-client";

/**
 * Ensures an image URI is correctly formatted for React Native Image.
 * Handles:
 * 1. Full URLs (http/https)
 * 2. Data URIs (data:image/...)
 * 3. Raw Base64 strings (starting with / or other base64 chars)
 * 4. Local server paths (/uploads/...)
 */
export function formatImageUri(uri: string | null | undefined): string | null {
    if (!uri) return null;

    // 1. Full URL
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
        return uri;
    }

    // 2. Data URI
    if (uri.startsWith("data:")) {
        return uri;
    }

    // 3. Raw Base64 check
    // If it's a long string and doesn't look like a path, treat as raw base64
    // Typical paths start with /uploads or similar. 
    // Base64 often starts with / or letters.
    if (uri.length > 500 && !uri.startsWith("/")) {
        return `data:image/jpeg;base64,${uri}`;
    }

    // Special case: some base64 starts with / (e.g. /9j/...)
    if (uri.startsWith("/") && uri.length > 1000) {
        return `data:image/jpeg;base64,${uri}`;
    }

    // 4. Local server path
    const baseUrl = getApiUrl().replace(/\/$/, "");
    const path = uri.startsWith("/") ? uri : `/${uri}`;
    return `${baseUrl}${path}`;
}
