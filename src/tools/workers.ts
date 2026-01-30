/**
 * Workers Tools
 *
 * MCP tools for Cloudflare Workers management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all Workers-related tools
 */
export function registerWorkersTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List Workers
  // ===========================================================================
  server.tool(
    'cloudflare_list_workers',
    `List all Workers scripts in an account.

Returns all deployed Workers with their metadata.

Args:
  - account_id: The account ID
  - format: Response format ('json' or 'markdown')`,
    {
      account_id: z.string().describe('Account ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, format }) => {
      try {
        const workers = await client.listWorkers(account_id);
        return formatResponse({ items: workers, count: workers.length, hasMore: false }, format, 'workers');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Worker Script
  // ===========================================================================
  server.tool(
    'cloudflare_get_worker',
    `Get the source code of a Worker script.

Returns the JavaScript/TypeScript source code.

Args:
  - account_id: The account ID
  - script_name: The Worker script name`,
    {
      account_id: z.string().describe('Account ID'),
      script_name: z.string().describe('Worker script name'),
    },
    async ({ account_id, script_name }) => {
      try {
        const script = await client.getWorker(account_id, script_name);
        return {
          content: [
            {
              type: 'text' as const,
              text: script,
            },
          ],
        };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Delete Worker
  // ===========================================================================
  server.tool(
    'cloudflare_delete_worker',
    `Delete a Worker script.

WARNING: This will permanently delete the Worker and all its versions.

Args:
  - account_id: The account ID
  - script_name: The Worker script name to delete`,
    {
      account_id: z.string().describe('Account ID'),
      script_name: z.string().describe('Worker script name'),
    },
    async ({ account_id, script_name }) => {
      try {
        await client.deleteWorker(account_id, script_name);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Worker ${script_name} deleted successfully`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // List Worker Routes
  // ===========================================================================
  server.tool(
    'cloudflare_list_worker_routes',
    `List all Worker routes for a zone.

Routes map URL patterns to Worker scripts.

Args:
  - zone_id: The zone ID
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, format }) => {
      try {
        const routes = await client.listWorkerRoutes(zone_id);
        return formatResponse({ items: routes, count: routes.length, hasMore: false }, format, 'worker_routes');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create Worker Route
  // ===========================================================================
  server.tool(
    'cloudflare_create_worker_route',
    `Create a Worker route to map a URL pattern to a Worker.

Pattern examples:
  - example.com/* (all paths on root domain)
  - *.example.com/* (all subdomains and paths)
  - example.com/api/* (specific path prefix)

Args:
  - zone_id: The zone ID
  - pattern: URL pattern to match
  - script: Worker script name (optional, leave empty to disable)`,
    {
      zone_id: z.string().describe('Zone ID'),
      pattern: z.string().describe('URL pattern (e.g., "example.com/*")'),
      script: z.string().optional().describe('Worker script name'),
    },
    async ({ zone_id, pattern, script }) => {
      try {
        const route = await client.createWorkerRoute(zone_id, pattern, script);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Worker route created',
                  route,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Delete Worker Route
  // ===========================================================================
  server.tool(
    'cloudflare_delete_worker_route',
    `Delete a Worker route.

Args:
  - zone_id: The zone ID
  - route_id: The route ID to delete`,
    {
      zone_id: z.string().describe('Zone ID'),
      route_id: z.string().describe('Route ID'),
    },
    async ({ zone_id, route_id }) => {
      try {
        await client.deleteWorkerRoute(zone_id, route_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Worker route ${route_id} deleted`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Worker Cron Triggers
  // ===========================================================================
  server.tool(
    'cloudflare_get_worker_cron_triggers',
    `Get cron triggers (scheduled events) for a Worker.

Args:
  - account_id: The account ID
  - script_name: The Worker script name
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      script_name: z.string().describe('Worker script name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, script_name, format }) => {
      try {
        const triggers = await client.getWorkerCronTriggers(account_id, script_name);
        return formatResponse(
          { items: triggers, count: triggers.length, hasMore: false },
          format,
          'cron_triggers'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // List Worker Secrets
  // ===========================================================================
  server.tool(
    'cloudflare_list_worker_secrets',
    `List all secrets (environment variables) for a Worker.

Note: Only secret names are returned, not values (for security).

Args:
  - account_id: The account ID
  - script_name: The Worker script name
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      script_name: z.string().describe('Worker script name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, script_name, format }) => {
      try {
        const secrets = await client.listWorkerSecrets(account_id, script_name);
        return formatResponse(
          { items: secrets, count: secrets.length, hasMore: false },
          format,
          'worker_secrets'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
