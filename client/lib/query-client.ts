import { QueryClient, QueryFunction } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_STORAGE_KEY = "@sudamark_token";

export function getApiUrl(): string {
  // return "https://sudamark.up.railway.app/"; // Safe fallback
  let host = process.env.EXPO_PUBLIC_DOMAIN;

  if (!host) {
    // Fallback for development if not set
    if (__DEV__) {
      // NOTE: Update this IP address to your machine's local IP (check with 'ipconfig' or 'ifconfig')
      // return "http://10.93.38.105:5000/"; 
      return "https://sudamark.up.railway.app/";
    }
    console.warn("EXPO_PUBLIC_DOMAIN is not set");
    return "https://sudamark.up.railway.app/"; // Safe fallback
  }

  // If the host already includes the protocol, return it as is
  if (host.startsWith("http://") || host.startsWith("https://")) {
    return host.endsWith("/") ? host : `${host}/`;
  }

  // Otherwise default to https
  return `https://${host}/`;
}

type AuthEventType = 'unauthorized' | 'forbidden';
type AuthEventHandler = (data?: any) => void;
const listeners: Record<AuthEventType, AuthEventHandler[]> = {
  unauthorized: [],
  forbidden: []
};

export const authEvents = {
  on: (event: AuthEventType, handler: AuthEventHandler) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(handler);
  },
  off: (event: AuthEventType, handler: AuthEventHandler) => {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(h => h !== handler);
  },
  emit: (event: AuthEventType, data?: any) => {
    if (!listeners[event]) return;
    listeners[event].forEach(h => h(data));
  }
};

async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;

    // Check for specific auth errors
    if (res.status === 403 && text.includes("ACCOUNT_BLOCKED")) {
      authEvents.emit('forbidden', 'ACCOUNT_BLOCKED');
    }

    if (res.status === 401) {
      if (text.includes("USER_DELETED")) {
        authEvents.emit('forbidden', 'USER_DELETED');
      } else if (text.includes("ACCOUNT_BLOCKED")) {
        authEvents.emit('forbidden', 'ACCOUNT_BLOCKED');
      } else {
        authEvents.emit('unauthorized');
      }
    }

    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const token = await getAuthToken();

  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const baseUrl = getApiUrl();
      const url = new URL(queryKey.join("/") as string, baseUrl);
      const token = await getAuthToken();

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
