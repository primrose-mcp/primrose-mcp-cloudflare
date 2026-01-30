/**
 * Analytics Tools
 *
 * MCP tools for Cloudflare analytics and metrics.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all analytics-related tools
 */
export function registerAnalyticsTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // Get Zone Analytics
  // ===========================================================================
  server.tool(
    'cloudflare_get_zone_analytics',
    `Get analytics dashboard data for a zone.

Returns traffic statistics including requests, bandwidth, threats, and page views.

Time range examples:
  - Last 24 hours: since=-1440 (minutes)
  - Last 7 days: since=-10080
  - Specific range: since=2024-01-01T00:00:00Z until=2024-01-02T00:00:00Z

Args:
  - zone_id: The zone ID
  - since: Start time (ISO 8601 or negative minutes from now)
  - until: End time (ISO 8601 or negative minutes from now)
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      since: z.string().optional().describe('Start time (ISO 8601 or -minutes)'),
      until: z.string().optional().describe('End time (ISO 8601 or -minutes)'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, since, until, format }) => {
      try {
        const analytics = await client.getZoneAnalytics(zone_id, since, until);
        return formatResponse(analytics, format, 'zone_analytics');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get DNS Analytics
  // ===========================================================================
  server.tool(
    'cloudflare_get_dns_analytics',
    `Get DNS analytics for a zone.

Available dimensions:
  - queryName: Query name (domain being queried)
  - queryType: Query type (A, AAAA, CNAME, etc.)
  - responseCode: Response code (NOERROR, NXDOMAIN, etc.)
  - coloName: Cloudflare colo name

Available metrics:
  - queryCount: Number of queries

Args:
  - zone_id: The zone ID
  - dimensions: Dimensions to group by (as JSON array)
  - metrics: Metrics to return (as JSON array)
  - since: Start time
  - until: End time
  - format: Response format`,
    {
      zone_id: z.string().describe('Zone ID'),
      dimensions: z.string().optional().describe('Dimensions as JSON array (e.g., \'["queryName", "queryType"]\')'),
      metrics: z.string().optional().describe('Metrics as JSON array (e.g., \'["queryCount"]\')'),
      since: z.string().optional().describe('Start time'),
      until: z.string().optional().describe('End time'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ zone_id, dimensions, metrics, since, until, format }) => {
      try {
        let parsedDimensions: string[] | undefined;
        let parsedMetrics: string[] | undefined;

        if (dimensions) {
          try {
            parsedDimensions = JSON.parse(dimensions);
          } catch {
            parsedDimensions = [dimensions];
          }
        }

        if (metrics) {
          try {
            parsedMetrics = JSON.parse(metrics);
          } catch {
            parsedMetrics = [metrics];
          }
        }

        const analytics = await client.getDnsAnalytics(
          zone_id,
          parsedDimensions,
          parsedMetrics,
          since,
          until
        );
        return formatResponse(analytics, format, 'dns_analytics');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
