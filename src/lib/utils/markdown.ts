/**
 * Simple markdown renderer with XSS protection
 * Supports: **bold**, *italic*, ~~strikethrough~~, ---, \n -> br
 */

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}

export function renderMarkdown(content: string): string {
  // First escape all HTML tags to prevent XSS
  let html = escapeHtml(content);

  // Horizontal rule: --- (on its own line)
  html = html.replace(/^---$/gm, '<hr class="my-4 border-border" />');

  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');

  // Italic: *text*
  html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

  // Strikethrough: ~~text~~
  html = html.replace(/~~(.+?)~~/g, '<del class="line-through opacity-70">$1</del>');

  // Line breaks: \n -> <br>
  html = html.replace(/\n/g, '<br />');

  return html;
}
