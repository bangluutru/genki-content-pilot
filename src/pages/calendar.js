/**
 * Calendar Page — Content scheduling with month view
 */
import { store } from '../utils/state.js';
import { loadContents, saveSchedule, loadSchedules, deleteSchedule } from '../services/firestore.js';
import { timeAgo, truncate } from '../utils/helpers.js';
import { renderSidebar, attachSidebarEvents } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { t } from '../utils/i18n.js';
import { icon } from '../utils/icons.js';

let currentYear, currentMonth;

export async function renderCalendarPage() {
  const app = document.getElementById('app');
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  app.innerHTML = `
    ${renderSidebar()}
    <main class="main-content page">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 style="font-size: var(--font-2xl); display: flex; align-items: center; gap: 12px;">${icon('calendar', 28)} ${t('calendar.title')}</h1>
          <p class="text-muted text-sm" style="margin-top: var(--space-1);">${t('calendar.subtitle')}</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-ghost" id="btn-prev-month">← ${t('calendar.prev')}</button>
          <span class="btn btn-ghost" id="month-label" style="min-width: 150px; text-align: center; font-weight: 700;"></span>
          <button class="btn btn-ghost" id="btn-next-month">${t('calendar.next')} →</button>
          <button class="btn btn-secondary btn-sm" id="btn-today" style="margin-left: var(--space-2);">📍 ${t('calendar.today') || 'Hôm nay'}</button>
        </div>
      </div>
      <div id="calendar-stats" class="flex gap-4 mb-4" style="font-size: var(--font-xs); color: var(--text-muted);"></div>

      <div class="calendar-grid-wrap">
        <div class="calendar-weekdays">
          <div>${t('calendar.sun')}</div><div>${t('calendar.mon')}</div><div>${t('calendar.tue')}</div><div>${t('calendar.wed')}</div><div>${t('calendar.thu')}</div><div>${t('calendar.fri')}</div><div>${t('calendar.sat')}</div>
        </div>
        <div class="calendar-grid" id="calendar-grid"></div>
      </div>

      <!-- Schedule Modal -->
      <div class="modal-overlay hidden" id="schedule-modal">
        <div class="card" style="max-width: 480px; width: 90%; padding: var(--space-6);">
          <h3 id="modal-title" style="margin-bottom: var(--space-4);"></h3>

          <div id="modal-schedules" style="margin-bottom: var(--space-4);"></div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">${t('calendar.selectContent')}</label>
            <select class="form-input" id="schedule-content-select">
              <option value="">— ${t('calendar.selectFromLibrary')} —</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">Platform</label>
            <select class="form-input" id="schedule-platform">
              <option value="facebook">${icon('phone', 14)} Facebook</option>
              <option value="blog">${icon('blog', 14)} Blog</option>
              <option value="all">${icon('phone', 14)}${icon('blog', 14)} ${t('calendar.allPlatforms')}</option>
            </select>
          </div>

          <div class="form-group" style="margin-bottom: var(--space-4);">
            <label class="form-label">${t('calendar.publishTime')}</label>
            <input type="time" class="form-input" id="schedule-time" value="09:00">
            <div class="quick-times" style="margin-top: var(--space-2); display: flex; gap: var(--space-2);">
              <span class="text-xs text-muted" style="align-self: center;">${t('calendar.suggestions')}:</span>
              <button class="btn btn-ghost btn-xs quick-time-btn" data-time="09:00">${icon('sun', 12)} 09:00</button>
              <button class="btn btn-ghost btn-xs quick-time-btn" data-time="11:30">${icon('clock', 12)} 11:30</button>
              <button class="btn btn-ghost btn-xs quick-time-btn" data-time="20:00">${icon('moon', 12)} 20:00</button>
            </div>
          </div>

          <div class="flex gap-2">
            <button class="btn btn-primary" id="btn-add-schedule" style="flex: 1;">${icon('calendar', 16)} ${t('calendar.addSchedule')}</button>
            <button class="btn btn-ghost" id="btn-close-modal">${t('actions.close')}</button>
          </div>
        </div>
      </div>
    </main>
  `;

  attachSidebarEvents();

  // Load content for dropdown
  try {
    await loadContents(100);
  } catch { /* ignore */ }

  // Events
  document.getElementById('btn-prev-month')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderMonth();
  });

  document.getElementById('btn-next-month')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderMonth();
  });

  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('schedule-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'schedule-modal') closeModal();
  });

  document.getElementById('btn-add-schedule')?.addEventListener('click', handleAddSchedule);

  // Quick time buttons
  document.querySelectorAll('.quick-time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('schedule-time').value = btn.dataset.time;
    });
  });

  // Today button
  document.getElementById('btn-today')?.addEventListener('click', () => {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    renderMonth();
    // Scroll to today cell after render
    setTimeout(() => {
      const todayCell = document.querySelector('.calendar-cell.today');
      if (todayCell) {
        todayCell.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.4)';
        todayCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { todayCell.style.boxShadow = ''; }, 2000);
      }
    }, 100);
  });

  renderMonth();
}

async function renderMonth() {
  const label = document.getElementById('month-label');
  if (label) {
    label.textContent = new Date(currentYear, currentMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  }

  const grid = document.getElementById('calendar-grid');
  if (!grid) return;

  // Load schedules for this month
  let schedules = [];
  try {
    schedules = await loadSchedules(currentMonth, currentYear);
  } catch { /* ignore */ }

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  let cells = '';

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells += '<div class="calendar-cell empty"></div>';
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const daySchedules = schedules.filter(s => s.date === dateStr);
    const isPast = new Date(dateStr) < new Date(todayStr);

    const scheduleChips = daySchedules.slice(0, 3).map(s => {
      const chipIcon = s.platform === 'facebook' ? icon('phone', 12) : s.platform === 'blog' ? icon('blog', 12) : icon('phone', 12) + icon('blog', 12);
      return `<div class="schedule-chip ${isPast && s.status !== 'published' ? 'overdue' : ''}" title="${s.title || t('calendar.untitledPost')}">${chipIcon} ${truncate(s.title || '', 12)}</div>`;
    }).join('');

    const moreCount = daySchedules.length > 3 ? `<div class="schedule-more">+${daySchedules.length - 3}</div>` : '';

    cells += `
      <div class="calendar-cell ${isToday ? 'today' : ''}" data-date="${dateStr}">
        <div class="cell-day">${day}</div>
        <div class="cell-schedules">${scheduleChips}${moreCount}</div>
      </div>
    `;
  }

  grid.innerHTML = cells;

  // Update mini stats bar
  const statsEl = document.getElementById('calendar-stats');
  if (statsEl) {
    const total = schedules.length;
    const published = schedules.filter(s => s.status === 'published').length;
    const pending = total - published;
    statsEl.innerHTML = `
      <span>📅 <strong>${total}</strong> bài lên lịch tháng này</span>
      <span>✅ <strong>${published}</strong> đã đăng</span>
      <span>⏳ <strong>${pending}</strong> chờ đăng</span>
    `;
  }

  // Click on cells to open modal
  grid.querySelectorAll('.calendar-cell:not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => openModal(cell.dataset.date, schedules));
  });
}

function openModal(date, schedules) {
  const modal = document.getElementById('schedule-modal');
  if (!modal) return;

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  document.getElementById('modal-title').innerHTML = `${icon('calendar', 20)} ${dateLabel}`;
  modal.dataset.date = date;

  // Show existing schedules for this date
  const daySchedules = schedules.filter(s => s.date === date);
  const schedulesEl = document.getElementById('modal-schedules');
  if (daySchedules.length > 0) {
    schedulesEl.innerHTML = `
      <div style="margin-bottom: var(--space-3);">
        <strong class="text-sm">${t('calendar.scheduledPosts')}:</strong>
      </div>
      ${daySchedules.map(s => `
        <div class="existing-schedule">
          <span>${s.platform === 'facebook' ? icon('phone', 14) : s.platform === 'blog' ? icon('blog', 14) : icon('phone', 14) + icon('blog', 14)} ${s.title || 'N/A'} — ${s.time || '00:00'}</span>
          <button class="btn btn-ghost btn-sm schedule-delete" data-id="${s.id}">${icon('trash', 14)}</button>
        </div>
      `).join('')}
    `;
    // Delete handlers
    schedulesEl.querySelectorAll('.schedule-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await deleteSchedule(btn.dataset.id);
          showToast(t('calendar.scheduleDeleted'), 'success');
          closeModal();
          renderMonth();
        } catch (err) {
          showToast(t('common.error') + ': ' + err.message, 'error');
        }
      });
    });
  } else {
    schedulesEl.innerHTML = `<p class="text-sm text-muted">${t('calendar.noSchedulesYet')}</p>`;
  }

  // Populate content dropdown
  const select = document.getElementById('schedule-content-select');
  const contents = store.get('contents') || [];
  select.innerHTML = `<option value="">— ${t('calendar.selectFromLibrary')} —</option>` +
    contents.map(c => `<option value="${c.id}" data-title="${(c.brief || c.facebook || 'Untitled').slice(0, 50)}">${truncate(c.brief || c.facebook || 'Untitled', 60)}</option>`).join('');

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('schedule-modal')?.classList.add('hidden');
}

async function handleAddSchedule() {
  const modal = document.getElementById('schedule-modal');
  const date = modal?.dataset.date;
  const contentId = document.getElementById('schedule-content-select')?.value;
  const platform = document.getElementById('schedule-platform')?.value;
  const time = document.getElementById('schedule-time')?.value || '09:00';

  if (!contentId) {
    showToast(t('calendar.selectContentRequired'), 'error');
    return;
  }

  const contents = store.get('contents') || [];
  const content = contents.find(c => c.id === contentId);
  const title = content?.brief || content?.facebook || 'Untitled';

  try {
    await saveSchedule({
      contentId,
      title: title.slice(0, 60),
      date,
      time,
      platform,
      status: 'scheduled',
    });

    showToast(t('calendar.scheduleAdded'), 'success');
    closeModal();
    renderMonth();
  } catch (err) {
    showToast(t('common.error') + ': ' + err.message, 'error');
  }
}
