import { remark } from "remark";
import remarkHtml from "remark-html";

export function renderMarkdownToHtml(md: string): string {
  const result = remark().use(remarkHtml).processSync(md);
  return result.toString();
}
