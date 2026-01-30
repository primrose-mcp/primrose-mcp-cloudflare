/**
 * Environment Bindings
 *
 * Type definitions for Cloudflare Worker environment variables and bindings.
 *
 * MULTI-TENANT ARCHITECTURE:
 * This server supports multiple tenants. Tenant-specific credentials (API tokens,
 * API keys, etc.) are passed via request headers, NOT stored in wrangler
 * secrets. This allows a single server instance to serve multiple customers.
 *
 * Request Headers:
 * - X-CF-API-Token: Cloudflare API token (recommended)
 * - X-CF-API-Email: Email for legacy API key authentication
 * - X-CF-API-Key: Legacy global API key
 * - X-CF-Account-ID: Account ID for account-scoped operations
 */

// =============================================================================
// Tenant Credentials (parsed from request headers)
// =============================================================================

export interface TenantCredentials {
  /** Cloudflare API Token (from X-CF-API-Token header) - recommended */
  apiToken?: string;

  /** Email for legacy API key auth (from X-CF-API-Email header) */
  email?: string;

  /** Legacy global API key (from X-CF-API-Key header) */
  apiKey?: string;

  /** Account ID for account-scoped operations (from X-CF-Account-ID header) */
  accountId?: string;
}

/**
 * Parse tenant credentials from request headers
 */
export function parseTenantCredentials(request: Request): TenantCredentials {
  const headers = request.headers;

  return {
    apiToken: headers.get('X-CF-API-Token') || undefined,
    email: headers.get('X-CF-API-Email') || undefined,
    apiKey: headers.get('X-CF-API-Key') || undefined,
    accountId: headers.get('X-CF-Account-ID') || undefined,
  };
}

/**
 * Validate that required credentials are present
 */
export function validateCredentials(credentials: TenantCredentials): void {
  const hasApiToken = !!credentials.apiToken;
  const hasLegacyAuth = !!credentials.email && !!credentials.apiKey;

  if (!hasApiToken && !hasLegacyAuth) {
    throw new Error(
      'Missing credentials. Provide either X-CF-API-Token header, or both X-CF-API-Email and X-CF-API-Key headers.'
    );
  }
}

// =============================================================================
// Environment Configuration (from wrangler.jsonc vars and bindings)
// =============================================================================

export interface Env {
  // ===========================================================================
  // Environment Variables (from wrangler.jsonc vars)
  // ===========================================================================

  /** Maximum character limit for responses */
  CHARACTER_LIMIT: string;

  /** Default page size for list operations */
  DEFAULT_PAGE_SIZE: string;

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: string;

  // ===========================================================================
  // Bindings
  // ===========================================================================

  /** KV namespace for caching (optional) */
  CACHE_KV?: KVNamespace;

  /** Durable Object namespace for MCP sessions */
  MCP_SESSIONS?: DurableObjectNamespace;

  /** Cloudflare AI binding (optional) */
  AI?: Ai;
}

// ===========================================================================
// Helper Functions
// ===========================================================================

/**
 * Get a numeric environment value with a default
 */
export function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Get the character limit from environment
 */
export function getCharacterLimit(env: Env): number {
  return getEnvNumber(env, 'CHARACTER_LIMIT', 50000);
}

/**
 * Get the default page size from environment
 */
export function getDefaultPageSize(env: Env): number {
  return getEnvNumber(env, 'DEFAULT_PAGE_SIZE', 20);
}

/**
 * Get the maximum page size from environment
 */
export function getMaxPageSize(env: Env): number {
  return getEnvNumber(env, 'MAX_PAGE_SIZE', 100);
}
