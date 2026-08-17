export type OcrStatus = "pending" | "running" | "done" | "failed" | "skipped";

export type DocumentRow = {
    root: string;
    path: string;
    name: string;
    ocrStatus: OcrStatus;
};
