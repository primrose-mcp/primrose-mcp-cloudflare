/**
 * Response Formatting Utilities
 *
 * Helpers for formatting tool responses in JSON or Markdown.
 */

import type {
  D1Database,
  DnsRecord,
  KvNamespace,
  LoadBalancer,
  PagesDeployment,
  PagesProject,
  PaginatedResponse,
  R2Bucket,
  ResponseFormat,
  Worker,
  Zone,
} from '../types/cloudflare.js';
import { CloudflareApiError, formatErrorForLogging } from './errors.js';

/**
 * MCP tool response type
 * Note: Index signature required for MCP SDK 1.25+ compatibility
 */
export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Format a successful response
 */
export function formatResponse(
  data: unknown,
  format: ResponseFormat,
  entityType: string
): ToolResponse {
  if (format === 'markdown') {
    return {
      content: [{ type: 'text', text: formatAsMarkdown(data, entityType) }],
    };
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error response
 */
export function formatErrorResponse(error: unknown): ToolResponse {
  const errorInfo = formatErrorForLogging(error);

  let message: string;
  if (error instanceof CloudflareApiError) {
    message = `Error: ${error.message}`;
    if (error.retryable) {
      message += ' (retryable)';
    }
  } else if (error instanceof Error) {
    message = `Error: ${error.message}`;
  } else {
    message = `Error: ${String(error)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, details: errorInfo }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Format data as Markdown
 */
function formatAsMarkdown(data: unknown, entityType: string): string {
  if (isPaginatedResponse(data)) {
    return formatPaginatedAsMarkdown(data, entityType);
  }

  if (Array.isArray(data)) {
    return formatArrayAsMarkdown(data, entityType);
  }

  if (typeof data === 'object' && data !== null) {
    return formatObjectAsMarkdown(data as Record<string, unknown>, entityType);
  }

  return String(data);
}

/**
 * Type guard for paginated response
 */
function isPaginatedResponse(data: unknown): data is PaginatedResponse<unknown> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as PaginatedResponse<unknown>).items)
  );
}

/**
 * Format paginated response as Markdown
 */
function formatPaginatedAsMarkdown(data: PaginatedResponse<unknown>, entityType: string): string {
  const lines: string[] = [];

  lines.push(`## ${capitalize(entityType)}`);
  lines.push('');

  if (data.total !== undefined) {
    lines.push(`**Total:** ${data.total} | **Showing:** ${data.count}`);
  } else {
    lines.push(`**Showing:** ${data.count}`);
  }

  if (data.hasMore && data.page !== undefined) {
    lines.push(`**More available:** Yes (page ${data.page})`);
  } else if (data.hasMore) {
    lines.push(`**More available:** Yes`);
  }
  lines.push('');

  if (data.items.length === 0) {
    lines.push('_No items found._');
    return lines.join('\n');
  }

  // Format items based on entity type
  switch (entityType) {
    case 'zones':
      lines.push(formatZonesTable(data.items as Zone[]));
      break;
    case 'dns_records':
      lines.push(formatDnsRecordsTable(data.items as DnsRecord[]));
      break;
    case 'workers':
      lines.push(formatWorkersTable(data.items as Worker[]));
      break;
    case 'kv_namespaces':
      lines.push(formatKvNamespacesTable(data.items as KvNamespace[]));
      break;
    case 'd1_databases':
      lines.push(formatD1DatabasesTable(data.items as D1Database[]));
      break;
    case 'r2_buckets':
      lines.push(formatR2BucketsTable(data.items as R2Bucket[]));
      break;
    case 'pages_projects':
      lines.push(formatPagesProjectsTable(data.items as PagesProject[]));
      break;
    case 'deployments':
      lines.push(formatDeploymentsTable(data.items as PagesDeployment[]));
      break;
    case 'load_balancers':
      lines.push(formatLoadBalancersTable(data.items as LoadBalancer[]));
      break;
    default:
      lines.push(formatGenericTable(data.items));
  }

  return lines.join('\n');
}

/**
 * Format zones as Markdown table
 */
function formatZonesTable(zones: Zone[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Status | Plan | Type |');
  lines.push('|---|---|---|---|---|');

  for (const zone of zones) {
    lines.push(
      `| ${zone.id} | ${zone.name} | ${zone.status} | ${zone.plan?.name || '-'} | ${zone.type} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format DNS records as Markdown table
 */
function formatDnsRecordsTable(records: DnsRecord[]): string {
  const lines: string[] = [];
  lines.push('| ID | Type | Name | Content | TTL | Proxied |');
  lines.push('|---|---|---|---|---|---|');

  for (const record of records) {
    const content =
      record.content.length > 40 ? `${record.content.substring(0, 40)}...` : record.content;
    lines.push(
      `| ${record.id} | ${record.type} | ${record.name} | ${content} | ${record.ttl} | ${record.proxied ? 'Yes' : 'No'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format workers as Markdown table
 */
function formatWorkersTable(workers: Worker[]): string {
  const lines: string[] = [];
  lines.push('| ID | Handlers | Modified |');
  lines.push('|---|---|---|');

  for (const worker of workers) {
    const handlers = worker.handlers?.join(', ') || '-';
    lines.push(`| ${worker.id} | ${handlers} | ${worker.modified_on || '-'} |`);
  }

  return lines.join('\n');
}

/**
 * Format KV namespaces as Markdown table
 */
function formatKvNamespacesTable(namespaces: KvNamespace[]): string {
  const lines: string[] = [];
  lines.push('| ID | Title |');
  lines.push('|---|---|');

  for (const ns of namespaces) {
    lines.push(`| ${ns.id} | ${ns.title} |`);
  }

  return lines.join('\n');
}

/**
 * Format D1 databases as Markdown table
 */
function formatD1DatabasesTable(databases: D1Database[]): string {
  const lines: string[] = [];
  lines.push('| UUID | Name | Tables | Size |');
  lines.push('|---|---|---|---|');

  for (const db of databases) {
    const size = db.file_size ? `${(db.file_size / 1024).toFixed(2)} KB` : '-';
    lines.push(`| ${db.uuid} | ${db.name} | ${db.num_tables || '-'} | ${size} |`);
  }

  return lines.join('\n');
}

/**
 * Format R2 buckets as Markdown table
 */
function formatR2BucketsTable(buckets: R2Bucket[]): string {
  const lines: string[] = [];
  lines.push('| Name | Location | Created |');
  lines.push('|---|---|---|');

  for (const bucket of buckets) {
    lines.push(`| ${bucket.name} | ${bucket.location || '-'} | ${bucket.creation_date || '-'} |`);
  }

  return lines.join('\n');
}

/**
 * Format Pages projects as Markdown table
 */
function formatPagesProjectsTable(projects: PagesProject[]): string {
  const lines: string[] = [];
  lines.push('| Name | Subdomain | Domains | Created |');
  lines.push('|---|---|---|---|');

  for (const project of projects) {
    const domains = project.domains?.join(', ') || '-';
    lines.push(
      `| ${project.name} | ${project.subdomain}.pages.dev | ${domains} | ${project.created_on || '-'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format deployments as Markdown table
 */
function formatDeploymentsTable(deployments: PagesDeployment[]): string {
  const lines: string[] = [];
  lines.push('| ID | Environment | URL | Status | Created |');
  lines.push('|---|---|---|---|---|');

  for (const deployment of deployments) {
    const status = deployment.stages?.find((s) => s.name === 'build')?.status || '-';
    lines.push(
      `| ${deployment.short_id} | ${deployment.environment} | ${deployment.url} | ${status} | ${deployment.created_on || '-'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format load balancers as Markdown table
 */
function formatLoadBalancersTable(lbs: LoadBalancer[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Enabled | Pools | Steering |');
  lines.push('|---|---|---|---|---|');

  for (const lb of lbs) {
    lines.push(
      `| ${lb.id} | ${lb.name} | ${lb.enabled ? 'Yes' : 'No'} | ${lb.default_pools.length} | ${lb.steering_policy || 'off'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format a generic array as Markdown table
 */
function formatGenericTable(items: unknown[]): string {
  if (items.length === 0) return '_No items_';

  const first = items[0] as Record<string, unknown>;
  const keys = Object.keys(first).slice(0, 5); // Limit columns

  const lines: string[] = [];
  lines.push(`| ${keys.join(' | ')} |`);
  lines.push(`|${keys.map(() => '---').join('|')}|`);

  for (const item of items) {
    const record = item as Record<string, unknown>;
    const values = keys.map((k) => {
      const val = record[k];
      if (val === null || val === undefined) return '-';
      if (typeof val === 'object') return '[object]';
      const str = String(val);
      return str.length > 30 ? `${str.substring(0, 30)}...` : str;
    });
    lines.push(`| ${values.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * Format an array as Markdown
 */
function formatArrayAsMarkdown(data: unknown[], entityType: string): string {
  // Handle specific entity types
  switch (entityType) {
    case 'zones':
      return formatZonesTable(data as Zone[]);
    case 'dns_records':
      return formatDnsRecordsTable(data as DnsRecord[]);
    case 'workers':
      return formatWorkersTable(data as Worker[]);
    default:
      return formatGenericTable(data);
  }
}

/**
 * Format a single object as Markdown
 */
function formatObjectAsMarkdown(data: Record<string, unknown>, entityType: string): string {
  const lines: string[] = [];
  lines.push(`## ${capitalize(entityType.replace(/s$/, '').replace(/_/g, ' '))}`);
  lines.push('');

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    const formattedKey = formatKey(key);

    if (typeof value === 'object') {
      lines.push(`**${formattedKey}:**`);
      lines.push('```json');
      lines.push(JSON.stringify(value, null, 2));
      lines.push('```');
    } else {
      lines.push(`**${formattedKey}:** ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a key for display (snake_case to Title Case)
 */
function formatKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
