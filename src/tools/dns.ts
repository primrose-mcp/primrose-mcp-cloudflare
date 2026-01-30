/**
 * DNS Tools
 *
 * MCP tools for Cloudflare DNS record management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import type { DnsRecordType } from '../types/cloudflare.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

const DNS_RECORD_TYPES = [
  'A',
  'AAAA',
  'CNAME',
  'TXT',
  'MX',
  'NS',
  'SRV',
  'CAA',
  'PTR',
  'HTTPS',
  'SVCB',
] as const;

/**
 * Register all DNS-related tools
 */
export function registerDnsTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List DNS Records
  // ===========================================================================
  server.tool(
    'cloudflare_list_dns_records',
    `List DNS records for a zone.

Returns all DNS records with their type, name, content, TTL, and proxy status.

Args:
  - zone_id: The zone ID
  - type: Filter by record type (A, AAAA, CNAME, TXT, MX, etc.)
  - name: Filter by record name
  - content: Filter by record content
  - page: Page number (default: 1)
  - per_page: Results per page (1-100, default: 20)
  - format: Response format ('json' or 'markdown')`,
    {
      zone_id: z.string().describe('Zone ID'),
      type: z.string().optional().describe('Filter by record type (A, AAAA, CNAME, TXT, MX, etc.)'),
      name: z.string().optional().describe('Filter by record name'),
      content: z.string().optional().describe('Filter by record content'),
      page: z.number().int().min(1).default(1),
      per_page: z.number().int().min(1).max(100).default(20),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, type, name, content, page, per_page, format }) => {
      try {
        const result = await client.listDnsRecords(zone_id, { type, name, content, page, per_page });
        return formatResponse(result, format, 'dns_records');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get DNS Record
  // ===========================================================================
  server.tool(
    'cloudflare_get_dns_record',
    `Get a specific DNS record by ID.

Args:
  - zone_id: The zone ID
  - record_id: The DNS record ID
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      record_id: z.string().describe('DNS record ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, record_id, format }) => {
      try {
        const record = await client.getDnsRecord(zone_id, record_id);
        return formatResponse(record, format, 'dns_record');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create DNS Record
  // ===========================================================================
  server.tool(
    'cloudflare_create_dns_record',
    `Create a new DNS record.

Common record types:
  - A: Maps domain to IPv4 address
  - AAAA: Maps domain to IPv6 address
  - CNAME: Alias to another domain
  - TXT: Text record (SPF, DKIM, verification, etc.)
  - MX: Mail exchange server (requires priority)

Args:
  - zone_id: The zone ID
  - type: Record type (A, AAAA, CNAME, TXT, MX, etc.)
  - name: Record name (e.g., "@" for root, "www", "subdomain")
  - content: Record content (IP address, domain, text, etc.)
  - ttl: Time to live in seconds (1 = automatic)
  - proxied: Whether to proxy through Cloudflare (default: false)
  - priority: Priority for MX/SRV records
  - comment: Optional comment for the record`,
    {
      zone_id: z.string().describe('Zone ID'),
      type: z.enum(DNS_RECORD_TYPES).describe('Record type'),
      name: z.string().describe('Record name (@ for root, or subdomain)'),
      content: z.string().describe('Record content (IP, domain, text, etc.)'),
      ttl: z.number().int().min(1).default(1).describe('TTL in seconds (1 = automatic)'),
      proxied: z.boolean().default(false).describe('Proxy through Cloudflare'),
      priority: z.number().int().optional().describe('Priority for MX/SRV records'),
      comment: z.string().optional().describe('Optional comment'),
    },
    async ({ zone_id, type, name, content, ttl, proxied, priority, comment }) => {
      try {
        const record = await client.createDnsRecord(zone_id, {
          type: type as DnsRecordType,
          name,
          content,
          ttl,
          proxied,
          priority,
          comment,
        });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `DNS record created: ${record.type} ${record.name}`,
                  record,
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
  // Update DNS Record
  // ===========================================================================
  server.tool(
    'cloudflare_update_dns_record',
    `Update an existing DNS record.

Args:
  - zone_id: The zone ID
  - record_id: The DNS record ID to update
  - type: New record type (optional)
  - name: New record name (optional)
  - content: New record content (optional)
  - ttl: New TTL in seconds (optional)
  - proxied: New proxy status (optional)
  - comment: New comment (optional)`,
    {
      zone_id: z.string().describe('Zone ID'),
      record_id: z.string().describe('DNS record ID'),
      type: z.enum(DNS_RECORD_TYPES).optional().describe('Record type'),
      name: z.string().optional().describe('Record name'),
      content: z.string().optional().describe('Record content'),
      ttl: z.number().int().min(1).optional().describe('TTL in seconds'),
      proxied: z.boolean().optional().describe('Proxy through Cloudflare'),
      comment: z.string().optional().describe('Comment'),
    },
    async ({ zone_id, record_id, type, name, content, ttl, proxied, comment }) => {
      try {
        const input: {
          type?: DnsRecordType;
          name?: string;
          content?: string;
          ttl?: number;
          proxied?: boolean;
          comment?: string;
        } = {};
        if (type) input.type = type as DnsRecordType;
        if (name) input.name = name;
        if (content) input.content = content;
        if (ttl !== undefined) input.ttl = ttl;
        if (proxied !== undefined) input.proxied = proxied;
        if (comment !== undefined) input.comment = comment;

        const record = await client.updateDnsRecord(zone_id, record_id, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `DNS record updated: ${record.type} ${record.name}`,
                  record,
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
  // Delete DNS Record
  // ===========================================================================
  server.tool(
    'cloudflare_delete_dns_record',
    `Delete a DNS record.

Args:
  - zone_id: The zone ID
  - record_id: The DNS record ID to delete`,
    {
      zone_id: z.string().describe('Zone ID'),
      record_id: z.string().describe('DNS record ID to delete'),
    },
    async ({ zone_id, record_id }) => {
      try {
        const result = await client.deleteDnsRecord(zone_id, record_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `DNS record ${result.id} deleted successfully`,
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
  // Export DNS Records
  // ===========================================================================
  server.tool(
    'cloudflare_export_dns_records',
    `Export all DNS records for a zone in BIND format.

Returns the zone file as a string that can be imported to other DNS providers.

Args:
  - zone_id: The zone ID`,
    {
      zone_id: z.string().describe('Zone ID'),
    },
    async ({ zone_id }) => {
      try {
        const zonefile = await client.exportDnsRecords(zone_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: zonefile,
            },
          ],
        };
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Import DNS Records
  // ===========================================================================
  server.tool(
    'cloudflare_import_dns_records',
    `Import DNS records from a BIND zone file.

The file should be in standard BIND zone file format.

Args:
  - zone_id: The zone ID
  - file_content: The zone file content as a string`,
    {
      zone_id: z.string().describe('Zone ID'),
      file_content: z.string().describe('Zone file content in BIND format'),
    },
    async ({ zone_id, file_content }) => {
      try {
        const result = await client.importDnsRecords(zone_id, file_content);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Imported ${result.total_records_parsed} DNS records`,
                  ...result,
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
