/**
 * Designer Hub — Visual Command Center (Kanban Board)
 * Manages "In Production" visual tasks and generates AI Prompt Hints.
 */
import { store } from '../utils/state.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { loadContents, updateContent, saveContent } from '../services/firestore.js';
import { generateImagePrompt } from '../services/gemini.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';
import { timeAgo, escapeHtml } from '../utils/helpers.js';

const COLUMN_IDS = ['backlog', 'in_progress', 'review', 'done'];
const COLUMN_COLORS = {
  backlog: 'var(--text-muted)',
  in_progress: 'var(--color-info)',
  review: 'var(--color-warning)',
  done: 'var(--color-success)'
};

const getColumns = (t) => COLUMN_IDS.map(id => ({
  id,
  title: t(`designer.${id === 'in_progress' ? 'inProgress' : id}`),
  color: COLUMN_COLORS[id]
}));

export async function renderDesignerPage() {
  const app = document.getElementById('app');
  let allContents = store.get('contents') || [];

  if (allContents.length === 0) {
    try {
      allContents = await loadContents() || [];
      store.set('contents', allContents);
    } catch (err) {
      console.warn('Could not load contents from Firebase (offline mode):', err);
    }
  }

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page" style="height: 100vh; display: flex; flex-direction: column; overflow: hidden;">
      <div class="mb-6 flex justify-between items-start" style="flex-shrink: 0;">
        <div>
          <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">${icon('image', 28)} Designer Hub</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">
            ${t('designer.subtitle')}
          </p>
        </div>
        <div class="flex gap-2">
          <a href="#/library" class="btn btn-ghost btn-sm">${icon('clipboard', 14)} ${t('designer.importLibrary') || 'Import từ Thư viện'}</a>
          <button class="btn btn-primary btn-sm" id="btn-add-designer-task">${icon('sparkle', 14)} ${t('designer.addTask') || '+ Thêm Task'}</button>
        </div>
      </div>

      <!-- Kanban Board -->
      <div id="kanban-scroll-wrap" style="flex: 1; min-height: 0; overflow-x: auto; overflow-y: hidden; padding-bottom: var(--space-4); position: relative;">
        <div class="kanban-board" style="display: flex; gap: var(--space-4); height: 100%; min-width: max-content;">
          ${getColumns(t).map(col => renderKanbanColumn(col, allContents)).join('')}
        </div>
        <div id="kanban-scroll-hint" style="position: absolute; right: 0; top: 0; bottom: 0; width: 48px; background: linear-gradient(to right, transparent, var(--bg-primary)); display: flex; align-items: center; justify-content: center; pointer-events: none; transition: opacity 0.3s;">
          <span style="font-size: 20px; opacity: 0.6; animation: pulseRight 1.5s ease-in-out infinite;">→</span>
        </div>
      </div>
      <style>
        @keyframes pulseRight { 0%,100% { transform: translateX(0); opacity: 0.4; } 50% { transform: translateX(4px); opacity: 0.8; } }
      </style>

      <!-- Add Task Modal -->
      <div id="modal-add-designer-task" class="modal-overlay hidden">
        <div class="modal-content" style="max-width: 480px;">
          <div class="modal-header">
            <h3>${icon('sparkle', 18)} ${t('designer.addTaskTitle') || 'Tạo Task Thiết Kế Mới'}</h3>
            <button class="btn-close" id="btn-close-designer-modal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>${icon('gift', 16)} ${t('designer.taskProduct') || 'Tên sản phẩm / Tiêu đề'} *</label>
              <input type="text" id="designer-task-product" class="input" placeholder="VD: Serum Vitamin C...">
            </div>
            <div class="form-group">
              <label>${icon('star', 16)} ${t('designer.taskHighlight') || 'Điểm nổi bật / Mô tả'}</label>
              <input type="text" id="designer-task-highlight" class="input" placeholder="VD: Sáng da, mờ thâm, giảm nếp nhăn...">
            </div>
            <div class="form-group">
              <label>${icon('edit', 16)} ${t('designer.taskContent') || 'Nội dung bài viết (Brief)'}</label>
              <textarea id="designer-task-content" class="textarea" rows="4" placeholder="Paste nội dung bài viết để AI tạo prompt ảnh phù hợp..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="btn-cancel-designer-modal">${t('actions.cancel') || 'Huỷ'}</button>
            <button class="btn btn-primary" id="btn-save-designer-task">${icon('save', 14)} ${t('actions.save') || 'Lưu'}</button>
          </div>
        </div>
      </div>
    </main>
  `;

  attachSidebarEvents();
  attachDesignerEvents();
}

function renderKanbanColumn(col, contents) {
  // Any content without visualStatus goes to backlog
  const colContents = contents.filter(c => {
    const status = c.visualStatus || 'backlog';
    return status === col.id;
  });

  return `
    <div class="kanban-column" style="flex: 0 0 280px; min-width: 280px; background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); display: flex; flex-direction: column; height: 100%;">
      <div class="kanban-header" style="padding: var(--space-3); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
        <h3 style="font-size: var(--font-sm); font-weight: 600; color: ${col.color};">${col.title}</h3>
        <span class="badge" style="background: var(--bg);">${colContents.length}</span>
      </div>
      <div class="kanban-cards" data-column="${col.id}" 
           ondragover="event.preventDefault(); this.style.background='rgba(139,92,246,0.08)';" 
           ondragleave="this.style.background='';" 
           ondrop="this.style.background='';" 
           style="padding: var(--space-3); flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-3); transition: background 0.2s;">
        ${colContents.length > 0 ? colContents.map(c => renderKanbanCard(c, col.id)).join('') : `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; opacity: 0.4; text-align: center; padding: var(--space-4);">
            <span style="font-size: 32px; margin-bottom: var(--space-2);">${col.id === 'backlog' ? '📋' : col.id === 'in_progress' ? '🎨' : col.id === 'review' ? '👀' : '✅'}</span>
            <span style="font-size: var(--font-xs); color: var(--text-muted);">${col.id === 'backlog' ? t('designer.emptyBacklog') : col.id === 'in_progress' ? t('designer.emptyInProgress') : col.id === 'review' ? t('designer.emptyReview') : t('designer.emptyDone')}</span>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderKanbanCard(content, currentColumnId) {
  const platforms = content.publishedTo || [];
  const platformsHtml = platforms.length > 0
    ? `<div class="flex gap-1 mt-2">${platforms.map(p => `<span class="badge badge-muted" style="font-size: 10px;">${p}</span>`).join('')}</div>`
    : '';

  // Determine which column is next/prev for movement arrows
  const colIndex = COLUMN_IDS.indexOf(currentColumnId);
  const prevCol = colIndex > 0 ? COLUMN_IDS[colIndex - 1] : null;
  const nextCol = colIndex < COLUMN_IDS.length - 1 ? COLUMN_IDS[colIndex + 1] : null;

  return `
    <div class="card kanban-card" data-id="${content.id}" draggable="true" style="padding: var(--space-3); border-left: 3px solid ${COLUMN_COLORS[currentColumnId]}; cursor: grab; transition: opacity 0.2s, transform 0.2s;">
      <div class="flex justify-between items-start mb-2">
        <h4 style="font-size: var(--font-sm); font-weight: 600; margin: 0; line-height: 1.4;">
          ${escapeHtml(content.product || content.brief || t('designer.noTitle'))}
        </h4>
        <div class="flex gap-1">
          ${prevCol ? `<button class="btn btn-ghost btn-icon btn-move-card" data-id="${content.id}" data-target="${prevCol}" title="Di chuyển lùi" style="width: 24px; height: 24px; padding: 0;">${icon('arrow-left', 14)}</button>` : ''}
          ${nextCol ? `<button class="btn btn-ghost btn-icon btn-move-card" data-id="${content.id}" data-target="${nextCol}" title="Di chuyển tới" style="width: 24px; height: 24px; padding: 0;">${icon('arrow-right', 14)}</button>` : ''}
        </div>
      </div>
      
      <p class="text-xs text-muted" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
        ${escapeHtml(content.highlight || t('designer.noHighlight'))}
      </p>
      
      ${platformsHtml}

      ${content.visualPrompt ? `
        <div style="margin-top: var(--space-3); padding: var(--space-2); background: rgba(139, 92, 246, 0.1); border: 1px dashed rgba(139, 92, 246, 0.3); border-radius: var(--radius-sm);">
          <div class="flex justify-between items-center mb-1">
            <span style="font-size: 10px; color: var(--color-primary); font-weight: 600; text-transform: uppercase;">AI Prompt Hint</span>
            <button class="btn btn-ghost btn-icon btn-copy-prompt" data-prompt="${encodeURIComponent(content.visualPrompt)}" title="Copy Prompt" style="width: 20px; height: 20px; padding: 0;">${icon('copy', 12)}</button>
          </div>
          <p style="font-size: 11px; color: var(--text-secondary); font-family: monospace; line-height: 1.3; overflow-wrap: break-word;">${content.visualPrompt}</p>
        </div>
      ` : `
        <button class="btn btn-outline btn-sm btn-full btn-generate-prompt" data-id="${content.id}" style="margin-top: var(--space-3); font-size: 11px;">
          ${icon('sparkle', 12)} ${t('designer.generatePrompt')}
        </button>
      `}
      
      <div class="mt-3 text-right">
        <span class="text-xs text-muted">${timeAgo(content.updatedAt || content.createdAt)}</span>
      </div>
    </div>
  `;
}

function attachDesignerEvents() {
  // Auto-hide scroll hint when scrolled to end
  const scrollWrap = document.getElementById('kanban-scroll-wrap');
  const scrollHint = document.getElementById('kanban-scroll-hint');
  if (scrollWrap && scrollHint) {
    const checkScroll = () => {
      const atEnd = scrollWrap.scrollLeft + scrollWrap.clientWidth >= scrollWrap.scrollWidth - 10;
      scrollHint.style.opacity = atEnd ? '0' : '1';
    };
    scrollWrap.addEventListener('scroll', checkScroll);
    checkScroll(); // initial check
  }

  // Add Task Modal
  const addTaskModal = document.getElementById('modal-add-designer-task');
  const openAddTask = () => addTaskModal?.classList.remove('hidden');
  const closeAddTask = () => addTaskModal?.classList.add('hidden');

  document.getElementById('btn-add-designer-task')?.addEventListener('click', openAddTask);
  document.getElementById('btn-close-designer-modal')?.addEventListener('click', closeAddTask);
  document.getElementById('btn-cancel-designer-modal')?.addEventListener('click', closeAddTask);

  document.getElementById('btn-save-designer-task')?.addEventListener('click', async () => {
    const product = document.getElementById('designer-task-product')?.value?.trim();
    const highlight = document.getElementById('designer-task-highlight')?.value?.trim();
    const contentText = document.getElementById('designer-task-content')?.value?.trim();

    if (!product) {
      showToast(t('validation.required') || 'Vui lòng nhập tên sản phẩm', 'warning');
      document.getElementById('designer-task-product')?.focus();
      return;
    }

    const saveBtn = document.getElementById('btn-save-designer-task');
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;

    try {
      const payload = {
        product,
        highlight: highlight || '',
        brief: product,
        facebook: contentText || '',
        status: 'draft',
        visualStatus: 'backlog',
      };
      await saveContent(payload);
      showToast(t('designer.taskCreated') || '✅ Đã tạo task mới trong Backlog', 'success');
      closeAddTask();
      renderDesignerPage(); // Re-render board
    } catch (err) {
      console.error('Create designer task error:', err);
      showToast(t('errors.generic') || 'Lỗi khi lưu task', 'error');
    } finally {
      saveBtn.classList.remove('loading');
      saveBtn.disabled = false;
    }
  });

  // Handle moving cards
  document.querySelectorAll('.btn-move-card').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = e.currentTarget.dataset.id;
      const targetColumn = e.currentTarget.dataset.target;

      try {
        await updateContent(id, { visualStatus: targetColumn });
      } catch (fbErr) {
        console.warn('Firebase error, updating local store only:', fbErr);
        // Fallback to local store for offline testing
        const contents = store.get('contents') || [];
        store.set('contents', contents.map(c =>
          c.id === id ? { ...c, visualStatus: targetColumn } : c
        ));
      }
      renderDesignerPage(); // Re-render whole board
    });
  });

  // Handle Generate AI Prompt
  document.querySelectorAll('.btn-generate-prompt').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = e.currentTarget.dataset.id;

      const contents = store.get('contents') || [];
      const content = contents.find(c => c.id === id);
      if (!content) return;

      btn.disabled = true;
      btn.innerHTML = `<span class="loading-spinner-sm"></span> Generating...`;

      try {
        const briefOpts = {
          product: content.product || content.brief,
          highlight: content.highlight,
          targetAvatar: content.targetAvatar,
          promotion: content.promotion
        };
        const promptResult = await generateImagePrompt(briefOpts);

        try {
          await updateContent(id, { visualPrompt: promptResult, visualStatus: 'in_progress' });
        } catch (fbErr) {
          console.warn('Firebase error, updating local store only:', fbErr);
          // Fallback to local store
          const currentContents = store.get('contents') || [];
          store.set('contents', currentContents.map(c =>
            c.id === id ? { ...c, visualPrompt: promptResult, visualStatus: 'in_progress' } : c
          ));
        }

        showToast('Đã tạo AI Prompt thành công', 'success');
        renderDesignerPage();
      } catch (err) {
        showToast('Lỗi AI: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = `${icon('sparkle', 12)} ${t('designer.generatePrompt')}`;
      }
    });
  });

  // Handle Copy Prompt
  document.querySelectorAll('.btn-copy-prompt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const promptText = decodeURIComponent(e.currentTarget.dataset.prompt);
      navigator.clipboard.writeText(promptText).then(() => {
        showToast('Đã copy Prompt', 'success');
      });
    });
  });

  // Drag & Drop handlers
  document.querySelectorAll('.kanban-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.id);
      e.dataTransfer.effectAllowed = 'move';
      card.style.opacity = '0.5';
      card.style.transform = 'scale(0.95)';
    });

    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
      card.style.transform = '';
    });
  });

  document.querySelectorAll('.kanban-cards').forEach(zone => {
    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData('text/plain');
      const targetColumn = zone.dataset.column;
      if (!cardId || !targetColumn) return;

      try {
        await updateContent(cardId, { visualStatus: targetColumn });
      } catch (fbErr) {
        console.warn('Firebase error, updating local store only:', fbErr);
        const contents = store.get('contents') || [];
        store.set('contents', contents.map(c =>
          c.id === cardId ? { ...c, visualStatus: targetColumn } : c
        ));
      }
      renderDesignerPage();
    });
  });
}
