/**
 * Cloudflare API Entity Types
 *
 * Type definitions for Cloudflare API responses and inputs.
 */

// =============================================================================
// Common Types
// =============================================================================

/** Standard Cloudflare API response wrapper */
export interface CloudflareResponse<T> {
  success: boolean;
  errors: CloudflareError[];
  messages: CloudflareMessage[];
  result: T;
  result_info?: ResultInfo;
}

export interface CloudflareError {
  code: number;
  message: string;
}

export interface CloudflareMessage {
  code: number;
  message: string;
}

export interface ResultInfo {
  page: number;
  per_page: number;
  count: number;
  total_count: number;
  total_pages: number;
}

// =============================================================================
// Pagination
// =============================================================================

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  count: number;
  total?: number;
  hasMore: boolean;
  page?: number;
  totalPages?: number;
}

// =============================================================================
// User & Account
// =============================================================================

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  telephone?: string;
  country?: string;
  zipcode?: string;
  created_on?: string;
  modified_on?: string;
  two_factor_authentication_enabled?: boolean;
  suspended?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type?: string;
  settings?: AccountSettings;
  created_on?: string;
}

export interface AccountSettings {
  enforce_twofactor?: boolean;
  use_account_custom_ns_by_default?: boolean;
}

export interface AccountMember {
  id: string;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  status: string;
  roles: AccountRole[];
}

export interface AccountRole {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, { read: boolean; edit: boolean }>;
}

// =============================================================================
// Zone
// =============================================================================

export interface Zone {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'initializing' | 'moved' | 'deleted' | 'deactivated' | 'read only';
  paused: boolean;
  type: 'full' | 'partial' | 'secondary';
  development_mode: number;
  name_servers?: string[];
  original_name_servers?: string[];
  original_registrar?: string;
  original_dnshost?: string;
  modified_on?: string;
  created_on?: string;
  activated_on?: string;
  meta?: ZoneMeta;
  owner?: { id: string; type: string; email?: string };
  account?: { id: string; name: string };
  permissions?: string[];
  plan?: ZonePlan;
}

export interface ZoneMeta {
  step?: number;
  custom_certificate_quota?: number;
  page_rule_quota?: number;
  phishing_detected?: boolean;
  multiple_railguns_allowed?: boolean;
}

export interface ZonePlan {
  id: string;
  name: string;
  price?: number;
  currency?: string;
  frequency?: string;
  is_subscribed?: boolean;
  can_subscribe?: boolean;
  legacy_id?: string;
  legacy_discount?: boolean;
  externally_managed?: boolean;
}

export interface ZoneCreateInput {
  name: string;
  account: { id: string };
  type?: 'full' | 'partial' | 'secondary';
  jump_start?: boolean;
}

export interface ZoneUpdateInput {
  paused?: boolean;
  plan?: { id: string };
  type?: 'full' | 'partial' | 'secondary';
  vanity_name_servers?: string[];
}

// =============================================================================
// DNS Records
// =============================================================================

export type DnsRecordType =
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'TXT'
  | 'SRV'
  | 'LOC'
  | 'MX'
  | 'NS'
  | 'CERT'
  | 'DNSKEY'
  | 'DS'
  | 'NAPTR'
  | 'SMIMEA'
  | 'SSHFP'
  | 'SVCB'
  | 'TLSA'
  | 'URI'
  | 'HTTPS'
  | 'CAA'
  | 'PTR';

export interface DnsRecord {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: DnsRecordType;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked: boolean;
  meta?: {
    auto_added?: boolean;
    managed_by_apps?: boolean;
    managed_by_argo_tunnel?: boolean;
    source?: string;
  };
  comment?: string;
  tags?: string[];
  created_on?: string;
  modified_on?: string;
  priority?: number;
  data?: Record<string, unknown>;
}

export interface DnsRecordCreateInput {
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
  comment?: string;
  tags?: string[];
  data?: Record<string, unknown>;
}

export interface DnsRecordUpdateInput {
  type?: DnsRecordType;
  name?: string;
  content?: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
  comment?: string;
  tags?: string[];
}

// =============================================================================
// Workers
// =============================================================================

export interface Worker {
  id: string;
  etag?: string;
  handlers?: string[];
  named_handlers?: { name: string; entrypoint: string }[];
  modified_on?: string;
  created_on?: string;
  usage_model?: string;
  compatibility_date?: string;
  compatibility_flags?: string[];
  tail_consumers?: { service: string; environment?: string }[];
  logpush?: boolean;
  placement?: { mode: string };
}

export interface WorkerRoute {
  id: string;
  pattern: string;
  script?: string;
}

export interface WorkerRouteCreateInput {
  pattern: string;
  script?: string;
}

export interface WorkerCronTrigger {
  cron: string;
  created_on?: string;
  modified_on?: string;
}

export interface WorkerSecret {
  name: string;
  type: string;
}

// =============================================================================
// KV Namespace
// =============================================================================

export interface KvNamespace {
  id: string;
  title: string;
  supports_url_encoding?: boolean;
}

export interface KvKey {
  name: string;
  expiration?: number;
  metadata?: Record<string, unknown>;
}

export interface KvKeyValue {
  key: string;
  value: string;
  expiration?: number;
  expiration_ttl?: number;
  metadata?: Record<string, unknown>;
  base64?: boolean;
}

// =============================================================================
// D1 Database
// =============================================================================

export interface D1Database {
  uuid: string;
  name: string;
  version: string;
  num_tables?: number;
  file_size?: number;
  created_at?: string;
}

export interface D1QueryResult {
  results: Record<string, unknown>[];
  success: boolean;
  meta: {
    served_by: string;
    duration: number;
    changes: number;
    last_row_id: number;
    changed_db: boolean;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

// =============================================================================
// R2 Storage
// =============================================================================

export interface R2Bucket {
  name: string;
  creation_date?: string;
  location?: string;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  http_metadata?: {
    content_type?: string;
    content_language?: string;
    content_disposition?: string;
    content_encoding?: string;
    cache_control?: string;
    cache_expiry?: string;
  };
  custom_metadata?: Record<string, string>;
  uploaded?: string;
}

// =============================================================================
// Pages
// =============================================================================

export interface PagesProject {
  id: string;
  name: string;
  subdomain: string;
  domains?: string[];
  source?: {
    type: string;
    config?: {
      owner?: string;
      repo_name?: string;
      production_branch?: string;
      pr_comments_enabled?: boolean;
      deployments_enabled?: boolean;
    };
  };
  build_config?: {
    build_command?: string;
    destination_dir?: string;
    root_dir?: string;
  };
  deployment_configs?: {
    preview?: DeploymentConfig;
    production?: DeploymentConfig;
  };
  latest_deployment?: PagesDeployment;
  canonical_deployment?: PagesDeployment;
  production_branch?: string;
  created_on?: string;
  modified_on?: string;
}

export interface DeploymentConfig {
  env_vars?: Record<string, { value: string; type?: string }>;
  kv_namespaces?: Record<string, { namespace_id: string }>;
  d1_databases?: Record<string, { id: string }>;
  r2_buckets?: Record<string, { name: string }>;
  durable_objects?: Record<string, { class_name: string; script_name?: string }>;
  service_bindings?: Record<string, { service: string; environment?: string }>;
  compatibility_date?: string;
  compatibility_flags?: string[];
}

export interface PagesDeployment {
  id: string;
  url: string;
  environment: 'preview' | 'production';
  short_id: string;
  project_id?: string;
  project_name?: string;
  deployment_trigger?: {
    type: string;
    metadata?: {
      branch?: string;
      commit_hash?: string;
      commit_message?: string;
      commit_dirty?: boolean;
    };
  };
  stages?: {
    name: string;
    started_on?: string;
    ended_on?: string;
    status: string;
  }[];
  build_config?: {
    build_command?: string;
    destination_dir?: string;
    root_dir?: string;
  };
  source?: {
    type: string;
    config?: {
      owner?: string;
      repo_name?: string;
    };
  };
  env_vars?: Record<string, { value: string; type?: string }>;
  aliases?: string[];
  created_on?: string;
  modified_on?: string;
}

// =============================================================================
// SSL/TLS Certificates
// =============================================================================

export interface SslCertificate {
  id: string;
  type: string;
  hosts: string[];
  status: string;
  issuer?: string;
  signature?: string;
  uploaded_on?: string;
  expires_on?: string;
  modified_on?: string;
  bundle_method?: string;
  geo_restrictions?: { label: string };
  zone_id: string;
}

export interface CustomHostname {
  id: string;
  hostname: string;
  ssl: {
    id?: string;
    type: string;
    method: string;
    status: string;
    bundle_method?: string;
    wildcard?: boolean;
    certificate_authority?: string;
    validation_records?: {
      txt_name?: string;
      txt_value?: string;
      http_url?: string;
      http_body?: string;
      emails?: string[];
    }[];
    validation_errors?: { message: string }[];
    settings?: {
      http2?: string;
      min_tls_version?: string;
      tls_1_3?: string;
      ciphers?: string[];
      early_hints?: string;
    };
  };
  custom_metadata?: Record<string, unknown>;
  custom_origin_server?: string;
  custom_origin_sni?: string;
  status: string;
  verification_errors?: string[];
  ownership_verification?: {
    type: string;
    name: string;
    value: string;
  };
  ownership_verification_http?: {
    http_url: string;
    http_body: string;
  };
  created_at?: string;
}

// =============================================================================
// Firewall Rules
// =============================================================================

export interface FirewallRule {
  id: string;
  paused: boolean;
  description?: string;
  action: 'block' | 'challenge' | 'js_challenge' | 'managed_challenge' | 'allow' | 'log' | 'bypass';
  priority?: number;
  filter: {
    id: string;
    expression: string;
    paused: boolean;
    description?: string;
    ref?: string;
  };
  products?: string[];
  ref?: string;
  created_on?: string;
  modified_on?: string;
}

export interface FirewallRuleCreateInput {
  action: 'block' | 'challenge' | 'js_challenge' | 'managed_challenge' | 'allow' | 'log' | 'bypass';
  filter: {
    expression: string;
    paused?: boolean;
    description?: string;
  };
  paused?: boolean;
  description?: string;
  priority?: number;
  products?: string[];
}

export interface Filter {
  id: string;
  expression: string;
  paused: boolean;
  description?: string;
  ref?: string;
}

// =============================================================================
// WAF
// =============================================================================

export interface WafPackage {
  id: string;
  name: string;
  description?: string;
  detection_mode: string;
  zone_id: string;
  status: string;
  sensitivity?: string;
  action_mode?: string;
}

export interface WafRule {
  id: string;
  description?: string;
  priority?: number;
  package_id: string;
  group: {
    id: string;
    name: string;
  };
  mode: 'default' | 'disable' | 'simulate' | 'block' | 'challenge';
  default_mode?: string;
  allowed_modes: string[];
}

// =============================================================================
// Load Balancers
// =============================================================================

export interface LoadBalancer {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  ttl?: number;
  fallback_pool: string;
  default_pools: string[];
  region_pools?: Record<string, string[]>;
  country_pools?: Record<string, string[]>;
  pop_pools?: Record<string, string[]>;
  proxied: boolean;
  steering_policy?: string;
  session_affinity?: string;
  session_affinity_ttl?: number;
  session_affinity_attributes?: Record<string, unknown>;
  rules?: LoadBalancerRule[];
  random_steering?: {
    pool_weights?: Record<string, number>;
    default_weight?: number;
  };
  adaptive_routing?: {
    failover_across_pools?: boolean;
  };
  location_strategy?: {
    prefer_ecs?: string;
    mode?: string;
  };
  created_on?: string;
  modified_on?: string;
}

export interface LoadBalancerRule {
  name: string;
  condition?: string;
  disabled?: boolean;
  fixed_response?: {
    message_body?: string;
    status_code?: number;
    content_type?: string;
    location?: string;
  };
  overrides?: {
    session_affinity?: string;
    session_affinity_ttl?: number;
    session_affinity_attributes?: Record<string, unknown>;
    ttl?: number;
    steering_policy?: string;
    fallback_pool?: string;
    default_pools?: string[];
    region_pools?: Record<string, string[]>;
    country_pools?: Record<string, string[]>;
    pop_pools?: Record<string, string[]>;
    random_steering?: {
      pool_weights?: Record<string, number>;
      default_weight?: number;
    };
    adaptive_routing?: {
      failover_across_pools?: boolean;
    };
    location_strategy?: {
      prefer_ecs?: string;
      mode?: string;
    };
  };
  priority?: number;
  terminates?: boolean;
}

export interface LoadBalancerPool {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  minimum_origins?: number;
  monitor?: string;
  origins: LoadBalancerOrigin[];
  notification_email?: string;
  notification_filter?: {
    pool?: { disable?: boolean; healthy?: boolean };
    origin?: { disable?: boolean; healthy?: boolean };
  };
  origin_steering?: {
    policy?: string;
  };
  load_shedding?: {
    default_percent?: number;
    default_policy?: string;
    session_percent?: number;
    session_policy?: string;
  };
  latitude?: number;
  longitude?: number;
  check_regions?: string[];
  created_on?: string;
  modified_on?: string;
}

export interface LoadBalancerOrigin {
  name: string;
  address: string;
  enabled: boolean;
  weight?: number;
  header?: Record<string, string[]>;
  virtual_network_id?: string;
}

export interface LoadBalancerMonitor {
  id: string;
  type: 'http' | 'https' | 'tcp' | 'udp_icmp' | 'icmp_ping' | 'smtp';
  description?: string;
  method?: string;
  path?: string;
  header?: Record<string, string[]>;
  port?: number;
  timeout?: number;
  retries?: number;
  interval?: number;
  expected_body?: string;
  expected_codes?: string;
  follow_redirects?: boolean;
  allow_insecure?: boolean;
  consecutive_up?: number;
  consecutive_down?: number;
  probe_zone?: string;
  created_on?: string;
  modified_on?: string;
}

// =============================================================================
// Cache
// =============================================================================

export interface CachePurgeResult {
  id: string;
}

export interface CacheReserveStatus {
  id: string;
  modified_on: string;
  value: 'on' | 'off';
}

// =============================================================================
// Analytics
// =============================================================================

export interface ZoneAnalytics {
  query: {
    since: string;
    until: string;
    time_delta?: number;
  };
  totals: AnalyticsTotals;
  timeseries?: AnalyticsTimeseries[];
}

export interface AnalyticsTotals {
  requests: {
    all: number;
    cached: number;
    uncached: number;
    content_type?: Record<string, number>;
    country?: Record<string, number>;
    ssl?: { encrypted: number; unencrypted: number };
    http_status?: Record<string, number>;
  };
  bandwidth: {
    all: number;
    cached: number;
    uncached: number;
    content_type?: Record<string, number>;
    country?: Record<string, number>;
    ssl?: { encrypted: number; unencrypted: number };
  };
  threats: {
    all: number;
    country?: Record<string, number>;
    type?: Record<string, number>;
  };
  pageviews: {
    all: number;
    search_engines?: Record<string, number>;
  };
  uniques: {
    all: number;
  };
}

export interface AnalyticsTimeseries {
  since: string;
  until: string;
  requests: {
    all: number;
    cached: number;
    uncached: number;
    content_type?: Record<string, number>;
    country?: Record<string, number>;
    ssl?: { encrypted: number; unencrypted: number };
    http_status?: Record<string, number>;
  };
  bandwidth: {
    all: number;
    cached: number;
    uncached: number;
    content_type?: Record<string, number>;
    country?: Record<string, number>;
    ssl?: { encrypted: number; unencrypted: number };
  };
  threats: {
    all: number;
    country?: Record<string, number>;
    type?: Record<string, number>;
  };
  pageviews: {
    all: number;
    search_engines?: Record<string, number>;
  };
  uniques: {
    all: number;
  };
}

// =============================================================================
// Response Format
// =============================================================================

export type ResponseFormat = 'json' | 'markdown';
