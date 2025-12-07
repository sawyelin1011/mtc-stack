import type { KVNamespace, Queue } from "@cloudflare/workers-types";
import { cloudflareAdapter, defineConfig } from "@lucidcms/cloudflare-adapter";
import { z } from "@lucidcms/core";
import LibSQLAdapter from "@lucidcms/libsql-adapter";
import PagesPlugin from "@lucidcms/plugin-pages";
import ResendPlugin from "@lucidcms/plugin-resend";
import S3Plugin from "@lucidcms/plugin-s3";
import CloudflareKVPlugin from "@lucidcms/plugin-cloudflare-kv";
import CloudflareQueuesPlugin from "@lucidcms/plugin-cloudflare-queues";
// Collections
import PageCollection from "./src/collections/pages.js";
import SettingsCollection from "./src/collections/settings.js";
import NewsCollection from "./src/collections/news.js";

export const adapter = cloudflareAdapter({
    platformProxy: {
        environment: "dev",
    },
});

export const envSchema = z.object({
    LUCID_HOST: z.string(),
    LUCID_TURSO_URL: z.string(),
    LUCID_TURSO_AUTH_TOKEN: z.string(),
    LUCID_ENCRYPTION_KEY: z.string(),
    LUCID_COOKIE_SECRET: z.string(),
    LUCID_REFRESH_TOKEN_SECRET: z.string(),
    LUCID_ACCESS_TOKEN_SECRET: z.string(),
    // Optional email configuration
    LUCID_RESEND_FROM_EMAIL: z.string().optional(),
    LUCID_RESEND_FROM_NAME: z.string().optional(),
    LUCID_RESEND_API_KEY: z.string().optional(),
    LUCID_RESEND_WEBHOOK_SECRET: z.string().optional(),
    // Optional S3 configuration
    LUCID_S3_ENDPOINT: z.string().optional(),
    LUCID_S3_BUCKET: z.string().optional(),
    LUCID_S3_ACCESS_KEY: z.string().optional(),
    LUCID_S3_SECRET_KEY: z.string().optional(),
    LUCID_MEDIA_URL: z.string().optional(),
    // Optional Cloudflare bindings
    LUCID_CLOUDFLARE_KV: z.custom<KVNamespace>().optional(),
    LUCID_CLOUDFLARE_QUEUES: z.custom<Queue>().optional(),
});

export default defineConfig((env) => ({
    host: env.LUCID_HOST,
    // For local development with Node.js, you can override the database:
    // db: new SQLiteAdapter({
    //     database: async () => new Database("storage/lucid-dev.db"),
    // }),
    db: new LibSQLAdapter({
        url: env.LUCID_TURSO_URL,
        authToken: env.LUCID_TURSO_AUTH_TOKEN,
        // For local development with LibSQL:
        // url: "http://127.0.0.1:8081",
        // authToken: undefined,
    }),
    logger: {
        level: "debug",
    },
    keys: {
        encryptionKey: env.LUCID_ENCRYPTION_KEY,
        cookieSecret: env.LUCID_COOKIE_SECRET,
        refreshTokenSecret: env.LUCID_REFRESH_TOKEN_SECRET,
        accessTokenSecret: env.LUCID_ACCESS_TOKEN_SECRET,
    },
    localization: {
        locales: [
            {
                label: "English",
                code: "en",
            },
            {
                label: "French",
                code: "fr",
            },
        ],
        defaultLocale: "en",
    },
    disableOpenAPI: true,
    email: env.LUCID_RESEND_API_KEY ? {
        from: {
            email: env.LUCID_RESEND_FROM_EMAIL!,
            name: env.LUCID_RESEND_FROM_NAME!,
        },
        simulate: true,
    } : undefined,
    collections: [PageCollection, NewsCollection, SettingsCollection],
    plugins: [
        PagesPlugin({
            collections: [
                {
                    collectionKey: "page",
                    useTranslations: true,
                    displayFullSlug: false,
                },
            ],
        }),
        // Only include ResendPlugin if API key is provided
        ...(env.LUCID_RESEND_API_KEY ? [
            ResendPlugin({
                apiKey: env.LUCID_RESEND_API_KEY,
                webhook: {
                    enabled: false,
                    secret: env.LUCID_RESEND_WEBHOOK_SECRET,
                },
            }),
        ] : []),
        // Only include S3Plugin if required env vars are provided
        ...(env.LUCID_S3_ENDPOINT && env.LUCID_S3_BUCKET && env.LUCID_S3_ACCESS_KEY && env.LUCID_S3_SECRET_KEY ? [
            S3Plugin({
                endpoint: env.LUCID_S3_ENDPOINT,
                bucket: env.LUCID_S3_BUCKET,
                clientOptions: {
                    region: "auto",
                    accessKeyId: env.LUCID_S3_ACCESS_KEY,
                    secretAccessKey: env.LUCID_S3_SECRET_KEY,
                },
            }),
        ] : []),
        // Only include CloudflareKVPlugin if binding is provided
        ...(env.LUCID_CLOUDFLARE_KV ? [
            CloudflareKVPlugin({
                binding: env.LUCID_CLOUDFLARE_KV,
            }),
        ] : []),
        // Only include CloudflareQueuesPlugin if binding is provided
        ...(env.LUCID_CLOUDFLARE_QUEUES ? [
            CloudflareQueuesPlugin({
                binding: env.LUCID_CLOUDFLARE_QUEUES,
            }),
        ] : []),
    ],
}));
