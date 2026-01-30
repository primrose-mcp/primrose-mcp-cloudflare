/**
 * Cache Tools
 *
 * MCP tools for Cloudflare cache management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse } from '../utils/formatters.js';

/**
 * Register all cache-related tools
 */
export function registerCacheTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // Purge Everything
  // ===========================================================================
  server.tool(
    'cloudflare_purge_all_cache',
    `Purge all cached content for a zone.

WARNING: This removes all cached files. The next requests will need to be
served from your origin server, which may cause increased load.

Args:
  - zone_id: The zone ID`,
    {
      zone_id: z.string().describe('Zone ID'),
    },
    async ({ zone_id }) => {
      try {
        const result = await client.purgeCache(zone_id, { purge_everything: true });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: 'All cache purged successfully',
                  id: result.id,
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
  // Purge by URL
  // ===========================================================================
  server.tool(
    'cloudflare_purge_cache_by_url',
    `Purge specific URLs from cache.

You can purge up to 30 URLs at once.

Args:
  - zone_id: The zone ID
  - urls: Array of URLs to purge (as JSON array string)`,
    {
      zone_id: z.string().describe('Zone ID'),
      urls: z.string().describe('JSON array of URLs to purge (e.g., \'["https://example.com/file.js"]\')'),
    },
    async ({ zone_id, urls }) => {
      try {
        let parsedUrls: string[];
        try {
          parsedUrls = JSON.parse(urls);
          if (!Array.isArray(parsedUrls)) {
            throw new Error('URLs must be an array');
          }
        } catch (e) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    error: 'Invalid URLs format',
                    message: 'urls must be a valid JSON array of strings',
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const result = await client.purgeCache(zone_id, { files: parsedUrls });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Purged ${parsedUrls.length} URL(s) from cache`,
                  urls: parsedUrls,
                  id: result.id,
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
  // Purge by Cache-Tag
  // ===========================================================================
  server.tool(
    'cloudflare_purge_cache_by_tag',
    `Purge cached content by cache tags.

Cache tags must be set via the Cache-Tag response header from your origin.
You can purge up to 30 tags at once.

Args:
  - zone_id: The zone ID
  - tags: Array of cache tags to purge (as JSON array string)`,
    {
      zone_id: z.string().describe('Zone ID'),
      tags: z.string().describe('JSON array of cache tags (e.g., \'["tag1", "tag2"]\')'),
    },
    async ({ zone_id, tags }) => {
      try {
        let parsedTags: string[];
        try {
          parsedTags = JSON.parse(tags);
          if (!Array.isArray(parsedTags)) {
            throw new Error('Tags must be an array');
          }
        } catch (e) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    error: 'Invalid tags format',
                    message: 'tags must be a valid JSON array of strings',
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const result = await client.purgeCache(zone_id, { tags: parsedTags });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Purged ${parsedTags.length} tag(s) from cache`,
                  tags: parsedTags,
                  id: result.id,
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
  // Purge by Host
  // ===========================================================================
  server.tool(
    'cloudflare_purge_cache_by_host',
    `Purge cached content by hostname.

This purges all cached content for the specified hostnames.
You can purge up to 30 hosts at once.

Args:
  - zone_id: The zone ID
  - hosts: Array of hostnames to purge (as JSON array string)`,
    {
      zone_id: z.string().describe('Zone ID'),
      hosts: z.string().describe('JSON array of hostnames (e.g., \'["www.example.com", "api.example.com"]\')'),
    },
    async ({ zone_id, hosts }) => {
      try {
        let parsedHosts: string[];
        try {
          parsedHosts = JSON.parse(hosts);
          if (!Array.isArray(parsedHosts)) {
            throw new Error('Hosts must be an array');
          }
        } catch (e) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    error: 'Invalid hosts format',
                    message: 'hosts must be a valid JSON array of strings',
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        const result = await client.purgeCache(zone_id, { hosts: parsedHosts });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Purged cache for ${parsedHosts.length} host(s)`,
                  hosts: parsedHosts,
                  id: result.id,
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
