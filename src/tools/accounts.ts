/**
 * Account Tools
 *
 * MCP tools for Cloudflare account and user management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all account-related tools
 */
export function registerAccountTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // Get User
  // ===========================================================================
  server.tool(
    'cloudflare_get_user',
    `Get the currently authenticated user's details.

Returns the user's email, name, and account settings.

Args:
  - format: Response format`,
    {
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ format }) => {
      try {
        const user = await client.getUser();
        return formatResponse(user, format, 'user');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // List Accounts
  // ===========================================================================
  server.tool(
    'cloudflare_list_accounts',
    `List all accounts the user has access to.

Args:
  - page: Page number (default: 1)
  - per_page: Results per page (default: 20)
  - format: Response format`,
    {
      page: z.number().int().min(1).default(1),
      per_page: z.number().int().min(1).max(100).default(20),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ page, per_page, format }) => {
      try {
        const result = await client.listAccounts({ page, per_page });
        return formatResponse(result, format, 'accounts');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Account
  // ===========================================================================
  server.tool(
    'cloudflare_get_account',
    `Get details of a specific account.

Args:
  - account_id: The account ID
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, format }) => {
      try {
        const account = await client.getAccount(account_id);
        return formatResponse(account, format, 'account');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // List Account Members
  // ===========================================================================
  server.tool(
    'cloudflare_list_account_members',
    `List all members of an account.

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
        const result = await client.listAccountMembers(account_id, { page, per_page });
        return formatResponse(result, format, 'account_members');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
