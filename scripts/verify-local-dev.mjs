#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const WORKSPACES = [
    "@lucidcms/core",
    "@lucidcms/libsql-adapter",
    "@lucidcms/cloudflare-adapter",
    "@lucidcms/admin",
    "@lucidcms/playground",
    "@lucidcms/cloudflare-example",
];

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
};

const log = (message = "", color = colors.reset) => {
    console.log(`${color}${message}${colors.reset}`);
};

const logSection = (message) => {
    log(`\n${"=".repeat(60)}`, colors.cyan);
    log(message, colors.bright + colors.cyan);
    log("=".repeat(60), colors.cyan);
};

const logInfo = (message) => log(`→ ${message}`, colors.yellow);
const logSuccess = (message) => log(`✓ ${message}`, colors.green);
const logError = (message) => log(`✗ ${message}`, colors.red);

const generateSecret = () => randomBytes(64).toString("base64");
const turboCommand = (workspace) => `npm exec -- turbo run build --filter=${workspace}`;

function ensureDatabase() {
    const tmpDir = path.join(projectRoot, "tmp");
    if (!existsSync(tmpDir)) {
        mkdirSync(tmpDir, { recursive: true });
        logSuccess(`Created tmp directory at ${tmpDir}`);
    } else {
        logInfo(`tmp directory already exists at ${tmpDir}`);
    }

    const dbPath = path.join(tmpDir, "verify-local-dev.db");
    if (!existsSync(dbPath)) {
        writeFileSync(dbPath, "");
        logSuccess(`Created SQLite database at ${dbPath}`);
    } else {
        logInfo(`SQLite database already exists at ${dbPath}`);
    }

    return dbPath;
}

function setupEnvironment() {
    logSection("Setting up environment");

    const dbPath = ensureDatabase();

    process.env.NODE_ENV ??= "production";
    process.env.DATABASE_PATH = dbPath;
    process.env.LUCID_ENCRYPTION_KEY = generateSecret();
    process.env.LUCID_COOKIE_SECRET = generateSecret();
    process.env.LUCID_REFRESH_TOKEN_SECRET = generateSecret();
    process.env.LUCID_ACCESS_TOKEN_SECRET = generateSecret();
    process.env.LUCID_TURSO_AUTH_TOKEN = "dummy-token-for-build";
    process.env.LUCID_HOST = "http://localhost:6543";
    process.env.LUCID_MEDIA_URL = "http://localhost:6543/media";
    process.env.LUCID_S3_ACCESS_KEY = "dummy-access-key";
    process.env.LUCID_S3_SECRET_KEY = "dummy-secret-key";
    process.env.LUCID_S3_ENDPOINT = "http://localhost:9000";
    process.env.LUCID_S3_BUCKET = "dummy-bucket";
    process.env.LUCID_RESEND_API_KEY = "dummy-resend-key";
    process.env.LUCID_RESEND_FROM_EMAIL = "noreply@example.com";
    process.env.LUCID_RESEND_FROM_NAME = "Lucid CMS";
    process.env.LUCID_RESEND_WEBHOOK_SECRET = "dummy-webhook-secret";

    logSuccess("Environment variables configured");
    logInfo(`DATABASE_PATH set to ${process.env.DATABASE_PATH}`);
}

function runWorkspaceBuild(workspace) {
    logInfo(`Building ${workspace}...`);
    execSync(turboCommand(workspace), {
        cwd: projectRoot,
        stdio: "inherit",
        env: process.env,
    });
    logSuccess(`${workspace} built successfully`);
}

function main() {
    log("\n🚀 Lucid CMS Local Development Verification", colors.bright);
    log("This script verifies that critical workspaces build with local defaults.\n");

    setupEnvironment();

    logSection("Building workspaces");

    for (const workspace of WORKSPACES) {
        try {
            runWorkspaceBuild(workspace);
        } catch (error) {
            const exitCode = typeof error?.status === "number" ? error.status : error?.code;
            logError(`Failed to build ${workspace}${exitCode !== undefined ? ` (exit code ${exitCode})` : ""}`);
            logInfo("See the Turbo output above for detailed logs.");
            log("\n❌ Local verification failed.\n", colors.red + colors.bright);
            process.exit(1);
        }
    }

    log("\n✅ All workspaces built successfully!\n", colors.green + colors.bright);
    log("The trimmed dependency set is verified.", colors.green);
}

main();
