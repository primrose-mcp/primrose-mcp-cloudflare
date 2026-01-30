/**
 * SSL/TLS Tools
 *
 * MCP tools for Cloudflare SSL/TLS certificate management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all SSL/TLS-related tools
 */
export function registerSslTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List SSL Certificates
  // ===========================================================================
  server.tool(
    'cloudflare_list_ssl_certificates',
    `List all SSL/TLS certificate packs for a zone.

Returns Universal SSL, Advanced Certificate Manager, and custom certificates.

Args:
  - zone_id: The zone ID
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, format }) => {
      try {
        const certs = await client.listSslCertificates(zone_id);
        return formatResponse(
          { items: certs, count: certs.length, hasMore: false },
          format,
          'ssl_certificates'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
