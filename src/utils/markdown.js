/**
 * Lightweight Markdown → HTML renderer
 * Supports: headings, bold, italic, lists, links, blockquotes, paragraphs
 * No external dependencies
 */

/**
 * Convert markdown text to HTML
 * @param {string} md - Raw markdown string
 * @returns {string} HTML string
 */
export function renderMarkdown(md) {
  if (!md) return '';

  let html = md
    // Escape HTML entities first (prevent XSS)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Process line by line for block-level elements
  const lines = html.split('\n');
  const result = [];
  let inList = false;
  let listType = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headings: ### H3, ## H2, # H1
    if (/^#{1,4}\s/.test(line)) {
      if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
      const level = line.match(/^(#+)/)[1].length;
      const text = line.replace(/^#+\s*/, '');
      result.push(`<h${level} class="md-h${level}">${applyInline(text)}</h${level}>`);
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
      const text = line.replace(/^>\s?/, '');
      result.push(`<blockquote class="md-blockquote">${applyInline(text)}</blockquote>`);
      continue;
    }

    // Unordered list: - item or * item
    if (/^[\-\*]\s/.test(line)) {
      if (!inList || listType !== 'ul') {
        if (inList) result.push('</ol>');
        result.push('<ul class="md-list">');
        inList = true;
        listType = 'ul';
      }
      const text = line.replace(/^[\-\*]\s/, '');
      result.push(`<li>${applyInline(text)}</li>`);
      continue;
    }

    // Ordered list: 1. item
    if (/^\d+\.\s/.test(line)) {
      if (!inList || listType !== 'ol') {
        if (inList) result.push('</ul>');
        result.push('<ol class="md-list">');
        inList = true;
        listType = 'ol';
      }
      const text = line.replace(/^\d+\.\s/, '');
      result.push(`<li>${applyInline(text)}</li>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
      result.push('<hr class="md-hr">');
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
      continue;
    }

    // Normal paragraph
    if (inList) { result.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; }
    result.push(`<p>${applyInline(line)}</p>`);
  }

  // Close any open list
  if (inList) {
    result.push(listType === 'ul' ? '</ul>' : '</ol>');
  }

  return result.join('\n');
}

/**
 * Apply inline formatting: bold, italic, links, inline code
 */
function applyInline(text) {
  return text
    // Bold + Italic: ***text***
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/(?<!\w)_(.*?)_(?!\w)/g, '<em>$1</em>')
    // Inline code: `code`
    .replace(/`(.*?)`/g, '<code class="md-code">$1</code>')
    // Links: [text](url)
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Hashtags: #tag (but not heading markers)
    .replace(/(^|\s)(#[A-Za-zÀ-ỹ\d_]+)/g, '$1<span class="md-hashtag">$2</span>');
}
