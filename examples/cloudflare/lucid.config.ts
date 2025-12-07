import { z } from "@lucidcms/core";
import { cloudflareAdapter, defineConfig } from "@lucidcms/cloudflare-adapter";
import LibSQLAdapter from "@lucidcms/libsql-adapter";
import SQLiteAdapter from "@lucidcms/sqlite-adapter";
import Database from "better-sqlite3";
import { passthroughEmailAdapter } from "@lucidcms/core/email-adapter";
import { passthroughQueueAdapter } from "@lucidcms/core/queue-adapter";
import { fileSystemMediaAdapter } from "@lucidcms/core/media-adapter";

import PageCollection from "./src/collections/pages.js";
import NewsCollection from "./src/collections/news.js";
import SettingsCollection from "./src/collections/settings.js";

const FALLBACK_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const fallbackSecret = (label: string) => `${label}${FALLBACK_SECRET}`.slice(0, 64);

export const adapter = cloudflareAdapter();

export const envSchema = z.object({
    DATABASE_PATH: z.string().default("tmp/cloudflare-dev.db"),
    LUCID_TURSO_AUTH_TOKEN: z.string().optional(),
    LUCID_TURSO_URL: z.string().optional(),
    LUCID_ENCRYPTION_KEY: z.string().optional(),
    LUCID_COOKIE_SECRET: z.string().optional(),
    LUCID_REFRESH_TOKEN_SECRET: z.string().optional(),
    LUCID_ACCESS_TOKEN_SECRET: z.string().optional(),
    LUCID_HOST: z.string().optional(),
    LUCID_MEDIA_URL: z.string().optional(),
    LUCID_S3_ENDPOINT: z.string().optional(),
    LUCID_S3_BUCKET: z.string().optional(),
    LUCID_S3_ACCESS_KEY: z.string().optional(),
    LUCID_S3_SECRET_KEY: z.string().optional(),
    LUCID_RESEND_API_KEY: z.string().optional(),
    LUCID_RESEND_FROM_EMAIL: z.string().optional(),
    LUCID_RESEND_FROM_NAME: z.string().optional(),
    LUCID_RESEND_WEBHOOK_SECRET: z.string().optional(),
});

export default defineConfig((env) => {
    const useLibsql = Boolean(env.LUCID_TURSO_URL);

    const dbAdapter = useLibsql
        ? new LibSQLAdapter({
                url: env.LUCID_TURSO_URL!,
                authToken: env.LUCID_TURSO_AUTH_TOKEN,
            })
        : new SQLiteAdapter({
                database: async () => new Database(env.DATABASE_PATH),
            });

    return {
        host: env.LUCID_HOST || "http://localhost:6543",
        logger: {
            level: "silent",
        },
        db: dbAdapter,
        auth: {
            password: {
                enabled: true,
            },
        },
        keys: {
            encryptionKey: env.LUCID_ENCRYPTION_KEY || "local-dev-encryption-key",
            cookieSecret: env.LUCID_COOKIE_SECRET || "local-dev-cookie-secret",
            refreshTokenSecret: env.LUCID_REFRESH_TOKEN_SECRET || "local-dev-refresh-token-secret",
            accessTokenSecret: env.LUCID_ACCESS_TOKEN_SECRET || "local-dev-access-token-secret",
        },
        localization: {
            locales: [
                {
                    label: "English",
                    code: "en",
                },
            ],
            defaultLocale: "en",
        },
        disableOpenAPI: false,
        media: {
            adapter: fileSystemMediaAdapter({
                uploadDir: "uploads",
            }),
            maxFileSize: 200 * 1024 * 1024,
            processedImageLimit: 10,
            storeProcessedImages: true,
            onDemandFormats: true,
            fallbackImage: "https://placehold.co/600x400",
        },
        email: {
            adapter: passthroughEmailAdapter,
        },
        queue: {
            adapter: passthroughQueueAdapter,
        },
        collections: [PageCollection, NewsCollection, SettingsCollection],
        plugins: [],
    };
});
