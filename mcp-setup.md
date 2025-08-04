# MCP Playwright Setup Guide

## Status: ✅ Playwright MCP Server Installed Successfully

The Playwright MCP server is now installed and working in your project.

## Configuration Files Created

1. **mcp-config.json** - MCP server configuration
2. **test-mcp-playwright.js** - Test script to verify setup

## Client Configuration

To resolve the "Failed to reconnect to playwright" error, you need to configure your Claude client. The exact steps depend on how you're running Claude:

### Option 1: Claude Desktop App
1. Open Claude Desktop settings
2. Add MCP server configuration:
   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["@playwright/mcp"],
         "cwd": "/home/amy/StarterPackApp"
       }
     }
   }
   ```

### Option 2: Claude CLI with MCP Config
If using Claude CLI, create `~/.config/claude/mcp.json`:
```json
{
  "servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"],
      "cwd": "/home/amy/StarterPackApp"
    }
  }
}
```

### Option 3: Manual Start
You can manually start the MCP server in a separate terminal:
```bash
cd /home/amy/StarterPackApp
npx @playwright/mcp
```

## Available MCP Playwright Features

Once connected, you'll have access to:
- Browser automation and testing
- Screenshot capture
- Web scraping
- UI interaction testing
- Performance monitoring

## Testing the Connection

Run the test script to verify everything is working:
```bash
node test-mcp-playwright.js
```

## Troubleshooting

If you continue to see connection errors:

1. **Check MCP server is running**: `npx @playwright/mcp --help`
2. **Verify Node.js version**: `node --version` (should be 14+)
3. **Check permissions**: Ensure Claude can execute npx commands
4. **Restart client**: Restart your Claude client after configuration changes

## Next Steps

1. Configure your Claude client with the MCP server details
2. Restart Claude client
3. Test MCP connection with a simple Playwright command
4. Begin using browser automation features in your project