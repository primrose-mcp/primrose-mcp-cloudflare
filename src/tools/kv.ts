/**
 * KV Tools
 *
 * MCP tools for Cloudflare Workers KV (Key-Value) storage management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all KV-related tools
 */
export function registerKvTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List KV Namespaces
  // ===========================================================================
  server.tool(
    'cloudflare_list_kv_namespaces',
    `List all KV namespaces in an account.

Args:
  - account_id: The account ID
  - page: Page number (default: 1)
  - per_page: Results per page (default: 20)
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      page: z.number().int().min(1).default(1),
      per_page: z.number().int().min(1).max(100).default(20),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, page, per_page, format }) => {
      try {
        const result = await client.listKvNamespaces(account_id, { page, per_page });
        return formatResponse(result, format, 'kv_namespaces');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get KV Namespace
  // ===========================================================================
  server.tool(
    'cloudflare_get_kv_namespace',
    `Get details of a specific KV namespace.

Args:
  - account_id: The account ID
  - namespace_id: The namespace ID
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      namespace_id: z.string().describe('Namespace ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, namespace_id, format }) => {
      try {
        const namespace = await client.getKvNamespace(account_id, namespace_id);
        return formatResponse(namespace, format, 'kv_namespace');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create KV Namespace
  // ===========================================================================
  server.tool(
    'cloudflare_create_kv_namespace',
    `Create a new KV namespace.

Args:
  - account_id: The account ID
  - title: The namespace title (must be unique in the account)`,
    {
      account_id: z.string().describe('Account ID'),
      title: z.string().describe('Namespace title'),
    },
    async ({ account_id, title }) => {
      try {
        const namespace = await client.createKvNamespace(account_id, title);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `KV namespace "${title}" created`,
                  namespace,
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
  // Rename KV Namespace
  // ===========================================================================
  server.tool(
    'cloudflare_rename_kv_namespace',
    `Rename a KV namespace.

Args:
  - account_id: The account ID
  - namespace_id: The namespace ID
  - title: The new title`,
    {
      account_id: z.string().describe('Account ID'),
      namespace_id: z.string().describe('Namespace ID'),
      title: z.string().describe('New namespace title'),
    },
    async ({ account_id, namespace_id, title }) => {
      try {
        await client.renameKvNamespace(account_id, namespace_id, title);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `KV namespace renamed to "${title}"`,
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
  // Delete KV Namespace
  // ===========================================================================
  server.tool(
    'cloudflare_delete_kv_namespace',
    `Delete a KV namespace.

WARNING: This will delete all keys in the namespace.

Args:
  - account_id: The account ID
  - namespace_id: The namespace ID`,
    {
      account_id: z.string().describe('Account ID'),
      namespace_id: z.string().describe('Namespace ID'),
    },
    async ({ account_id, namespace_id }) => {
      try {
        await client.deleteKvNamespace(account_id, namespace_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `KV namespace ${namespace_id} deleted`,
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
  // List KV Keys
  // ===========================================================================
  server.tool(
    'cloudflare_list_kv_keys',
    `List keys in a KV namespace.

Returns key names with optional metadata. Use cursor for pagination.

Args:
  - account_id: The account ID
  - namespace_id: The namespace ID
  - prefix: Filter keys by prefix (optional)
  - cursor: Pagination cursor from previous response (optional)
  - limit: Max keys to return (1-1000, default: 1000)
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      namespace_id: z.string().describe('Namespace ID'),
      prefix: z.string().optional().describe('Filter by key prefix'),
      cursor: z.string().optional().describe('Pagination cursor'),
      limit: z.number().int().min(1).max(1000).default(1000),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, namespace_id, prefix, cursor, limit, format }) => {
      try {
        const result = await client.listKvKeys(account_id, namespace_id, { prefix, cursor, limit });
        return formatResponse(
          {
            items: result.keys,
            count: result.keys.length,
            hasMore: !result.list_complete,
            cursor: result.cursor,
          },
          format,
          'kv_keys'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get KV Value
  // ===========================================================================
  server.tool(
    'cloudflare_get_kv_value',
    `Get the value of a key from a KV namespace.

Returns the raw value as a string.

Args:
  - account_id: The account ID
  - namespace_id: The namespace ID
  - key: The key name`,
    {
      account_id: z.string().describe('Account ID'),
      namespace_id: z.string().describe('Namespace ID'),
      key: z.string().describe('Key name'),
    },
    async ({ account_id, namespace_id, key }) => {
      try {
        const value = await client.getKvValue(account_id, namespace_id, key);
        return {
          content: [
            {
              type: 'text' as const,
              text: value,
            },
          ],
        };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Put KV Value
  // ===========================================================================
  server.tool(
    'cloudflare_put_kv_value',
    `Set a key-value pair in a KV namespace.

Args:
  - account_id: The account ID
  - namespace_id: The namespace ID
  - key: The key name
  - value: The value to store (as string)
  - expiration: Unix timestamp when the key should expire (optional)
  - expiration_ttl: Seconds until the key expires (optional)`,
    {
      account_id: z.string().describe('Account ID'),
      namespace_id: z.string().describe('Namespace ID'),
      key: z.string().describe('Key name'),
      value: z.string().describe('Value to store'),
      expiration: z.number().int().optional().describe('Unix timestamp for expiration'),
      expiration_ttl: z.number().int().optional().describe('TTL in seconds'),
    },
    async ({ account_id, namespace_id, key, value, expiration, expiration_ttl }) => {
      try {
        await client.putKvValue(account_id, namespace_id, key, value, {
          expiration,
          expiration_ttl,
        });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Key "${key}" set successfully`,
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
  // Delete KV Value
  // ===========================================================================
  server.tool(
    'cloudflare_delete_kv_value',
    `Delete a key from a KV namespace.

Args:
  - account_id: The account ID
  - namespace_id: The namespace ID
  - key: The key to delete`,
    {
      account_id: z.string().describe('Account ID'),
      namespace_id: z.string().describe('Namespace ID'),
      key: z.string().describe('Key to delete'),
    },
    async ({ account_id, namespace_id, key }) => {
      try {
        await client.deleteKvValue(account_id, namespace_id, key);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Key "${key}" deleted`,
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
}
