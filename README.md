# Cloudflare MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to interact with Cloudflare. Manage zones, DNS, Workers, R2, KV, D1, and security settings across your Cloudflare infrastructure.

[![Primrose MCP](https://img.shields.io/badge/Primrose-MCP-6366f1)](https://primrose.dev/mcp/cloudflare)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[View on Primrose](https://primrose.dev/mcp/cloudflare)** | **[Documentation](https://primrose.dev/docs)**

---

## Features

- **Accounts** - Manage account settings and members
- **Analytics** - Access zone and account analytics
- **Cache** - Purge and manage cache settings
- **D1** - Work with D1 serverless SQL databases
- **DNS** - Manage DNS records and settings
- **Firewall** - Configure firewall rules
- **KV** - Manage Workers KV namespaces and keys
- **Load Balancers** - Configure load balancing
- **Pages** - Deploy and manage Pages projects
- **R2** - Manage R2 object storage buckets
- **SSL** - Configure SSL/TLS certificates
- **WAF** - Manage Web Application Firewall rules
- **Workers** - Deploy and manage Workers scripts
- **Zones** - Create and configure domains

## Quick Start

### Using Primrose SDK (Recommended)

The fastest way to get started is with the [Primrose SDK](https://github.com/primrose-mcp/primrose-sdk), which handles authentication and provides tool definitions formatted for your LLM provider.

```bash
npm install primrose-mcp
```

```typescript
import { Primrose } from 'primrose-mcp';

const primrose = new Primrose({
  apiKey: 'prm_xxxxx',
  provider: 'anthropic', // or 'openai', 'google', 'amazon', etc.
});

// List available Cloudflare tools
const tools = await primrose.listTools({ mcpServer: 'cloudflare' });

// Call a tool
const result = await primrose.callTool('cloudflare_list_zones', {
  per_page: 20,
  format: 'json'
});
```

[Get your Primrose API key](https://primrose.dev) to start building.

### Manual Installation

If you prefer to self-host, you can deploy this MCP server directly to Cloudflare Workers.

```bash
git clone https://github.com/primrose-mcp/primrose-mcp-cloudflare.git
cd primrose-mcp-cloudflare
bun install
bun run deploy
```

## Configuration

This server uses a multi-tenant architecture where credentials are passed via request headers.

### Authentication Option 1: API Token (Recommended)

| Header | Description |
|--------|-------------|
| `X-CF-API-Token` | Cloudflare API token |

### Authentication Option 2: Global API Key

| Header | Description |
|--------|-------------|
| `X-CF-API-Email` | Cloudflare account email |
| `X-CF-API-Key` | Global API key |

### Optional Headers

| Header | Description |
|--------|-------------|
| `X-CF-Account-ID` | Account ID for account-scoped operations |

### Getting Credentials

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to My Profile > API Tokens
3. Create a token with appropriate permissions (recommended), or
4. Copy your Global API Key (less secure)

## Available Tools

### Zones
- `cloudflare_list_zones` - List all zones
- `cloudflare_get_zone` - Get zone details
- `cloudflare_create_zone` - Add a new zone
- `cloudflare_delete_zone` - Delete a zone

### DNS
- `cloudflare_list_dns_records` - List DNS records
- `cloudflare_get_dns_record` - Get record details
- `cloudflare_create_dns_record` - Create a record
- `cloudflare_update_dns_record` - Update a record
- `cloudflare_delete_dns_record` - Delete a record

### Workers
- `cloudflare_list_workers` - List Workers scripts
- `cloudflare_get_worker` - Get script content
- `cloudflare_deploy_worker` - Deploy a script
- `cloudflare_delete_worker` - Delete a script

### KV
- `cloudflare_list_kv_namespaces` - List namespaces
- `cloudflare_create_kv_namespace` - Create namespace
- `cloudflare_list_kv_keys` - List keys
- `cloudflare_get_kv_value` - Get a value
- `cloudflare_put_kv_value` - Set a value

### R2
- `cloudflare_list_r2_buckets` - List R2 buckets
- `cloudflare_create_r2_bucket` - Create a bucket
- `cloudflare_delete_r2_bucket` - Delete a bucket

### D1
- `cloudflare_list_d1_databases` - List databases
- `cloudflare_create_d1_database` - Create a database
- `cloudflare_query_d1` - Execute SQL query

### Cache
- `cloudflare_purge_cache` - Purge cache

### Pages
- `cloudflare_list_pages_projects` - List Pages projects
- `cloudflare_get_pages_project` - Get project details

## Development

```bash
bun run dev
bun run typecheck
bun run lint
bun run inspector
```

## Related Resources

- [Primrose SDK](https://github.com/primrose-mcp/primrose-sdk)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
- [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT License - see [LICENSE](LICENSE) for details.
