/**
 * Cloudflare API Client
 *
 * This file handles all HTTP communication with the Cloudflare API v4.
 *
 * MULTI-TENANT: This client receives credentials per-request via TenantCredentials,
 * allowing a single server to serve multiple tenants with different API tokens.
 *
 * API Reference: https://developers.cloudflare.com/api/
 */

import type {
  Account,
  AccountMember,
  CachePurgeResult,
  CloudflareResponse,
  D1Database,
  D1QueryResult,
  DnsRecord,
  DnsRecordCreateInput,
  DnsRecordUpdateInput,
  Filter,
  FirewallRule,
  FirewallRuleCreateInput,
  KvKey,
  KvNamespace,
  LoadBalancer,
  LoadBalancerMonitor,
  LoadBalancerPool,
  PagesDeployment,
  PagesProject,
  PaginatedResponse,
  PaginationParams,
  R2Bucket,
  ResultInfo,
  SslCertificate,
  User,
  WafPackage,
  WafRule,
  Worker,
  WorkerCronTrigger,
  WorkerRoute,
  WorkerSecret,
  Zone,
  ZoneAnalytics,
  ZoneCreateInput,
  ZoneUpdateInput,
} from './types/cloudflare.js';
import type { TenantCredentials } from './types/env.js';
import { AuthenticationError, CloudflareApiError, RateLimitError } from './utils/errors.js';
import { createPaginatedResponse, normalizePaginationParams } from './utils/pagination.js';

// =============================================================================
// Configuration
// =============================================================================

const API_BASE_URL = 'https://api.cloudflare.com/client/v4';

// =============================================================================
// Cloudflare Client Interface
// =============================================================================

export interface CloudflareClient {
  // Connection
  testConnection(): Promise<{ connected: boolean; message: string }>;

  // User & Account
  getUser(): Promise<User>;
  listAccounts(params?: PaginationParams): Promise<PaginatedResponse<Account>>;
  getAccount(accountId: string): Promise<Account>;
  listAccountMembers(
    accountId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<AccountMember>>;

  // Zones
  listZones(
    params?: PaginationParams & { name?: string; status?: string }
  ): Promise<PaginatedResponse<Zone>>;
  getZone(zoneId: string): Promise<Zone>;
  createZone(input: ZoneCreateInput): Promise<Zone>;
  updateZone(zoneId: string, input: ZoneUpdateInput): Promise<Zone>;
  deleteZone(zoneId: string): Promise<{ id: string }>;
  getZoneSettings(zoneId: string): Promise<Record<string, unknown>[]>;
  updateZoneSetting(
    zoneId: string,
    settingId: string,
    value: unknown
  ): Promise<Record<string, unknown>>;
  activationCheck(zoneId: string): Promise<{ id: string }>;

  // DNS Records
  listDnsRecords(
    zoneId: string,
    params?: PaginationParams & { type?: string; name?: string; content?: string }
  ): Promise<PaginatedResponse<DnsRecord>>;
  getDnsRecord(zoneId: string, recordId: string): Promise<DnsRecord>;
  createDnsRecord(zoneId: string, input: DnsRecordCreateInput): Promise<DnsRecord>;
  updateDnsRecord(zoneId: string, recordId: string, input: DnsRecordUpdateInput): Promise<DnsRecord>;
  deleteDnsRecord(zoneId: string, recordId: string): Promise<{ id: string }>;
  exportDnsRecords(zoneId: string): Promise<string>;
  importDnsRecords(zoneId: string, file: string): Promise<{ total_records_parsed: number }>;

  // Cache
  purgeCache(
    zoneId: string,
    params: { purge_everything?: boolean; files?: string[]; tags?: string[]; hosts?: string[] }
  ): Promise<CachePurgeResult>;

  // Workers
  listWorkers(accountId: string): Promise<Worker[]>;
  getWorker(accountId: string, scriptName: string): Promise<string>;
  deleteWorker(accountId: string, scriptName: string): Promise<void>;
  listWorkerRoutes(zoneId: string): Promise<WorkerRoute[]>;
  createWorkerRoute(zoneId: string, pattern: string, script?: string): Promise<WorkerRoute>;
  deleteWorkerRoute(zoneId: string, routeId: string): Promise<void>;
  getWorkerCronTriggers(accountId: string, scriptName: string): Promise<WorkerCronTrigger[]>;
  listWorkerSecrets(accountId: string, scriptName: string): Promise<WorkerSecret[]>;

  // KV Namespaces
  listKvNamespaces(accountId: string, params?: PaginationParams): Promise<PaginatedResponse<KvNamespace>>;
  getKvNamespace(accountId: string, namespaceId: string): Promise<KvNamespace>;
  createKvNamespace(accountId: string, title: string): Promise<KvNamespace>;
  renameKvNamespace(accountId: string, namespaceId: string, title: string): Promise<void>;
  deleteKvNamespace(accountId: string, namespaceId: string): Promise<void>;
  listKvKeys(
    accountId: string,
    namespaceId: string,
    params?: { prefix?: string; cursor?: string; limit?: number }
  ): Promise<{ keys: KvKey[]; cursor?: string; list_complete: boolean }>;
  getKvValue(accountId: string, namespaceId: string, key: string): Promise<string>;
  putKvValue(
    accountId: string,
    namespaceId: string,
    key: string,
    value: string,
    options?: { expiration?: number; expiration_ttl?: number; metadata?: Record<string, unknown> }
  ): Promise<void>;
  deleteKvValue(accountId: string, namespaceId: string, key: string): Promise<void>;

  // D1 Databases
  listD1Databases(accountId: string, params?: PaginationParams): Promise<PaginatedResponse<D1Database>>;
  getD1Database(accountId: string, databaseId: string): Promise<D1Database>;
  createD1Database(accountId: string, name: string): Promise<D1Database>;
  deleteD1Database(accountId: string, databaseId: string): Promise<void>;
  queryD1Database(accountId: string, databaseId: string, sql: string, params?: unknown[]): Promise<D1QueryResult[]>;

  // R2 Storage
  listR2Buckets(accountId: string): Promise<R2Bucket[]>;
  getR2Bucket(accountId: string, bucketName: string): Promise<R2Bucket>;
  createR2Bucket(accountId: string, name: string, locationHint?: string): Promise<R2Bucket>;
  deleteR2Bucket(accountId: string, bucketName: string): Promise<void>;

  // Pages
  listPagesProjects(accountId: string): Promise<PagesProject[]>;
  getPagesProject(accountId: string, projectName: string): Promise<PagesProject>;
  createPagesProject(
    accountId: string,
    name: string,
    productionBranch?: string
  ): Promise<PagesProject>;
  deletePagesProject(accountId: string, projectName: string): Promise<void>;
  listPagesDeployments(
    accountId: string,
    projectName: string
  ): Promise<PagesDeployment[]>;
  getPagesDeployment(
    accountId: string,
    projectName: string,
    deploymentId: string
  ): Promise<PagesDeployment>;
  deletePagesDeployment(
    accountId: string,
    projectName: string,
    deploymentId: string
  ): Promise<void>;
  rollbackPagesDeployment(
    accountId: string,
    projectName: string,
    deploymentId: string
  ): Promise<PagesDeployment>;

  // SSL/TLS Certificates
  listSslCertificates(zoneId: string): Promise<SslCertificate[]>;

  // Firewall Rules
  listFirewallRules(zoneId: string): Promise<FirewallRule[]>;
  getFirewallRule(zoneId: string, ruleId: string): Promise<FirewallRule>;
  createFirewallRule(zoneId: string, input: FirewallRuleCreateInput): Promise<FirewallRule[]>;
  updateFirewallRule(
    zoneId: string,
    ruleId: string,
    input: Partial<FirewallRuleCreateInput>
  ): Promise<FirewallRule>;
  deleteFirewallRule(zoneId: string, ruleId: string): Promise<void>;
  listFilters(zoneId: string): Promise<Filter[]>;

  // WAF
  listWafPackages(zoneId: string): Promise<WafPackage[]>;
  listWafRules(zoneId: string, packageId: string): Promise<WafRule[]>;
  updateWafRule(zoneId: string, packageId: string, ruleId: string, mode: string): Promise<WafRule>;

  // Load Balancers
  listLoadBalancers(zoneId: string): Promise<LoadBalancer[]>;
  getLoadBalancer(zoneId: string, lbId: string): Promise<LoadBalancer>;
  listLoadBalancerPools(accountId: string): Promise<LoadBalancerPool[]>;
  getLoadBalancerPool(accountId: string, poolId: string): Promise<LoadBalancerPool>;
  listLoadBalancerMonitors(accountId: string): Promise<LoadBalancerMonitor[]>;

  // Analytics
  getZoneAnalytics(
    zoneId: string,
    since?: string,
    until?: string
  ): Promise<ZoneAnalytics>;
  getDnsAnalytics(
    zoneId: string,
    dimensions?: string[],
    metrics?: string[],
    since?: string,
    until?: string
  ): Promise<Record<string, unknown>>;
}

// =============================================================================
// Cloudflare Client Implementation
// =============================================================================

class CloudflareClientImpl implements CloudflareClient {
  private credentials: TenantCredentials;

  constructor(credentials: TenantCredentials) {
    this.credentials = credentials;
  }

  // ===========================================================================
  // HTTP Request Helper
  // ===========================================================================

  private getAuthHeaders(): Record<string, string> {
    // API Token authentication (recommended)
    if (this.credentials.apiToken) {
      return {
        Authorization: `Bearer ${this.credentials.apiToken}`,
        'Content-Type': 'application/json',
      };
    }

    // Legacy API Key authentication
    if (this.credentials.email && this.credentials.apiKey) {
      return {
        'X-Auth-Email': this.credentials.email,
        'X-Auth-Key': this.credentials.apiKey,
        'Content-Type': 'application/json',
      };
    }

    throw new AuthenticationError(
      'No credentials provided. Include X-CF-API-Token header, or both X-CF-API-Email and X-CF-API-Key headers.'
    );
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<CloudflareResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError('Rate limit exceeded', retryAfter ? parseInt(retryAfter, 10) : 60);
    }

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError('Authentication failed. Check your API credentials.');
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true, errors: [], messages: [], result: undefined as T };
    }

    const data = (await response.json()) as CloudflareResponse<T>;

    // Handle API errors
    if (!data.success) {
      const errorMessage = data.errors?.[0]?.message || 'Unknown Cloudflare API error';
      throw new CloudflareApiError(errorMessage, response.status);
    }

    return data;
  }

  private async requestRaw(endpoint: string, options: RequestInit = {}): Promise<string> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError('Rate limit exceeded', retryAfter ? parseInt(retryAfter, 10) : 60);
    }

    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError('Authentication failed. Check your API credentials.');
    }

    if (!response.ok) {
      throw new CloudflareApiError(`API error: ${response.status}`, response.status);
    }

    return response.text();
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      const user = await this.getUser();
      return { connected: true, message: `Connected as ${user.email}` };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // ===========================================================================
  // User & Account
  // ===========================================================================

  async getUser(): Promise<User> {
    const response = await this.request<User>('/user');
    return response.result;
  }

  async listAccounts(params?: PaginationParams): Promise<PaginatedResponse<Account>> {
    const normalized = normalizePaginationParams(params);
    const queryParams = new URLSearchParams({
      page: String(normalized.page),
      per_page: String(normalized.per_page),
    });

    const response = await this.request<Account[]>(`/accounts?${queryParams}`);
    return createPaginatedResponse(response.result, response.result_info);
  }

  async getAccount(accountId: string): Promise<Account> {
    const response = await this.request<Account>(`/accounts/${accountId}`);
    return response.result;
  }

  async listAccountMembers(
    accountId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<AccountMember>> {
    const normalized = normalizePaginationParams(params);
    const queryParams = new URLSearchParams({
      page: String(normalized.page),
      per_page: String(normalized.per_page),
    });

    const response = await this.request<AccountMember[]>(
      `/accounts/${accountId}/members?${queryParams}`
    );
    return createPaginatedResponse(response.result, response.result_info);
  }

  // ===========================================================================
  // Zones
  // ===========================================================================

  async listZones(
    params?: PaginationParams & { name?: string; status?: string }
  ): Promise<PaginatedResponse<Zone>> {
    const normalized = normalizePaginationParams(params);
    const queryParams = new URLSearchParams({
      page: String(normalized.page),
      per_page: String(normalized.per_page),
    });
    if (params?.name) queryParams.set('name', params.name);
    if (params?.status) queryParams.set('status', params.status);

    const response = await this.request<Zone[]>(`/zones?${queryParams}`);
    return createPaginatedResponse(response.result, response.result_info);
  }

  async getZone(zoneId: string): Promise<Zone> {
    const response = await this.request<Zone>(`/zones/${zoneId}`);
    return response.result;
  }

  async createZone(input: ZoneCreateInput): Promise<Zone> {
    const response = await this.request<Zone>('/zones', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.result;
  }

  async updateZone(zoneId: string, input: ZoneUpdateInput): Promise<Zone> {
    const response = await this.request<Zone>(`/zones/${zoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return response.result;
  }

  async deleteZone(zoneId: string): Promise<{ id: string }> {
    const response = await this.request<{ id: string }>(`/zones/${zoneId}`, {
      method: 'DELETE',
    });
    return response.result;
  }

  async getZoneSettings(zoneId: string): Promise<Record<string, unknown>[]> {
    const response = await this.request<Record<string, unknown>[]>(`/zones/${zoneId}/settings`);
    return response.result;
  }

  async updateZoneSetting(
    zoneId: string,
    settingId: string,
    value: unknown
  ): Promise<Record<string, unknown>> {
    const response = await this.request<Record<string, unknown>>(
      `/zones/${zoneId}/settings/${settingId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ value }),
      }
    );
    return response.result;
  }

  async activationCheck(zoneId: string): Promise<{ id: string }> {
    const response = await this.request<{ id: string }>(`/zones/${zoneId}/activation_check`, {
      method: 'PUT',
    });
    return response.result;
  }

  // ===========================================================================
  // DNS Records
  // ===========================================================================

  async listDnsRecords(
    zoneId: string,
    params?: PaginationParams & { type?: string; name?: string; content?: string }
  ): Promise<PaginatedResponse<DnsRecord>> {
    const normalized = normalizePaginationParams(params);
    const queryParams = new URLSearchParams({
      page: String(normalized.page),
      per_page: String(normalized.per_page),
    });
    if (params?.type) queryParams.set('type', params.type);
    if (params?.name) queryParams.set('name', params.name);
    if (params?.content) queryParams.set('content', params.content);

    const response = await this.request<DnsRecord[]>(`/zones/${zoneId}/dns_records?${queryParams}`);
    return createPaginatedResponse(response.result, response.result_info);
  }

  async getDnsRecord(zoneId: string, recordId: string): Promise<DnsRecord> {
    const response = await this.request<DnsRecord>(`/zones/${zoneId}/dns_records/${recordId}`);
    return response.result;
  }

  async createDnsRecord(zoneId: string, input: DnsRecordCreateInput): Promise<DnsRecord> {
    const response = await this.request<DnsRecord>(`/zones/${zoneId}/dns_records`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.result;
  }

  async updateDnsRecord(
    zoneId: string,
    recordId: string,
    input: DnsRecordUpdateInput
  ): Promise<DnsRecord> {
    const response = await this.request<DnsRecord>(`/zones/${zoneId}/dns_records/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return response.result;
  }

  async deleteDnsRecord(zoneId: string, recordId: string): Promise<{ id: string }> {
    const response = await this.request<{ id: string }>(
      `/zones/${zoneId}/dns_records/${recordId}`,
      { method: 'DELETE' }
    );
    return response.result;
  }

  async exportDnsRecords(zoneId: string): Promise<string> {
    return this.requestRaw(`/zones/${zoneId}/dns_records/export`);
  }

  async importDnsRecords(
    zoneId: string,
    file: string
  ): Promise<{ total_records_parsed: number }> {
    const response = await this.request<{ total_records_parsed: number }>(
      `/zones/${zoneId}/dns_records/import`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: file,
      }
    );
    return response.result;
  }

  // ===========================================================================
  // Cache
  // ===========================================================================

  async purgeCache(
    zoneId: string,
    params: { purge_everything?: boolean; files?: string[]; tags?: string[]; hosts?: string[] }
  ): Promise<CachePurgeResult> {
    const response = await this.request<CachePurgeResult>(`/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return response.result;
  }

  // ===========================================================================
  // Workers
  // ===========================================================================

  async listWorkers(accountId: string): Promise<Worker[]> {
    const response = await this.request<Worker[]>(`/accounts/${accountId}/workers/scripts`);
    return response.result;
  }

  async getWorker(accountId: string, scriptName: string): Promise<string> {
    return this.requestRaw(`/accounts/${accountId}/workers/scripts/${scriptName}`);
  }

  async deleteWorker(accountId: string, scriptName: string): Promise<void> {
    await this.request(`/accounts/${accountId}/workers/scripts/${scriptName}`, {
      method: 'DELETE',
    });
  }

  async listWorkerRoutes(zoneId: string): Promise<WorkerRoute[]> {
    const response = await this.request<WorkerRoute[]>(`/zones/${zoneId}/workers/routes`);
    return response.result;
  }

  async createWorkerRoute(
    zoneId: string,
    pattern: string,
    script?: string
  ): Promise<WorkerRoute> {
    const response = await this.request<WorkerRoute>(`/zones/${zoneId}/workers/routes`, {
      method: 'POST',
      body: JSON.stringify({ pattern, script }),
    });
    return response.result;
  }

  async deleteWorkerRoute(zoneId: string, routeId: string): Promise<void> {
    await this.request(`/zones/${zoneId}/workers/routes/${routeId}`, {
      method: 'DELETE',
    });
  }

  async getWorkerCronTriggers(
    accountId: string,
    scriptName: string
  ): Promise<WorkerCronTrigger[]> {
    const response = await this.request<{ schedules: WorkerCronTrigger[] }>(
      `/accounts/${accountId}/workers/scripts/${scriptName}/schedules`
    );
    return response.result.schedules;
  }

  async listWorkerSecrets(accountId: string, scriptName: string): Promise<WorkerSecret[]> {
    const response = await this.request<WorkerSecret[]>(
      `/accounts/${accountId}/workers/scripts/${scriptName}/secrets`
    );
    return response.result;
  }

  // ===========================================================================
  // KV Namespaces
  // ===========================================================================

  async listKvNamespaces(
    accountId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<KvNamespace>> {
    const normalized = normalizePaginationParams(params);
    const queryParams = new URLSearchParams({
      page: String(normalized.page),
      per_page: String(normalized.per_page),
    });

    const response = await this.request<KvNamespace[]>(
      `/accounts/${accountId}/storage/kv/namespaces?${queryParams}`
    );
    return createPaginatedResponse(response.result, response.result_info);
  }

  async getKvNamespace(accountId: string, namespaceId: string): Promise<KvNamespace> {
    const response = await this.request<KvNamespace>(
      `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`
    );
    return response.result;
  }

  async createKvNamespace(accountId: string, title: string): Promise<KvNamespace> {
    const response = await this.request<KvNamespace>(
      `/accounts/${accountId}/storage/kv/namespaces`,
      {
        method: 'POST',
        body: JSON.stringify({ title }),
      }
    );
    return response.result;
  }

  async renameKvNamespace(
    accountId: string,
    namespaceId: string,
    title: string
  ): Promise<void> {
    await this.request(`/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  }

  async deleteKvNamespace(accountId: string, namespaceId: string): Promise<void> {
    await this.request(`/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`, {
      method: 'DELETE',
    });
  }

  async listKvKeys(
    accountId: string,
    namespaceId: string,
    params?: { prefix?: string; cursor?: string; limit?: number }
  ): Promise<{ keys: KvKey[]; cursor?: string; list_complete: boolean }> {
    const queryParams = new URLSearchParams();
    if (params?.prefix) queryParams.set('prefix', params.prefix);
    if (params?.cursor) queryParams.set('cursor', params.cursor);
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const response = await this.request<KvKey[]>(
      `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?${queryParams}`
    );

    // The cursor comes from result_info for KV
    const resultInfo = response.result_info as ResultInfo & { cursor?: string };
    return {
      keys: response.result,
      cursor: resultInfo?.cursor,
      list_complete: !resultInfo?.cursor,
    };
  }

  async getKvValue(accountId: string, namespaceId: string, key: string): Promise<string> {
    return this.requestRaw(
      `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`
    );
  }

  async putKvValue(
    accountId: string,
    namespaceId: string,
    key: string,
    value: string,
    options?: { expiration?: number; expiration_ttl?: number; metadata?: Record<string, unknown> }
  ): Promise<void> {
    const queryParams = new URLSearchParams();
    if (options?.expiration) queryParams.set('expiration', String(options.expiration));
    if (options?.expiration_ttl) queryParams.set('expiration_ttl', String(options.expiration_ttl));

    const url = `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}${queryParams.toString() ? `?${queryParams}` : ''}`;

    await this.request(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: value,
    });
  }

  async deleteKvValue(accountId: string, namespaceId: string, key: string): Promise<void> {
    await this.request(
      `/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(key)}`,
      { method: 'DELETE' }
    );
  }

  // ===========================================================================
  // D1 Databases
  // ===========================================================================

  async listD1Databases(
    accountId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<D1Database>> {
    const normalized = normalizePaginationParams(params);
    const queryParams = new URLSearchParams({
      page: String(normalized.page),
      per_page: String(normalized.per_page),
    });

    const response = await this.request<D1Database[]>(
      `/accounts/${accountId}/d1/database?${queryParams}`
    );
    return createPaginatedResponse(response.result, response.result_info);
  }

  async getD1Database(accountId: string, databaseId: string): Promise<D1Database> {
    const response = await this.request<D1Database>(
      `/accounts/${accountId}/d1/database/${databaseId}`
    );
    return response.result;
  }

  async createD1Database(accountId: string, name: string): Promise<D1Database> {
    const response = await this.request<D1Database>(`/accounts/${accountId}/d1/database`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return response.result;
  }

  async deleteD1Database(accountId: string, databaseId: string): Promise<void> {
    await this.request(`/accounts/${accountId}/d1/database/${databaseId}`, {
      method: 'DELETE',
    });
  }

  async queryD1Database(
    accountId: string,
    databaseId: string,
    sql: string,
    params?: unknown[]
  ): Promise<D1QueryResult[]> {
    const response = await this.request<D1QueryResult[]>(
      `/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: 'POST',
        body: JSON.stringify({ sql, params }),
      }
    );
    return response.result;
  }

  // ===========================================================================
  // R2 Storage
  // ===========================================================================

  async listR2Buckets(accountId: string): Promise<R2Bucket[]> {
    const response = await this.request<{ buckets: R2Bucket[] }>(
      `/accounts/${accountId}/r2/buckets`
    );
    return response.result.buckets;
  }

  async getR2Bucket(accountId: string, bucketName: string): Promise<R2Bucket> {
    const response = await this.request<R2Bucket>(
      `/accounts/${accountId}/r2/buckets/${bucketName}`
    );
    return response.result;
  }

  async createR2Bucket(
    accountId: string,
    name: string,
    locationHint?: string
  ): Promise<R2Bucket> {
    const response = await this.request<R2Bucket>(`/accounts/${accountId}/r2/buckets`, {
      method: 'POST',
      body: JSON.stringify({ name, locationHint }),
    });
    return response.result;
  }

  async deleteR2Bucket(accountId: string, bucketName: string): Promise<void> {
    await this.request(`/accounts/${accountId}/r2/buckets/${bucketName}`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // Pages
  // ===========================================================================

  async listPagesProjects(accountId: string): Promise<PagesProject[]> {
    const response = await this.request<PagesProject[]>(
      `/accounts/${accountId}/pages/projects`
    );
    return response.result;
  }

  async getPagesProject(accountId: string, projectName: string): Promise<PagesProject> {
    const response = await this.request<PagesProject>(
      `/accounts/${accountId}/pages/projects/${projectName}`
    );
    return response.result;
  }

  async createPagesProject(
    accountId: string,
    name: string,
    productionBranch?: string
  ): Promise<PagesProject> {
    const response = await this.request<PagesProject>(
      `/accounts/${accountId}/pages/projects`,
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          production_branch: productionBranch || 'main',
        }),
      }
    );
    return response.result;
  }

  async deletePagesProject(accountId: string, projectName: string): Promise<void> {
    await this.request(`/accounts/${accountId}/pages/projects/${projectName}`, {
      method: 'DELETE',
    });
  }

  async listPagesDeployments(
    accountId: string,
    projectName: string
  ): Promise<PagesDeployment[]> {
    const response = await this.request<PagesDeployment[]>(
      `/accounts/${accountId}/pages/projects/${projectName}/deployments`
    );
    return response.result;
  }

  async getPagesDeployment(
    accountId: string,
    projectName: string,
    deploymentId: string
  ): Promise<PagesDeployment> {
    const response = await this.request<PagesDeployment>(
      `/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}`
    );
    return response.result;
  }

  async deletePagesDeployment(
    accountId: string,
    projectName: string,
    deploymentId: string
  ): Promise<void> {
    await this.request(
      `/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}`,
      { method: 'DELETE' }
    );
  }

  async rollbackPagesDeployment(
    accountId: string,
    projectName: string,
    deploymentId: string
  ): Promise<PagesDeployment> {
    const response = await this.request<PagesDeployment>(
      `/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}/rollback`,
      { method: 'POST' }
    );
    return response.result;
  }

  // ===========================================================================
  // SSL/TLS Certificates
  // ===========================================================================

  async listSslCertificates(zoneId: string): Promise<SslCertificate[]> {
    const response = await this.request<SslCertificate[]>(
      `/zones/${zoneId}/ssl/certificate_packs`
    );
    return response.result;
  }

  // ===========================================================================
  // Firewall Rules
  // ===========================================================================

  async listFirewallRules(zoneId: string): Promise<FirewallRule[]> {
    const response = await this.request<FirewallRule[]>(`/zones/${zoneId}/firewall/rules`);
    return response.result;
  }

  async getFirewallRule(zoneId: string, ruleId: string): Promise<FirewallRule> {
    const response = await this.request<FirewallRule>(
      `/zones/${zoneId}/firewall/rules/${ruleId}`
    );
    return response.result;
  }

  async createFirewallRule(
    zoneId: string,
    input: FirewallRuleCreateInput
  ): Promise<FirewallRule[]> {
    const response = await this.request<FirewallRule[]>(`/zones/${zoneId}/firewall/rules`, {
      method: 'POST',
      body: JSON.stringify([input]),
    });
    return response.result;
  }

  async updateFirewallRule(
    zoneId: string,
    ruleId: string,
    input: Partial<FirewallRuleCreateInput>
  ): Promise<FirewallRule> {
    const response = await this.request<FirewallRule>(
      `/zones/${zoneId}/firewall/rules/${ruleId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      }
    );
    return response.result;
  }

  async deleteFirewallRule(zoneId: string, ruleId: string): Promise<void> {
    await this.request(`/zones/${zoneId}/firewall/rules/${ruleId}`, {
      method: 'DELETE',
    });
  }

  async listFilters(zoneId: string): Promise<Filter[]> {
    const response = await this.request<Filter[]>(`/zones/${zoneId}/filters`);
    return response.result;
  }

  // ===========================================================================
  // WAF
  // ===========================================================================

  async listWafPackages(zoneId: string): Promise<WafPackage[]> {
    const response = await this.request<WafPackage[]>(
      `/zones/${zoneId}/firewall/waf/packages`
    );
    return response.result;
  }

  async listWafRules(zoneId: string, packageId: string): Promise<WafRule[]> {
    const response = await this.request<WafRule[]>(
      `/zones/${zoneId}/firewall/waf/packages/${packageId}/rules`
    );
    return response.result;
  }

  async updateWafRule(
    zoneId: string,
    packageId: string,
    ruleId: string,
    mode: string
  ): Promise<WafRule> {
    const response = await this.request<WafRule>(
      `/zones/${zoneId}/firewall/waf/packages/${packageId}/rules/${ruleId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ mode }),
      }
    );
    return response.result;
  }

  // ===========================================================================
  // Load Balancers
  // ===========================================================================

  async listLoadBalancers(zoneId: string): Promise<LoadBalancer[]> {
    const response = await this.request<LoadBalancer[]>(`/zones/${zoneId}/load_balancers`);
    return response.result;
  }

  async getLoadBalancer(zoneId: string, lbId: string): Promise<LoadBalancer> {
    const response = await this.request<LoadBalancer>(
      `/zones/${zoneId}/load_balancers/${lbId}`
    );
    return response.result;
  }

  async listLoadBalancerPools(accountId: string): Promise<LoadBalancerPool[]> {
    const response = await this.request<LoadBalancerPool[]>(
      `/accounts/${accountId}/load_balancers/pools`
    );
    return response.result;
  }

  async getLoadBalancerPool(accountId: string, poolId: string): Promise<LoadBalancerPool> {
    const response = await this.request<LoadBalancerPool>(
      `/accounts/${accountId}/load_balancers/pools/${poolId}`
    );
    return response.result;
  }

  async listLoadBalancerMonitors(accountId: string): Promise<LoadBalancerMonitor[]> {
    const response = await this.request<LoadBalancerMonitor[]>(
      `/accounts/${accountId}/load_balancers/monitors`
    );
    return response.result;
  }

  // ===========================================================================
  // Analytics
  // ===========================================================================

  async getZoneAnalytics(
    zoneId: string,
    since?: string,
    until?: string
  ): Promise<ZoneAnalytics> {
    const queryParams = new URLSearchParams();
    if (since) queryParams.set('since', since);
    if (until) queryParams.set('until', until);

    const response = await this.request<ZoneAnalytics>(
      `/zones/${zoneId}/analytics/dashboard?${queryParams}`
    );
    return response.result;
  }

  async getDnsAnalytics(
    zoneId: string,
    dimensions?: string[],
    metrics?: string[],
    since?: string,
    until?: string
  ): Promise<Record<string, unknown>> {
    const queryParams = new URLSearchParams();
    if (dimensions) queryParams.set('dimensions', dimensions.join(','));
    if (metrics) queryParams.set('metrics', metrics.join(','));
    if (since) queryParams.set('since', since);
    if (until) queryParams.set('until', until);

    const response = await this.request<Record<string, unknown>>(
      `/zones/${zoneId}/dns_analytics/report?${queryParams}`
    );
    return response.result;
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Cloudflare client instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides its own credentials via headers,
 * allowing a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
export function createCloudflareClient(credentials: TenantCredentials): CloudflareClient {
  return new CloudflareClientImpl(credentials);
}
