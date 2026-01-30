/**
 * Cloudflare MCP Server - Main Entry Point
 *
 * This file sets up the MCP server using Cloudflare's Agents SDK.
 *
 * MULTI-TENANT ARCHITECTURE:
 * Tenant credentials (API tokens, etc.) are parsed from request headers,
 * allowing a single server deployment to serve multiple customers.
 *
 * Required Headers:
 * - X-CF-API-Token: Cloudflare API token (recommended)
 * OR
 * - X-CF-API-Email + X-CF-API-Key: Legacy API key authentication
 *
 * Optional Headers:
 * - X-CF-Account-ID: Account ID for account-scoped operations
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { createCloudflareClient } from './client.js';
import {
  registerAccountTools,
  registerAnalyticsTools,
  registerCacheTools,
  registerD1Tools,
  registerDnsTools,
  registerFirewallTools,
  registerKvTools,
  registerLoadBalancerTools,
  registerPagesTools,
  registerR2Tools,
  registerSslTools,
  registerWafTools,
  registerWorkersTools,
  registerZoneTools,
} from './tools/index.js';
import {
  type Env,
  type TenantCredentials,
  parseTenantCredentials,
  validateCredentials,
} from './types/env.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

const SERVER_NAME = 'primrose-mcp-cloudflare';
const SERVER_VERSION = '1.0.0';

// =============================================================================
// MCP Agent (Stateful - uses Durable Objects)
// =============================================================================

/**
 * McpAgent provides stateful MCP sessions backed by Durable Objects.
 *
 * NOTE: For multi-tenant deployments, use the stateless mode instead.
 */
export class CloudflareMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  async init() {
    throw new Error(
      'Stateful mode (McpAgent) is not supported for multi-tenant deployments. ' +
        'Use the stateless /mcp endpoint with X-CF-API-Token header instead.'
    );
  }
}

// =============================================================================
// Stateless MCP Server (Recommended - no Durable Objects needed)
// =============================================================================

/**
 * Creates a stateless MCP server instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides credentials via headers, allowing
 * a single server deployment to serve multiple tenants.
 */
function createStatelessServer(credentials: TenantCredentials): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Create client with tenant-specific credentials
  const client = createCloudflareClient(credentials);

  // Register all tool categories
  registerZoneTools(server, client);
  registerDnsTools(server, client);
  registerWorkersTools(server, client);
  registerKvTools(server, client);
  registerD1Tools(server, client);
  registerR2Tools(server, client);
  registerPagesTools(server, client);
  registerCacheTools(server, client);
  registerFirewallTools(server, client);
  registerWafTools(server, client);
  registerLoadBalancerTools(server, client);
  registerSslTools(server, client);
  registerAccountTools(server, client);
  registerAnalyticsTools(server, client);

  // Test connection tool
  server.tool(
    'cloudflare_test_connection',
    'Test the connection to the Cloudflare API. Returns the authenticated user email if successful.',
    {},
    async () => {
      try {
        const result = await client.testConnection();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// =============================================================================
// Worker Export
// =============================================================================

export default {
  /**
   * Main fetch handler for the Worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', server: SERVER_NAME }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ==========================================================================
    // Stateless MCP with Streamable HTTP
    // ==========================================================================
    if (url.pathname === '/mcp' && request.method === 'POST') {
      // Parse tenant credentials from request headers
      const credentials = parseTenantCredentials(request);

      // Validate credentials are present
      try {
        validateCredentials(credentials);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid credentials',
            required_headers: ['X-CF-API-Token', 'or X-CF-API-Email + X-CF-API-Key'],
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create server with tenant-specific credentials
      const server = createStatelessServer(credentials);

      // Import and use createMcpHandler for streamable HTTP
      const { createMcpHandler } = await import('agents/mcp');
      const handler = createMcpHandler(server);
      return handler(request, env, ctx);
    }

    // SSE endpoint for legacy clients
    if (url.pathname === '/sse') {
      return new Response('SSE endpoint requires Durable Objects. Enable in wrangler.jsonc.', {
        status: 501,
      });
    }

    // Default response - API documentation
    return new Response(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Multi-tenant Cloudflare MCP Server',
        endpoints: {
          mcp: '/mcp (POST) - Streamable HTTP MCP endpoint',
          health: '/health - Health check',
        },
        authentication: {
          description: 'Pass tenant credentials via request headers',
          required_headers: {
            'X-CF-API-Token': 'Cloudflare API token (recommended)',
          },
          alternative_headers: {
            'X-CF-API-Email': 'Email for legacy API key authentication',
            'X-CF-API-Key': 'Legacy global API key',
          },
          optional_headers: {
            'X-CF-Account-ID': 'Account ID for account-scoped operations',
          },
        },
        tools: {
          zones: [
            'cloudflare_list_zones',
            'cloudflare_get_zone',
            'cloudflare_create_zone',
            'cloudflare_update_zone',
            'cloudflare_delete_zone',
            'cloudflare_get_zone_settings',
            'cloudflare_update_zone_setting',
            'cloudflare_zone_activation_check',
          ],
          dns: [
            'cloudflare_list_dns_records',
            'cloudflare_get_dns_record',
            'cloudflare_create_dns_record',
            'cloudflare_update_dns_record',
            'cloudflare_delete_dns_record',
            'cloudflare_export_dns_records',
            'cloudflare_import_dns_records',
          ],
          workers: [
            'cloudflare_list_workers',
            'cloudflare_get_worker',
            'cloudflare_delete_worker',
            'cloudflare_list_worker_routes',
            'cloudflare_create_worker_route',
            'cloudflare_delete_worker_route',
            'cloudflare_get_worker_cron_triggers',
            'cloudflare_list_worker_secrets',
          ],
          kv: [
            'cloudflare_list_kv_namespaces',
            'cloudflare_get_kv_namespace',
            'cloudflare_create_kv_namespace',
            'cloudflare_rename_kv_namespace',
            'cloudflare_delete_kv_namespace',
            'cloudflare_list_kv_keys',
            'cloudflare_get_kv_value',
            'cloudflare_put_kv_value',
            'cloudflare_delete_kv_value',
          ],
          d1: [
            'cloudflare_list_d1_databases',
            'cloudflare_get_d1_database',
            'cloudflare_create_d1_database',
            'cloudflare_delete_d1_database',
            'cloudflare_query_d1_database',
          ],
          r2: [
            'cloudflare_list_r2_buckets',
            'cloudflare_get_r2_bucket',
            'cloudflare_create_r2_bucket',
            'cloudflare_delete_r2_bucket',
          ],
          pages: [
            'cloudflare_list_pages_projects',
            'cloudflare_get_pages_project',
            'cloudflare_create_pages_project',
            'cloudflare_delete_pages_project',
            'cloudflare_list_pages_deployments',
            'cloudflare_get_pages_deployment',
            'cloudflare_delete_pages_deployment',
            'cloudflare_rollback_pages_deployment',
          ],
          cache: [
            'cloudflare_purge_all_cache',
            'cloudflare_purge_cache_by_url',
            'cloudflare_purge_cache_by_tag',
            'cloudflare_purge_cache_by_host',
          ],
          firewall: [
            'cloudflare_list_firewall_rules',
            'cloudflare_get_firewall_rule',
            'cloudflare_create_firewall_rule',
            'cloudflare_update_firewall_rule',
            'cloudflare_delete_firewall_rule',
            'cloudflare_list_filters',
          ],
          waf: [
            'cloudflare_list_waf_packages',
            'cloudflare_list_waf_rules',
            'cloudflare_update_waf_rule',
          ],
          load_balancers: [
            'cloudflare_list_load_balancers',
            'cloudflare_get_load_balancer',
            'cloudflare_list_load_balancer_pools',
            'cloudflare_get_load_balancer_pool',
            'cloudflare_list_load_balancer_monitors',
          ],
          ssl: ['cloudflare_list_ssl_certificates'],
          accounts: [
            'cloudflare_get_user',
            'cloudflare_list_accounts',
            'cloudflare_get_account',
            'cloudflare_list_account_members',
          ],
          analytics: ['cloudflare_get_zone_analytics', 'cloudflare_get_dns_analytics'],
          connection: ['cloudflare_test_connection'],
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
