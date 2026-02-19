/**
 * Simple Image Editor Component
 * Features: Rotate, Filters, Text Overlay, Brand Logo
 */
import { store } from '../utils/state.js';

let editorState = {
  canvas: null,
  ctx: null,
  img: null,
  logoImg: null, // New: Logo image
  rotation: 0,
  filter: 'none',
  text: '',
  onSave: null,
  modal: null
};

export function openImageEditor(imageUrl, onSave) {
  // 1. Initialize Modal (Singleton-ish pattern to avoid duplicate listeners)
  if (!editorState.modal) {
    createEditorModal();
    attachEditorEvents();
  }

  editorState.onSave = onSave;
  editorState.rotation = 0;
  editorState.filter = 'none';
  editorState.text = '';
  editorState.logoImg = null; // Reset logo

  // 2. Load Image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    editorState.img = img;
    drawImage();
    editorState.modal.classList.remove('hidden');
  };
  img.src = imageUrl;

  // Load Brand Logo automatically if available
  const brand = store.get('brand');
  if (brand && brand.logoUrl) {
    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.onload = () => {
      // Pre-load logo but don't apply yet? Or maybe just have it ready.
      // We'll let user click "Add Logo" to toggle it.
      // For now, let's keep it simple: We store the URL, load it when needed.
    };
    logo.src = brand.logoUrl;
  }
}


function createEditorModal() {
  const div = document.createElement('div');
  div.id = 'image-editor-modal';
  div.className = 'modal-overlay hidden';
  div.innerHTML = `
    <div class="card" style="width: 90vw; height: 90vh; display: flex; flex-direction: column; padding: var(--space-4);">
      <div class="flex justify-between items-center mb-4">
        <h3>🎨 Chỉnh sửa ảnh</h3>
        <div class="flex gap-2">
          <button class="btn btn-ghost" id="btn-editor-cancel">Huỷ</button>
          <button class="btn btn-primary" id="btn-editor-save">💾 Lưu thay đổi</button>
        </div>
      </div>

      <div class="editor-canvas-container" style="flex: 1; margin-bottom: var(--space-4); background: #000; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: var(--radius-md);">
        <canvas id="editor-canvas" style="max-width: 100%; max-height: 100%; object-fit: contain;"></canvas>
      </div>

      <div class="editor-controls">
        <div class="flex gap-4 items-center mb-4 overflow-x-auto pb-2">
          <button class="btn btn-ghost btn-sm" id="btn-rotate-cw" title="Xoay phải">🔄 Xoay 90°</button>
          <button class="btn btn-ghost btn-sm" id="btn-add-logo" title="Chèn Logo">🖼️ Chèn Logo</button>
          
          <div class="h-divider" style="width: 1px; height: 30px; background: var(--border-color);"></div>

          <div class="flex gap-2">
            <button class="filter-choice btn btn-xs btn-outline" data-filter="none">Vibrant</button>
            <button class="filter-choice btn btn-xs btn-outline" data-filter="grayscale(100%)">B&W</button>
            <button class="filter-choice btn btn-xs btn-outline" data-filter="sepia(100%)">Sepia</button>
            <button class="filter-choice btn btn-xs btn-outline" data-filter="contrast(150%)">Contrast</button>
            <button class="filter-choice btn btn-xs btn-outline" data-filter="brightness(120%)">Bright</button>
          </div>
        </div>

        <div class="form-group">
          <input type="text" class="form-input" id="editor-text-input" placeholder="Nhập chữ chèn lên ảnh (tự động căn giữa dưới)...">
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(div);
  editorState.modal = div;
  editorState.canvas = document.getElementById('editor-canvas');
  editorState.ctx = editorState.canvas.getContext('2d');
}

function attachEditorEvents() {
  // Rotation
  document.getElementById('btn-rotate-cw').addEventListener('click', () => {
    editorState.rotation = (editorState.rotation + 90) % 360;
    drawImage();
  });

  // Filters
  document.querySelectorAll('.filter-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      editorState.filter = btn.dataset.filter;
      drawImage();
    });
  });

  // Text
  document.getElementById('editor-text-input').addEventListener('input', (e) => {
    editorState.text = e.target.value;
    drawImage();
  });

  // Logo Toggle
  document.getElementById('btn-add-logo').addEventListener('click', () => {
    if (editorState.logoImg) {
      // Remove logo if already there
      editorState.logoImg = null;
      drawImage();
    } else {
      // Add logo
      const brand = store.get('brand');
      if (!brand || !brand.logoUrl) {
        alert('Vui lòng upload logo trong Brand Profile trước.');
        return;
      }
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        editorState.logoImg = logo;
        drawImage();
      };
      logo.src = brand.logoUrl;
    }
  });

  // Save & Close
  document.getElementById('btn-editor-save').addEventListener('click', () => {
    if (editorState.onSave && editorState.canvas) {
      const dataUrl = editorState.canvas.toDataURL('image/png');
      editorState.onSave(dataUrl);
    }
    closeEditor();
  });

  document.getElementById('btn-editor-cancel').addEventListener('click', closeEditor);
}

function closeEditor() {
  if (editorState.modal) {
    editorState.modal.classList.add('hidden');
    // Reset text input
    document.getElementById('editor-text-input').value = '';
  }
}

function drawImage() {
  const { canvas, ctx, img, rotation, filter, text, logoImg } = editorState;
  if (!canvas || !ctx || !img) return;

  // Handle dimensions based on rotation
  if (rotation % 180 === 0) {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
  } else {
    canvas.width = img.naturalHeight;
    canvas.height = img.naturalWidth;
  }

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  // Rotate context
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.filter = filter;
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  ctx.restore();

  // 1. Draw Text Overlay
  if (text) {
    const fontSize = Math.max(40, canvas.width * 0.05);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = Math.max(2, canvas.width * 0.005);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const x = canvas.width / 2;
    const y = canvas.height - (canvas.height * 0.05);

    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  // 2. Draw Logo Overlay (Bottom Right)
  if (logoImg) {
    const logoSize = Math.max(100, canvas.width * 0.15); // 15% of width
    const padding = logoSize * 0.2;
    const lx = canvas.width - logoSize - padding;
    const ly = canvas.height - logoSize - padding;

    ctx.globalAlpha = 0.9;
    // Draw circular mask for logo? Or just raw? Raw is safer for varied logos.
    // Let's add a subtle shadow
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 10;

    // Maintain aspect ratio of logo
    const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
    let drawW = logoSize;
    let drawH = logoSize / aspect;

    if (drawH > logoSize) {
      drawH = logoSize;
      drawW = logoSize * aspect;
    }

    ctx.drawImage(logoImg, canvas.width - drawW - padding, canvas.height - drawH - padding, drawW, drawH);
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }
}
