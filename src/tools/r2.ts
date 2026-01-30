/**
 * R2 Tools
 *
 * MCP tools for Cloudflare R2 (object storage) management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all R2-related tools
 */
export function registerR2Tools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List R2 Buckets
  // ===========================================================================
  server.tool(
    'cloudflare_list_r2_buckets',
    `List all R2 buckets in an account.

Args:
  - account_id: The account ID
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, format }) => {
      try {
        const buckets = await client.listR2Buckets(account_id);
        return formatResponse(
          { items: buckets, count: buckets.length, hasMore: false },
          format,
          'r2_buckets'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get R2 Bucket
  // ===========================================================================
  server.tool(
    'cloudflare_get_r2_bucket',
    `Get details of a specific R2 bucket.

Args:
  - account_id: The account ID
  - bucket_name: The bucket name
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      bucket_name: z.string().describe('Bucket name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, bucket_name, format }) => {
      try {
        const bucket = await client.getR2Bucket(account_id, bucket_name);
        return formatResponse(bucket, format, 'r2_bucket');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create R2 Bucket
  // ===========================================================================
  server.tool(
    'cloudflare_create_r2_bucket',
    `Create a new R2 bucket.

Bucket names must:
  - Be 3-63 characters long
  - Start with a letter or number
  - Contain only lowercase letters, numbers, and hyphens
  - Not end with a hyphen

Location hints:
  - wnam: Western North America
  - enam: Eastern North America
  - weur: Western Europe
  - eeur: Eastern Europe
  - apac: Asia Pacific

Args:
  - account_id: The account ID
  - name: The bucket name
  - location_hint: Preferred location for the bucket (optional)`,
    {
      account_id: z.string().describe('Account ID'),
      name: z.string().describe('Bucket name'),
      location_hint: z.string().optional().describe('Location hint (wnam, enam, weur, eeur, apac)'),
    },
    async ({ account_id, name, location_hint }) => {
      try {
        const bucket = await client.createR2Bucket(account_id, name, location_hint);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `R2 bucket "${name}" created`,
                  bucket,
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
  // Delete R2 Bucket
  // ===========================================================================
  server.tool(
    'cloudflare_delete_r2_bucket',
    `Delete an R2 bucket.

WARNING: The bucket must be empty before it can be deleted.

Args:
  - account_id: The account ID
  - bucket_name: The bucket name`,
    {
      account_id: z.string().describe('Account ID'),
      bucket_name: z.string().describe('Bucket name'),
    },
    async ({ account_id, bucket_name }) => {
      try {
        await client.deleteR2Bucket(account_id, bucket_name);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `R2 bucket "${bucket_name}" deleted`,
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
