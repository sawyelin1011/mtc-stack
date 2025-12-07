import { z } from "@lucidcms/core";
import { fileSystemMediaAdapter } from "@lucidcms/core/media-adapter";
import { passthroughEmailAdapter } from "@lucidcms/core/email-adapter";
import { passthroughQueueAdapter } from "@lucidcms/core/queue-adapter";
import Database from "better-sqlite3";
// Adapters
import { defineConfig, nodeAdapter } from "@lucidcms/node-adapter";
// Plugins
import SQLiteAdapter from "@lucidcms/sqlite-adapter";
import PagesPlugin from "@lucidcms/plugin-pages";
// Collections
import PageCollection from "./src/collections/pages.js";
import SettingsCollection from "./src/collections/settings.js";
import SimpleCollection from "./src/collections/simple.js";
import TestCollection from "./src/collections/test.js";
import BlogCollection from "./src/collections/blogs.js";
import MainMenuCollection from "./src/collections/main-menu.js";

export const adapter = nodeAdapter();
// export const adapter = cloudflareAdapter();

export const envSchema = z.object({
    DATABASE_PATH: z.string().default("storage/lucid-dev.db"),
    LUCID_ENCRYPTION_KEY: z.string(),
    LUCID_COOKIE_SECRET: z.string(),
    LUCID_REFRESH_TOKEN_SECRET: z.string(),
    LUCID_ACCESS_TOKEN_SECRET: z.string(),
});

export default defineConfig((env) => ({
    host: "http://localhost:6543",
    logger: {
        level: "silent",
    },
    db: new SQLiteAdapter({
        database: async () => new Database(env.DATABASE_PATH),
    }),
    auth: {
        password: {
            enabled: true,
        },
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
    disableOpenAPI: false,
    media: {
        adapter: fileSystemMediaAdapter({
            uploadDir: "uploads",
        }),
        maxFileSize: 200 * 1024 * 1024, // 200MB
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
    collections: [
        PageCollection,
        BlogCollection,
        MainMenuCollection,
        SettingsCollection,
        TestCollection,
        SimpleCollection,
    ],
    plugins: [
        // Only include PagesPlugin if ENABLE_PAGES_PLUGIN env var is set
        ...(process.env.ENABLE_PAGES_PLUGIN ? [
            PagesPlugin({
                collections: [
                    {
                        collectionKey: "page",
                        useTranslations: true,
                        displayFullSlug: true,
                    },
                    {
                        collectionKey: "test",
                        useTranslations: true,
                        displayFullSlug: true,
                    },
                ],
            }),
        ] : []),
    ],
}));
