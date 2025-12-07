# Local Development Guide

This guide covers setting up Lucid CMS for local development using SQLite and filesystem-backed services.

## Quick Start

### 1. Install Dependencies

```bash
# Install from the repository root
npm install
```

### 2. Set Up Environment

```bash
# Copy the example environment file
cp apps/playground/.env.example apps/playground/.env

# Generate security secrets (64-byte random strings)
openssl rand -base64 64
```

Edit `apps/playground/.env` and add the generated secrets:

```env
# Database Configuration
DATABASE_PATH="storage/lucid-dev.db"

# Security Secrets (generate 64-byte random strings for each)
# Use: openssl rand -base64 64
LUCID_ENCRYPTION_KEY="your-generated-secret-here"
LUCID_COOKIE_SECRET="your-generated-secret-here"
LUCID_REFRESH_TOKEN_SECRET="your-generated-secret-here"
LUCID_ACCESS_TOKEN_SECRET="your-generated-secret-here"

# Optional: Enable PagesPlugin (uncomment to enable)
# ENABLE_PAGES_PLUGIN=true
```

### 3. Initialize Database

```bash
# Navigate to playground app
cd apps/playground

# Run the setup script to create storage directory and database
npm run dev:setup
```

### 4. Start Development

You can start the development servers in different ways:

```bash
# Start both core API and admin UI (recommended)
npm run dev

# Or start them separately:
npm run dev:core  # Starts the core API server
npm run dev:cms   # Starts the admin UI
```

The CMS will be available at `http://localhost:6543`.

## Configuration Details

### Minimal Dependencies

The playground app is configured with minimal dependencies for local development:

- **Database**: SQLite with better-sqlite3
- **Media**: Filesystem storage in `uploads/` directory
- **Email**: Passthrough adapter (emails are logged, not sent)
- **Queue**: Passthrough adapter (jobs execute immediately)
- **Authentication**: Password-based auth only

### Optional Plugins

The PagesPlugin is disabled by default to keep the setup minimal. To enable it:

1. Add `@lucidcms/plugin-pages` to `package.json` dependencies
2. Uncomment `ENABLE_PAGES_PLUGIN=true` in `.env`
3. Restart the development server

### File References

All internal packages are referenced using `file:` paths to ensure `npm install` never hits remote npm:

```json
{
  "dependencies": {
    "@lucidcms/core": "file:../../packages/core",
    "@lucidcms/node-adapter": "file:../../packages/node-adapter",
    "@lucidcms/sqlite-adapter": "file:../../packages/sqlite-adapter",
    "@lucidcms/plugin-pages": "file:../../packages/plugin-pages"
  }
}
```

## Cloudflare Example

The Cloudflare example in `examples/cloudflare/` is also configured for minimal local development:

- Uses local file references for all packages
- Makes S3, Resend, and Cloudflare plugins optional based on environment variables
- Includes comments for local development overrides

To build the Cloudflare example without external services:

```bash
cd examples/cloudflare
npm install
npm run build
```

## Troubleshooting

### Database Issues

If you encounter database errors:

1. Ensure the storage directory exists: `mkdir -p apps/playground/storage`
2. Check that the database file is writable: `ls -la apps/playground/storage/`
3. Re-run the setup script: `npm run dev:setup`

### Port Conflicts

The default port is `6543`. To change it, modify the `host` value in `apps/playground/lucid.config.ts`.

### Permission Issues

If you encounter permission errors with the database file:

```bash
# Fix ownership and permissions
chmod 755 apps/playground/storage
chmod 644 apps/playground/storage/lucid-dev.db
```

## Development Workflow

1. Make changes to packages in the `packages/` directory
2. Changes are automatically reflected in the playground app due to file references
3. Run migrations when database schema changes: `npm run migrate:fresh`
4. Test with the admin UI at `http://localhost:6543`

## Next Steps

- Explore the collection definitions in `apps/playground/src/collections/`
- Check out the brick definitions in `apps/playground/src/bricks/`
- Review the core configuration in `apps/playground/lucid.config.ts`
- Read the main [README.md](../README.md) for more information about Lucid CMS features