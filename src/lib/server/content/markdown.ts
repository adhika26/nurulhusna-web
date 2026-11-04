import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

/** Konten ditulis oleh pengurus melalui panel admin. */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
