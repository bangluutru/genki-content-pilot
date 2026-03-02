import { renderSidebar } from '../components/header.js';
import { icon } from '../utils/icons.js';
import { GUIDES } from '../data/guides.js';

export function renderHelpPage(params = {}) {
  const app = document.getElementById('app');

  // Custom markdown parser for the guides — handles tables, code fences, etc.
  const parseMarkdown = (md) => {
    if (!md) return '';

    // Split into lines for multi-line processing
    const lines = md.split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // --- Code blocks ---
      if (line.trim().startsWith('```')) {
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        blocks.push(`<pre style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; overflow-x: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; margin: 16px 0;"><code>${codeLines.join('\n')}</code></pre>`);
        continue;
      }

      // --- Tables ---
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableRows = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableRows.push(lines[i].trim());
          i++;
        }
        if (tableRows.length >= 2) {
          // Check if second row is separator
          const isSeparator = row => /^\|[\s\-:|]+\|$/.test(row);
          const hasSeparator = isSeparator(tableRows[1]);
          const headerRow = tableRows[0];
          const dataRows = hasSeparator ? tableRows.slice(2) : tableRows.slice(1);

          const parseCells = row => row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
          const formatCell = c => c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\\`(.*?)\\`/g, '<code style="background:var(--surface);padding:2px 6px;border-radius:4px;font-size:0.85em;">$1</code>').replace(/`(.*?)`/g, '<code style="background:var(--surface);padding:2px 6px;border-radius:4px;font-size:0.85em;">$1</code>');

          let tableHTML = '<div style="overflow-x: auto; margin: 16px 0;"><table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">';
          // Header
          const headerCells = parseCells(headerRow);
          tableHTML += '<thead><tr>';
          headerCells.forEach(c => {
            tableHTML += `<th style="text-align: left; padding: 10px 14px; border-bottom: 2px solid var(--primary); font-weight: 600; color: var(--text); background: var(--surface);">${formatCell(c)}</th>`;
          });
          tableHTML += '</tr></thead><tbody>';
          // Data rows
          dataRows.forEach((row, rIdx) => {
            const cells = parseCells(row);
            const bgColor = rIdx % 2 === 1 ? 'background: var(--surface);' : '';
            tableHTML += `<tr style="${bgColor}">`;
            cells.forEach(c => {
              tableHTML += `<td style="padding: 10px 14px; border-bottom: 1px solid var(--border); color: var(--text-secondary);">${formatCell(c)}</td>`;
            });
            tableHTML += '</tr>';
          });
          tableHTML += '</tbody></table></div>';
          blocks.push(tableHTML);
        }
        continue;
      }

      // --- Horizontal rules ---
      if (/^---+\s*$/.test(line.trim())) {
        blocks.push('<hr style="border: none; border-top: 1px solid var(--border); margin: 24px 0;">');
        i++;
        continue;
      }

      // --- Headers ---
      if (line.trim().startsWith('### ')) {
        blocks.push(`<h3 style="margin-top:24px; margin-bottom:12px; font-weight:600; font-size: 1.25rem;">${line.trim().replace(/^### /, '')}</h3>`);
        i++;
        continue;
      }
      if (line.trim().startsWith('## ')) {
        blocks.push(`<h2 style="margin-top:32px; margin-bottom:16px; font-weight:700; font-size: 1.5rem;">${line.trim().replace(/^## /, '')}</h2>`);
        i++;
        continue;
      }

      // --- Alerts (multi-line) ---
      if (line.trim().startsWith('> [!TIP]') || line.trim().startsWith('> [!IMPORTANT]') || line.trim().startsWith('> [!CAUTION]')) {
        const alertType = line.includes('TIP') ? 'info' : line.includes('IMPORTANT') ? 'warning' : 'error';
        const alertIcon = line.includes('TIP') ? '💡 Mẹo:' : line.includes('IMPORTANT') ? '🌟 Quan trọng:' : '⚠️ Chú ý:';
        const alertStyle = alertType === 'error'
          ? 'background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--color-danger);'
          : alertType === 'warning'
            ? 'background: rgba(198, 186, 98, 0.1); border-left: 4px solid var(--warning);'
            : 'background: rgba(0, 105, 100, 0.08); border-left: 4px solid var(--primary);';
        i++;
        const alertLines = [];
        while (i < lines.length && lines[i].trim().startsWith('> ')) {
          alertLines.push(lines[i].trim().replace(/^> /, ''));
          i++;
        }
        blocks.push(`<div style="${alertStyle} padding: 12px 16px; margin: 16px 0; border-radius: 0 var(--radius-md) var(--radius-md) 0;"><strong>${alertIcon}</strong> ${formatInline(alertLines.join(' '))}</div>`);
        continue;
      }

      // --- Blockquotes ---
      if (line.trim().startsWith('> ')) {
        blocks.push(`<blockquote style="border-left: 4px solid var(--border); padding-left: 12px; margin: 16px 0; color: var(--text-muted);">${formatInline(line.trim().replace(/^> /, ''))}</blockquote>`);
        i++;
        continue;
      }

      // --- Lists ---
      if (/^(\d+)\. /.test(line.trim()) || line.trim().startsWith('- ') || line.trim().startsWith('☐ ') || line.trim().startsWith('✅ ') || line.trim().startsWith('☑ ')) {
        blocks.push(`<li style="margin-bottom: 8px; margin-left: 20px; list-style-type: ${/^\d/.test(line.trim()) ? 'decimal' : 'disc'};">${formatInline(line.trim().replace(/^(\d+)\. /, '').replace(/^- /, ''))}</li>`);
        i++;
        continue;
      }

      // --- Empty lines ---
      if (line.trim() === '') {
        i++;
        continue;
      }

      // --- Paragraphs ---
      blocks.push(`<p style="margin-bottom: 12px; line-height: 1.8; font-weight: 400;">${formatInline(line)}</p>`);
      i++;
    }

    return blocks.join('\n');
  };

  // Inline formatting helper
  const formatInline = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\\`(.*?)\\`/g, '<code style="background:var(--surface);padding:2px 6px;border-radius:4px;font-size:0.85em;">$1</code>')
      .replace(/`(.*?)`/g, '<code style="background:var(--surface);padding:2px 6px;border-radius:4px;font-size:0.85em;">$1</code>');
  };

  const navItemsHTML = GUIDES.map((guide, idx) => `
    <button class="nav-item ${idx === 0 ? 'active' : ''} help-nav-btn" data-id="${guide.id}" style="text-align: left; width: 100%; border: none; background: transparent; padding: 12px 16px; display: flex; align-items: center; gap: 12px; border-radius: var(--radius); cursor: pointer; color: var(--text-primary);">
      ${icon(guide.icon || 'document', 20)}
      <span style="font-weight: 500;">${guide.title}</span>
    </button>
  `).join('');

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">
            ${icon('info', 28)} Trung tâm Trợ giúp
          </h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            Bí kíp thực chiến & Hướng dẫn sử dụng hệ thống ContentPilot
          </p>
        </div>
      </div>

      <div class="flex gap-6" style="min-height: calc(100vh - 160px);">
        <!-- Sidebar Navigation for Documentation -->
        <div class="card" style="width: 300px; flex-shrink: 0; padding: var(--space-4); height: fit-content; position: sticky; top: 24px;">
          <h3 class="text-sm text-muted" style="margin-bottom: var(--space-4); text-transform: uppercase; letter-spacing: 0.5px;">Danh mục Hướng dẫn</h3>
          <nav class="flex flex-col gap-1">
            ${navItemsHTML}
          </nav>
        </div>

        <!-- Documentation Content Area -->
        <div class="card" style="flex: 1; padding: var(--space-8);">
          <div id="help-content-area">
            <!-- Content injected here -->
          </div>
        </div>
      </div>
    </main>
  `;

  // Interaction Logic
  const navBtns = document.querySelectorAll('.help-nav-btn');
  const contentArea = document.getElementById('help-content-area');

  const renderGuideContent = (guide) => {
    contentArea.innerHTML = `
      <div style="border-bottom: 1px solid var(--border); padding-bottom: 24px; margin-bottom: 24px;">
        <h1 style="font-size: 2rem; margin-bottom: 8px; display: flex; align-items: center; gap: 12px;">
          ${icon(guide.icon || 'document', 32)} ${guide.title}
        </h1>
        <div class="badge badge-accent">Route: #/${guide.route}</div>
      </div>
      <div class="markdown-body" style="color: var(--text-secondary);">
        ${parseMarkdown(guide.content)}
      </div>
    `;
  };

  // Initial render
  if (GUIDES.length > 0) {
    renderGuideContent(GUIDES[0]);
  }

  // Click handlers
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const guideId = btn.dataset.id;
      const guide = GUIDES.find(g => g.id === guideId);
      if (guide) {
        renderGuideContent(guide);
      }
    });
  });
}
