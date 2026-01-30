/**
 * WAF Tools
 *
 * MCP tools for Cloudflare Web Application Firewall management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all WAF-related tools
 */
export function registerWafTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List WAF Packages
  // ===========================================================================
  server.tool(
    'cloudflare_list_waf_packages',
    `List all WAF packages for a zone.

WAF packages contain groups of rules that protect against different threats.
Common packages include Cloudflare Managed Ruleset and OWASP Core Ruleset.

Args:
  - zone_id: The zone ID
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, format }) => {
      try {
        const packages = await client.listWafPackages(zone_id);
        return formatResponse(
          { items: packages, count: packages.length, hasMore: false },
          format,
          'waf_packages'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // List WAF Rules
  // ===========================================================================
  server.tool(
    'cloudflare_list_waf_rules',
    `List all WAF rules in a package.

Args:
  - zone_id: The zone ID
  - package_id: The WAF package ID
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      package_id: z.string().describe('WAF package ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, package_id, format }) => {
      try {
        const rules = await client.listWafRules(zone_id, package_id);
        return formatResponse(
          { items: rules, count: rules.length, hasMore: false },
          format,
          'waf_rules'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Update WAF Rule
  // ===========================================================================
  server.tool(
    'cloudflare_update_waf_rule',
    `Update the mode of a WAF rule.

Modes:
  - default: Use the default action for this rule
  - disable: Disable the rule
  - simulate: Log matches but don't take action
  - block: Block matching requests
  - challenge: Present a challenge to matching requests

Args:
  - zone_id: The zone ID
  - package_id: The WAF package ID
  - rule_id: The rule ID
  - mode: The new mode for the rule`,
    {
      zone_id: z.string().describe('Zone ID'),
      package_id: z.string().describe('WAF package ID'),
      rule_id: z.string().describe('Rule ID'),
      mode: z.enum(['default', 'disable', 'simulate', 'block', 'challenge']).describe('Rule mode'),
    },
    async ({ zone_id, package_id, rule_id, mode }) => {
      try {
        const rule = await client.updateWafRule(zone_id, package_id, rule_id, mode);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `WAF rule ${rule_id} mode updated to ${mode}`,
                  rule,
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
