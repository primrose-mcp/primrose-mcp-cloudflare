/**
 * D1 Tools
 *
 * MCP tools for Cloudflare D1 (SQLite database) management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all D1-related tools
 */
export function registerD1Tools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List D1 Databases
  // ===========================================================================
  server.tool(
    'cloudflare_list_d1_databases',
    `List all D1 databases in an account.

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
        const result = await client.listD1Databases(account_id, { page, per_page });
        return formatResponse(result, format, 'd1_databases');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get D1 Database
  // ===========================================================================
  server.tool(
    'cloudflare_get_d1_database',
    `Get details of a specific D1 database.

Args:
  - account_id: The account ID
  - database_id: The database UUID
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      database_id: z.string().describe('Database UUID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, database_id, format }) => {
      try {
        const database = await client.getD1Database(account_id, database_id);
        return formatResponse(database, format, 'd1_database');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create D1 Database
  // ===========================================================================
  server.tool(
    'cloudflare_create_d1_database',
    `Create a new D1 database.

Args:
  - account_id: The account ID
  - name: The database name`,
    {
      account_id: z.string().describe('Account ID'),
      name: z.string().describe('Database name'),
    },
    async ({ account_id, name }) => {
      try {
        const database = await client.createD1Database(account_id, name);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `D1 database "${name}" created`,
                  database,
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
  // Delete D1 Database
  // ===========================================================================
  server.tool(
    'cloudflare_delete_d1_database',
    `Delete a D1 database.

WARNING: This will permanently delete the database and all its data.

Args:
  - account_id: The account ID
  - database_id: The database UUID`,
    {
      account_id: z.string().describe('Account ID'),
      database_id: z.string().describe('Database UUID'),
    },
    async ({ account_id, database_id }) => {
      try {
        await client.deleteD1Database(account_id, database_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `D1 database ${database_id} deleted`,
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
  // Query D1 Database
  // ===========================================================================
  server.tool(
    'cloudflare_query_d1_database',
    `Execute a SQL query on a D1 database.

Supports both read and write operations (SELECT, INSERT, UPDATE, DELETE, CREATE, etc.).

Examples:
  - SELECT * FROM users WHERE id = ?
  - INSERT INTO users (name, email) VALUES (?, ?)
  - CREATE TABLE posts (id INTEGER PRIMARY KEY, title TEXT)

Args:
  - account_id: The account ID
  - database_id: The database UUID
  - sql: The SQL query to execute
  - params: Query parameters for prepared statements (optional, as JSON array)
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      database_id: z.string().describe('Database UUID'),
      sql: z.string().describe('SQL query'),
      params: z.string().optional().describe('Query parameters as JSON array (e.g., \'["value1", 123]\')'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, database_id, sql, params, format }) => {
      try {
        let parsedParams: unknown[] | undefined;
        if (params) {
          try {
            parsedParams = JSON.parse(params);
            if (!Array.isArray(parsedParams)) {
              throw new Error('Params must be a JSON array');
            }
          } catch (e) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify(
                    {
                      error: 'Invalid params format',
                      message: 'params must be a valid JSON array (e.g., \'["value1", 123]\')',
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }
        }

        const results = await client.queryD1Database(account_id, database_id, sql, parsedParams);

        // D1 returns an array of result sets (one per statement)
        const response = results.map((result, index) => ({
          statement: index + 1,
          success: result.success,
          results: result.results,
          meta: {
            duration_ms: result.meta.duration,
            changes: result.meta.changes,
            rows_read: result.meta.rows_read,
            rows_written: result.meta.rows_written,
          },
        }));

        return formatResponse(response, format, 'd1_query_results');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
