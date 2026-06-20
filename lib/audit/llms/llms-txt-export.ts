export function createLlmsTxtDownload(content: string) { return new Blob([content], { type: "text/plain;charset=utf-8" }); }
