/**
 * Zone Tools
 *
 * MCP tools for Cloudflare zone management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all zone-related tools
 */
export function registerZoneTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List Zones
  // ===========================================================================
  server.tool(
    'cloudflare_list_zones',
    `List all zones (domains) in your Cloudflare account.

Returns a paginated list of zones with their status, plan, and configuration.

Args:
  - name: Filter by zone name (optional)
  - status: Filter by status (active, pending, etc.) (optional)
  - page: Page number (default: 1)
  - per_page: Results per page (1-100, default: 20)
  - format: Response format ('json' or 'markdown')`,
    {
      name: z.string().optional().describe('Filter by zone name'),
      status: z.string().optional().describe('Filter by status (active, pending, etc.)'),
      page: z.number().int().min(1).default(1).describe('Page number'),
      per_page: z.number().int().min(1).max(100).default(20).describe('Results per page'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ name, status, page, per_page, format }) => {
      try {
        const result = await client.listZones({ name, status, page, per_page });
        return formatResponse(result, format, 'zones');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Zone
  // ===========================================================================
  server.tool(
    'cloudflare_get_zone',
    `Get detailed information about a specific zone.

Args:
  - zone_id: The zone ID
  - format: Response format ('json' or 'markdown')`,
    {
      zone_id: z.string().describe('Zone ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, format }) => {
      try {
        const zone = await client.getZone(zone_id);
        return formatResponse(zone, format, 'zone');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create Zone
  // ===========================================================================
  server.tool(
    'cloudflare_create_zone',
    `Add a new zone (domain) to your Cloudflare account.

Args:
  - name: The domain name (e.g., "example.com")
  - account_id: The account ID to add the zone to
  - type: Zone type ('full' for full setup, 'partial' for CNAME setup)
  - jump_start: Whether to scan for existing DNS records (default: true)`,
    {
      name: z.string().describe('Domain name (e.g., "example.com")'),
      account_id: z.string().describe('Account ID'),
      type: z.enum(['full', 'partial', 'secondary']).default('full').describe('Zone type'),
      jump_start: z.boolean().default(true).describe('Scan for existing DNS records'),
    },
    async ({ name, account_id, type, jump_start }) => {
      try {
        const zone = await client.createZone({
          name,
          account: { id: account_id },
          type,
          jump_start,
        });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Zone ${name} created successfully`,
                  zone,
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
  // Update Zone
  // ===========================================================================
  server.tool(
    'cloudflare_update_zone',
    `Update zone settings.

Args:
  - zone_id: The zone ID
  - paused: Pause the zone (stops all Cloudflare features)
  - plan_id: Change the zone plan
  - type: Change zone type`,
    {
      zone_id: z.string().describe('Zone ID'),
      paused: z.boolean().optional().describe('Pause the zone'),
      plan_id: z.string().optional().describe('New plan ID'),
      type: z.enum(['full', 'partial', 'secondary']).optional().describe('Zone type'),
    },
    async ({ zone_id, paused, plan_id, type }) => {
      try {
        const input: { paused?: boolean; plan?: { id: string }; type?: 'full' | 'partial' | 'secondary' } = {};
        if (paused !== undefined) input.paused = paused;
        if (plan_id) input.plan = { id: plan_id };
        if (type) input.type = type;

        const zone = await client.updateZone(zone_id, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Zone updated successfully',
                  zone,
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
  // Delete Zone
  // ===========================================================================
  server.tool(
    'cloudflare_delete_zone',
    `Delete a zone from Cloudflare.

WARNING: This will remove the zone and all its settings permanently.

Args:
  - zone_id: The zone ID to delete`,
    {
      zone_id: z.string().describe('Zone ID to delete'),
    },
    async ({ zone_id }) => {
      try {
        const result = await client.deleteZone(zone_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Zone ${result.id} deleted successfully`,
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
  // Get Zone Settings
  // ===========================================================================
  server.tool(
    'cloudflare_get_zone_settings',
    `Get all settings for a zone.

Returns settings like SSL mode, minification, caching, security settings, etc.

Args:
  - zone_id: The zone ID
  - format: Response format ('json' or 'markdown')`,
    {
      zone_id: z.string().describe('Zone ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, format }) => {
      try {
        const settings = await client.getZoneSettings(zone_id);
        return formatResponse(settings, format, 'zone_settings');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Update Zone Setting
  // ===========================================================================
  server.tool(
    'cloudflare_update_zone_setting',
    `Update a specific zone setting.

Common settings:
  - ssl: SSL/TLS encryption mode (off, flexible, full, strict)
  - always_use_https: Redirect HTTP to HTTPS (on/off)
  - min_tls_version: Minimum TLS version (1.0, 1.1, 1.2, 1.3)
  - automatic_https_rewrites: Rewrite HTTP to HTTPS in content (on/off)
  - browser_cache_ttl: Browser cache TTL in seconds
  - development_mode: Development mode (on/off)
  - security_level: Security level (off, essentially_off, low, medium, high, under_attack)
  - waf: Web Application Firewall (on/off)
  - minify: Minification settings (object with css, html, js)

Args:
  - zone_id: The zone ID
  - setting_id: The setting ID to update
  - value: The new value for the setting`,
    {
      zone_id: z.string().describe('Zone ID'),
      setting_id: z.string().describe('Setting ID (e.g., ssl, always_use_https)'),
      value: z.unknown().describe('New value for the setting'),
    },
    async ({ zone_id, setting_id, value }) => {
      try {
        const setting = await client.updateZoneSetting(zone_id, setting_id, value);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Setting ${setting_id} updated successfully`,
                  setting,
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
  // Activation Check
  // ===========================================================================
  server.tool(
    'cloudflare_zone_activation_check',
    `Trigger a check to verify zone activation status.

Use this for zones that are in "pending" status to check if the nameservers have been updated.

Args:
  - zone_id: The zone ID`,
    {
      zone_id: z.string().describe('Zone ID'),
    },
    async ({ zone_id }) => {
      try {
        const result = await client.activationCheck(zone_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Activation check triggered',
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
