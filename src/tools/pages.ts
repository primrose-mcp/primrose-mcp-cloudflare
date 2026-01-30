/**
 * Pages Tools
 *
 * MCP tools for Cloudflare Pages project and deployment management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CloudflareClient } from '../client.js';
import { formatErrorResponse, formatResponse } from '../utils/formatters.js';

/**
 * Register all Pages-related tools
 */
export function registerPagesTools(server: McpServer, client: CloudflareClient): void {
  // ===========================================================================
  // List Pages Projects
  // ===========================================================================
  server.tool(
    'cloudflare_list_pages_projects',
    `List all Pages projects in an account.

Args:
  - account_id: The account ID
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, format }) => {
      try {
        const projects = await client.listPagesProjects(account_id);
        return formatResponse(
          { items: projects, count: projects.length, hasMore: false },
          format,
          'pages_projects'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Pages Project
  // ===========================================================================
  server.tool(
    'cloudflare_get_pages_project',
    `Get details of a specific Pages project.

Args:
  - account_id: The account ID
  - project_name: The project name
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      project_name: z.string().describe('Project name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, project_name, format }) => {
      try {
        const project = await client.getPagesProject(account_id, project_name);
        return formatResponse(project, format, 'pages_project');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create Pages Project
  // ===========================================================================
  server.tool(
    'cloudflare_create_pages_project',
    `Create a new Pages project.

Note: This creates an empty project. To deploy, use the Cloudflare dashboard
or wrangler CLI to connect a Git repository or upload files.

Args:
  - account_id: The account ID
  - name: The project name (will be used in the subdomain)
  - production_branch: The production branch name (default: main)`,
    {
      account_id: z.string().describe('Account ID'),
      name: z.string().describe('Project name'),
      production_branch: z.string().default('main').describe('Production branch name'),
    },
    async ({ account_id, name, production_branch }) => {
      try {
        const project = await client.createPagesProject(account_id, name, production_branch);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Pages project "${name}" created`,
                  url: `https://${project.subdomain}.pages.dev`,
                  project,
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
  // Delete Pages Project
  // ===========================================================================
  server.tool(
    'cloudflare_delete_pages_project',
    `Delete a Pages project.

WARNING: This will delete the project and all its deployments.

Args:
  - account_id: The account ID
  - project_name: The project name`,
    {
      account_id: z.string().describe('Account ID'),
      project_name: z.string().describe('Project name'),
    },
    async ({ account_id, project_name }) => {
      try {
        await client.deletePagesProject(account_id, project_name);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Pages project "${project_name}" deleted`,
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
  // List Pages Deployments
  // ===========================================================================
  server.tool(
    'cloudflare_list_pages_deployments',
    `List all deployments for a Pages project.

Args:
  - account_id: The account ID
  - project_name: The project name
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      project_name: z.string().describe('Project name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, project_name, format }) => {
      try {
        const deployments = await client.listPagesDeployments(account_id, project_name);
        return formatResponse(
          { items: deployments, count: deployments.length, hasMore: false },
          format,
          'deployments'
        );
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Pages Deployment
  // ===========================================================================
  server.tool(
    'cloudflare_get_pages_deployment',
    `Get details of a specific deployment.

Args:
  - account_id: The account ID
  - project_name: The project name
  - deployment_id: The deployment ID
  - format: Response format`,
    {
      account_id: z.string().describe('Account ID'),
      project_name: z.string().describe('Project name'),
      deployment_id: z.string().describe('Deployment ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ account_id, project_name, deployment_id, format }) => {
      try {
        const deployment = await client.getPagesDeployment(account_id, project_name, deployment_id);
        return formatResponse(deployment, format, 'deployment');
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Delete Pages Deployment
  // ===========================================================================
  server.tool(
    'cloudflare_delete_pages_deployment',
    `Delete a specific deployment.

Note: You cannot delete the current production deployment.

Args:
  - account_id: The account ID
  - project_name: The project name
  - deployment_id: The deployment ID`,
    {
      account_id: z.string().describe('Account ID'),
      project_name: z.string().describe('Project name'),
      deployment_id: z.string().describe('Deployment ID'),
    },
    async ({ account_id, project_name, deployment_id }) => {
      try {
        await client.deletePagesDeployment(account_id, project_name, deployment_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Deployment ${deployment_id} deleted`,
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
  // Rollback Pages Deployment
  // ===========================================================================
  server.tool(
    'cloudflare_rollback_pages_deployment',
    `Rollback to a previous deployment.

This will make the specified deployment the new production deployment.

Args:
  - account_id: The account ID
  - project_name: The project name
  - deployment_id: The deployment ID to rollback to`,
    {
      account_id: z.string().describe('Account ID'),
      project_name: z.string().describe('Project name'),
      deployment_id: z.string().describe('Deployment ID to rollback to'),
    },
    async ({ account_id, project_name, deployment_id }) => {
      try {
        const deployment = await client.rollbackPagesDeployment(
          account_id,
          project_name,
          deployment_id
        );
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Rolled back to deployment ${deployment_id}`,
                  deployment,
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
