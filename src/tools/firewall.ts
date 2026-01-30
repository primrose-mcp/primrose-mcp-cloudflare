/**
 * Firewall Tools
 *
 * MCP tools for Cloudflare firewall and security management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

const FIREWALL_ACTIONS = [
  'block',
  'challenge',
  'js_challenge',
  'managed_challenge',
  'allow',
  'log',
  'bypass',
] as const;

/**
 * Register all firewall-related tools
 */
export function registerFirewallTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List Firewall Rules
  // ===========================================================================
  server.tool(
    'cloudflare_list_firewall_rules',
    `List all firewall rules for a zone.

Args:
  - zone_id: The zone ID
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, format }) => {
      try {
        const rules = await client.listFirewallRules(zone_id);
        return formatResponse(
          { items: rules, count: rules.length, hasMore: false },
          format,
          'firewall_rules'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Firewall Rule
  // ===========================================================================
  server.tool(
    'cloudflare_get_firewall_rule',
    `Get a specific firewall rule.

Args:
  - zone_id: The zone ID
  - rule_id: The rule ID
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      rule_id: z.string().describe('Rule ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, rule_id, format }) => {
      try {
        const rule = await client.getFirewallRule(zone_id, rule_id);
        return formatResponse(rule, format, 'firewall_rule');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create Firewall Rule
  // ===========================================================================
  server.tool(
    'cloudflare_create_firewall_rule',
    `Create a new firewall rule.

Filter expression examples:
  - (ip.src eq 192.168.1.1)
  - (http.request.uri.path contains "/admin")
  - (ip.geoip.country eq "CN")
  - (cf.threat_score gt 10)
  - (http.request.method eq "POST" and http.request.uri.path eq "/api/login")

Actions:
  - block: Block the request
  - challenge: Show a CAPTCHA challenge
  - js_challenge: Show a JavaScript challenge
  - managed_challenge: Cloudflare decides the challenge type
  - allow: Allow the request (bypass other rules)
  - log: Log the request without action
  - bypass: Bypass specific security features

Args:
  - zone_id: The zone ID
  - expression: Filter expression
  - action: Action to take
  - description: Rule description (optional)
  - paused: Whether the rule is paused (default: false)`,
    {
      zone_id: z.string().describe('Zone ID'),
      expression: z.string().describe('Filter expression'),
      action: z.enum(FIREWALL_ACTIONS).describe('Action to take'),
      description: z.string().optional().describe('Rule description'),
      paused: z.boolean().default(false).describe('Whether rule is paused'),
    },
    async ({ zone_id, expression, action, description, paused }) => {
      try {
        const rules = await client.createFirewallRule(zone_id, {
          action,
          filter: {
            expression,
            paused: false,
          },
          description,
          paused,
        });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Firewall rule created',
                  rule: rules[0],
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
  // Update Firewall Rule
  // ===========================================================================
  server.tool(
    'cloudflare_update_firewall_rule',
    `Update an existing firewall rule.

Args:
  - zone_id: The zone ID
  - rule_id: The rule ID
  - action: New action (optional)
  - description: New description (optional)
  - paused: New paused status (optional)`,
    {
      zone_id: z.string().describe('Zone ID'),
      rule_id: z.string().describe('Rule ID'),
      action: z.enum(FIREWALL_ACTIONS).optional().describe('New action'),
      description: z.string().optional().describe('New description'),
      paused: z.boolean().optional().describe('New paused status'),
    },
    async ({ zone_id, rule_id, action, description, paused }) => {
      try {
        const input: {
          action?: typeof FIREWALL_ACTIONS[number];
          description?: string;
          paused?: boolean;
        } = {};
        if (action) input.action = action;
        if (description !== undefined) input.description = description;
        if (paused !== undefined) input.paused = paused;

        const rule = await client.updateFirewallRule(zone_id, rule_id, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: 'Firewall rule updated',
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

  // ===========================================================================
  // Delete Firewall Rule
  // ===========================================================================
  server.tool(
    'cloudflare_delete_firewall_rule',
    `Delete a firewall rule.

Args:
  - zone_id: The zone ID
  - rule_id: The rule ID`,
    {
      zone_id: z.string().describe('Zone ID'),
      rule_id: z.string().describe('Rule ID'),
    },
    async ({ zone_id, rule_id }) => {
      try {
        await client.deleteFirewallRule(zone_id, rule_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Firewall rule ${rule_id} deleted`,
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
  // List Filters
  // ===========================================================================
  server.tool(
    'cloudflare_list_filters',
    `List all filters for a zone.

Filters are the expressions used in firewall rules.

Args:
  - zone_id: The zone ID
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, format }) => {
      try {
        const filters = await client.listFilters(zone_id);
        return formatResponse(
          { items: filters, count: filters.length, hasMore: false },
          format,
          'filters'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
