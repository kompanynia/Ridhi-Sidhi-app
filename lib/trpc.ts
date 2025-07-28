import { createTRPCReact } from "@trpc/react-query";
import { httpLink, loggerLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  // Fallback for development
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return 'http://localhost:3000';
};

// Check if backend is available by testing connection
let backendAvailable: boolean | null = null;

export const isBackendAvailable = async (): Promise<boolean> => {
  if (backendAvailable !== null) {
    return backendAvailable;
  }

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      backendAvailable = data.status === 'ok';
    } else {
      backendAvailable = false;
    }
  } catch (error) {
    console.log('Backend not available, using local state only');
    backendAvailable = false;
  }

  return backendAvailable;
};

// Synchronous version for immediate checks
export const isBackendConfigured = () => {
  return Boolean(process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
};

// Create tRPC client with better error handling
const createTRPCClient = () => {
  return trpc.createClient({
    links: [
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === 'development' ||
          (opts.direction === 'down' && opts.result instanceof Error),
      }),
      httpLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        fetch: async (url, options) => {
          try {
            const response = await fetch(url, {
              ...options,
              headers: {
                ...options?.headers,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
            });
            
            // Check if response is HTML instead of JSON
            const contentType = response.headers.get('content-type');
            if (!response.ok || (contentType && !contentType.includes('application/json'))) {
              console.warn('Backend unavailable, falling back to local state');
              throw new Error('Backend unavailable');
            }
            
            return response;
          } catch (error) {
            console.warn('tRPC request failed, using local fallback');
            throw error;
          }
        },
      }),
    ],
  });
};

// Only create client if backend is configured
export const trpcClient = isBackendConfigured() ? createTRPCClient() : null;