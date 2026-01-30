/**
 * Load Balancer Tools
 *
 * MCP tools for Cloudflare Load Balancer management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all load balancer-related tools
 */
export function registerLoadBalancerTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List Load Balancers
  // ===========================================================================
  server.tool(
    'cloudflare_list_load_balancers',
    `List all load balancers for a zone.

Args:
  - zone_id: The zone ID
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, format }) => {
      try {
        const lbs = await client.listLoadBalancers(zone_id);
        return formatResponse(
          { items: lbs, count: lbs.length, hasMore: false },
          format,
          'load_balancers'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Load Balancer
  // ===========================================================================
  server.tool(
    'cloudflare_get_load_balancer',
    `Get details of a specific load balancer.

Args:
  - zone_id: The zone ID
  - lb_id: The load balancer ID
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      lb_id: z.string().describe('Load balancer ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, lb_id, format }) => {
      try {
        const lb = await client.getLoadBalancer(zone_id, lb_id);
        return formatResponse(lb, format, 'load_balancer');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // List Load Balancer Pools
  // ===========================================================================
  server.tool(
    'cloudflare_list_load_balancer_pools',
    `List all load balancer pools in an account.

Pools are collections of origins (servers) that the load balancer distributes traffic to.

Args:
  - account_id: The account ID
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, format }) => {
      try {
        const pools = await client.listLoadBalancerPools(account_id);
        return formatResponse(
          { items: pools, count: pools.length, hasMore: false },
          format,
          'load_balancer_pools'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Load Balancer Pool
  // ===========================================================================
  server.tool(
    'cloudflare_get_load_balancer_pool',
    `Get details of a specific load balancer pool.

Args:
  - account_id: The account ID
  - pool_id: The pool ID
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      pool_id: z.string().describe('Pool ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, pool_id, format }) => {
      try {
        const pool = await client.getLoadBalancerPool(account_id, pool_id);
        return formatResponse(pool, format, 'load_balancer_pool');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // List Load Balancer Monitors
  // ===========================================================================
  server.tool(
    'cloudflare_list_load_balancer_monitors',
    `List all load balancer health monitors in an account.

Monitors check the health of origins in pools and remove unhealthy origins from rotation.

Args:
  - account_id: The account ID
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, format }) => {
      try {
        const monitors = await client.listLoadBalancerMonitors(account_id);
        return formatResponse(
          { items: monitors, count: monitors.length, hasMore: false },
          format,
          'load_balancer_monitors'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
