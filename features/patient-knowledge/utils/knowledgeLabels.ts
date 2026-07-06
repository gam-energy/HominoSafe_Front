import type { KnowledgeDocument } from "../types/knowledge";

export function knowledgeLabel(status?: string): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "idle":
      return "Not indexed";
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return status || "Unknown";
  }
}

export function documentDisplayName(doc: KnowledgeDocument): string {
  return doc.original_filename ?? doc.filename ?? "Document";
}

export function documentStatusLabel(status?: string): string {
  switch (status) {
    case "indexed":
      return "Indexed";
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    default:
      return status ?? "Unknown";
  }
}
