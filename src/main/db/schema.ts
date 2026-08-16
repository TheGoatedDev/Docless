import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type OcrStatus = "pending" | "running" | "done" | "failed" | "skipped";

export const documents = sqliteTable("documents", {
    path: text("path").primaryKey(),
    mtimeMs: integer("mtime_ms").notNull(),
    size: integer("size").notNull(),
    contentHash: text("content_hash"),
    ocrStatus: text("ocr_status").$type<OcrStatus>().notNull(),
    ocrError: text("ocr_error"),
    text: text("text"),
    createdAtMs: integer("created_at_ms").notNull(),
    updatedAtMs: integer("updated_at_ms").notNull(),
});
