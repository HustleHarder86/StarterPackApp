# Firebase MCP Setup for Claude Code

## Status
- ✅ Firebase CLI authenticated (project: real-estate-roi-app)
- ✅ Firebase tools available via npx (v14.12.0)
- ⏳ Firebase MCP server configuration needed in Claude Code

## Configuration for Claude Code

Since you're using Claude Code (not Claude Desktop), the MCP configuration is managed through Claude Code's built-in MCP manager.

### Option 1: Official Firebase MCP (Recommended)

Use the `/mcp` command in Claude Code to add the Firebase server with this configuration:

```json
{
  "firebase": {
    "command": "npx",
    "args": ["-y", "firebase-tools@latest", "experimental:mcp"],
    "env": {
      "GOOGLE_APPLICATION_CREDENTIALS": "/home/amy/StarterPackApp/.firebase-service-account.json"
    }
  }
}
```

### Option 2: Community Firebase MCP

If the official one doesn't work, try the community version:

```json
{
  "firebase-mcp": {
    "command": "npx",
    "args": ["-y", "@gannonh/firebase-mcp"],
    "env": {
      "SERVICE_ACCOUNT_KEY_PATH": "/home/amy/StarterPackApp/.firebase-service-account.json",
      "FIREBASE_PROJECT_ID": "real-estate-roi-app",
      "FIREBASE_STORAGE_BUCKET": "real-estate-roi-app.appspot.com"
    }
  }
}
```

## Creating Service Account File

First, we need to create a service account JSON file from your existing credentials:

```bash
# This file will be created from your existing .env credentials
```

## Available Firebase MCP Tools

Once configured, you'll have access to:

### Firestore Tools
- `firestore_read` - Read documents
- `firestore_write` - Write documents  
- `firestore_query` - Query collections
- `firestore_delete` - Delete documents
- `firestore_list_collections` - List all collections

### Auth Tools
- `auth_list_users` - List all users
- `auth_get_user` - Get user details
- `auth_create_user` - Create new user
- `auth_update_user` - Update user (including custom claims)
- `auth_delete_user` - Delete user

### Storage Tools
- `storage_upload` - Upload files
- `storage_download` - Download files
- `storage_delete` - Delete files
- `storage_list` - List files

## Testing the Connection

Once configured, test with:
1. List your Firestore collections
2. Query recent property analyses
3. Check user subscription tiers

## Your Project Structure

Your Firebase project has these main collections:
- `users` - User accounts and subscription data
- `properties` - Property listings and data
- `analyses` - Property analysis results
- `reports` - Generated PDF reports

## Environment Variables Already Available

From your `.env.development`:
- Firebase Project ID: `real-estate-roi-app`
- Storage Bucket: `real-estate-roi-app.appspot.com`
- All credentials are already configured

## Next Steps

1. Use `/mcp` command to add Firebase server
2. Select "Add Server" option
3. Choose "Firebase" or paste the configuration
4. Test the connection with a simple Firestore query

## Troubleshooting

If the Firebase MCP doesn't appear:
1. The official Firebase MCP is still experimental
2. Try installing globally: `npm install -g firebase-tools`
3. Use the community version as fallback
4. Ensure service account file has proper permissions