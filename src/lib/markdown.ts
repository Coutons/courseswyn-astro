// Very small markdown-to-HTML renderer for common syntax without external deps.
// Supports: headings (#, ##, ###), bold **text**, italic *text*, inline code `code`,
// links [text](url), unordered lists (- item), paragraphs and line breaks.

export function renderMarkdownToHtml(md: string): string {
  md = sanitizeMarkdown(md);
  const lines = md.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;

  const esc = (s: string) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const inline = (s: string) => {
    // code
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // links
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    // bold
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // italic
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return s;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*-\s+/.test(line)) {
      if (!inList) { html.push('<ul>'); inList = true; }
      const item = line.replace(/^\s*-\s+/, '');
      html.push(`<li>${inline(esc(item))}</li>`);
      continue;
    } else if (inList) {
      html.push('</ul>');
      inList = false;
    }

    if (/^###\s+/.test(line)) {
      html.push(`<h3>${inline(esc(line.replace(/^###\s+/, '')))}</h3>`);
    } else if (/^##\s+/.test(line)) {
      html.push(`<h2>${inline(esc(line.replace(/^##\s+/, '')))}</h2>`);
    } else if (/^#\s+/.test(line)) {
      html.push(`<h1>${inline(esc(line.replace(/^#\s+/, '')))}</h1>`);
    } else if (line.length === 0) {
      html.push('<br/>');
    } else {
      html.push(`<p>${inline(esc(line))}</p>`);
    }
  }
  if (inList) html.push('</ul>');
  return html.join('\n');
}

// Remove Rank Math TOC shortcode and Rehub offer shortcodes that look bad in our CMS output
function sanitizeMarkdown(md: string): string {
  let s = md || "";
  // Remove Rank Math TOC shortcode like [rank_math_toc] or with params
  s = s.replace(/\[rank_math_toc[^\]]*\]/gi, "");
  // Remove a heading that is just "Table of Contents"
  s = s.replace(/^(#{1,6}\s*)(table of contents)\s*$/gim, "");
  // Remove Rank Math FAQ HTML block
  s = s.replace(/<div[^>]*id=["']rank-math-faq["'][\s\S]*?<\/div>/gi, "");
  // Remove heading 'Frequently Asked Questions' when it likely belongs to Rank Math block
  s = s.replace(/^(#{1,6}\s*)(frequently asked questions)\s*$/gim, "");
  // Remove common Rehub/WPSM shortcodes blocks
  s = s.replace(/\[wpsm_[^\]]*\][\s\S]*?\[\/wpsm_[^\]]*\]/gi, "");
  s = s.replace(/\[rehub_[^\]]*\][\s\S]*?\[\/rehub_[^\]]*\]/gi, "");
  // Remove standalone shortcodes
  s = s.replace(/\[rehub_[^\]]*\]/gi, "");
  s = s.replace(/\[wpsm_[^\]]*\]/gi, "");
  // Remove inline <style> blocks often pasted from themes
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Remove specific Gutenberg blocks (wp:rehub/* and wp:rank-math/faq-block)
  // Patterns handled:
  // 1) Paired: <!-- wp:rehub/reviewbox {...} --> ... <!-- /wp:rehub/reviewbox -->
  // 2) Self-closing: <!-- wp:rehub/reviewbox {...} /-->
  const gbBlocks = [
    'rehub/color-heading',
    'rehub/post-offer-listing',
    'rehub/reviewbox',
    'rank-math/faq-block',
  ];
  for (const b of gbBlocks) {
    // Paired block removal
    const paired = new RegExp(`<!--\\s*wp:${b}[^>]*-->[\\s\\S]*?<!--\\s*\\/wp:${b}\\s*-->`, 'gi');
    s = s.replace(paired, '');
    // Self-closing block removal
    const selfClosing = new RegExp(`<!--\\s*wp:${b}[^>]*\\/-->`, 'gi');
    s = s.replace(selfClosing, '');
  }
  // Also remove standalone opening/closing comments if any remain
  s = s.replace(/<!--\s*wp:(rehub|rank-math)\/[^>]*-->/gi, "");
  s = s.replace(/<!--\s*\/wp:(rehub|rank-math)\/[^>]*-->/gi, "");
  // Remove obvious theme CSS lines (gs-box, main-side, rh-color-heading)
  s = s.replace(/^.*\.(gs-box|main-side|rh-color-heading)[^{]*\{[^}]*\}.*$/gim, "");
  // Remove markdown images ![alt](url)
  s = s.replace(/!\[[^\]]*\]\([^\)]+\)/g, "");
  // Remove raw HTML images and figure wrappers
  s = s.replace(/<img[^>]*>/gi, "");
  s = s.replace(/<figure[\s\S]*?<\/figure>/gi, "");
  // Remove internal links to courseswyn.com (keep text only to avoid 404 after migration)
  // Markdown links: [text](https://courseswyn.com/....)
  s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/)?courseswyn\.com[^)]+)\)/gi, "$1");
  // HTML anchors: <a href="https://courseswyn.com/...">text</a>
  s = s.replace(/<a[^>]*href=["'](?:https?:\/\/)?courseswyn\.com[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi, "$1");
  // Bare URLs: https://courseswyn.com/...
  s = s.replace(/https?:\/\/courseswyn\.com[^\s)]+/gi, "");
  // Remove "Recommended Courses" sections (markdown headings) up to next heading or end
  s = s.replace(/^(#{1,6}\s*recommended\s+courses[\s\S]*?)(?=^#{1,6}\s|\Z)/gim, "");
  // Remove HTML-based Recommended headings blocks up to next HTML heading or end
  s = s.replace(/<h[1-6][^>]*>\s*recommended\s+courses[\s\S]*?(?=<h[1-6][^>]*>|\Z)/gi, "");
  // Remove empty markdown links like [](...)
  s = s.replace(/^\s*\[\s*\]\([^\)]+\)\s*$/gim, "");
  // Remove lines like "REDEEM" or "REDEEM COUPON"
  s = s.replace(/^\s*redeem(?:\s+coupon)?\s*$/gim, "");
  // Remove lines containing "Read full review"
  s = s.replace(/^.*read\s+full\s+review.*$/gim, "");
  // Trim excessive blank lines
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}
