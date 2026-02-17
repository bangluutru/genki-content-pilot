/**
 * Simple Image Editor Component
 * Features: Rotate, Filters, Text Overlay
 */

export function openImageEditor(imageUrl, onSave) {
    // Create modal elements if not exists
    let modal = document.getElementById('image-editor-modal');
    if (!modal) {
        modal = createImageEditorModal();
        document.body.appendChild(modal);
    }

    const canvas = document.getElementById('editor-canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let currentRotation = 0;
    let currentFilter = 'none';
    let textOverlay = '';

    img.onload = () => {
        drawImage();
        modal.classList.remove('hidden');
    };
    img.src = imageUrl;

    // Draw function
    function drawImage() {
        // Handle rotation dimensions
        if (currentRotation % 180 === 0) {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
        } else {
            canvas.width = img.naturalHeight;
            canvas.height = img.naturalWidth;
        }

        // Clear and save context
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        // Move to center, rotate, move back
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((currentRotation * Math.PI) / 180);
        ctx.filter = currentFilter;
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

        ctx.restore();

        // Text Overlay
        if (textOverlay) {
            ctx.font = `bold ${Math.max(40, canvas.width * 0.05)}px sans-serif`;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = Math.max(2, canvas.width * 0.005);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            // Draw text at bottom with some padding
            const x = canvas.width / 2;
            const y = canvas.height - (canvas.height * 0.1);

            ctx.strokeText(textOverlay, x, y);
            ctx.fillText(textOverlay, x, y);
        }
    }

    // Event Handlers
    const handleRotate = (deg) => {
        currentRotation = (currentRotation + deg) % 360;
        drawImage();
    };

    const handleFilter = (filter) => {
        currentFilter = filter;
        drawImage();
    };

    const handleText = (text) => {
        textOverlay = text;
        drawImage();
    };

    const handleSave = () => {
        const dataUrl = canvas.toDataURL('image/png');
        onSave && onSave(dataUrl);
        closeEditor();
    };

    const closeEditor = () => {
        modal.classList.add('hidden');
        // Clean up events to avoid duplicates if reopened? 
        // Ideally we should remove listeners or use a fresh modal logic.
        // For simplicity, we just hide it. The listeners below are attached once.
    };

    // Attach setup logic only once
    if (!modal.dataset.initialized) {
        document.getElementById('btn-editor-cancel').addEventListener('click', closeEditor);
        document.getElementById('btn-editor-save').addEventListener('click', handleSave);

        document.getElementById('btn-rotate-cw').addEventListener('click', () => handleRotate(90));

        document.querySelectorAll('.filter-choice').forEach(btn => {
            btn.addEventListener('click', () => handleFilter(btn.dataset.filter));
        });

        document.getElementById('editor-text-input').addEventListener('input', (e) => handleText(e.target.value));

        modal.dataset.initialized = 'true';
    } else {
        // Re-attach specific closures if needed, but since we rely on `currentRotation` etc in closure of openImageEditor...
        // WAIT. If openImageEditor is called again, new closures are created for drawImage. 
        // But the event listeners (handleRotate, etc) are attached to the DOM elements ONCE.
        // The OLD event listeners will refer to the OLD closures (old currentRotation variables).
        // This is a BUG. 

        // FIX: Re-create the modal every time or update the state properly.
        // Simple fix: Remove the old modal and recreate it.
        modal.remove();
        modal = createImageEditorModal();
        document.body.appendChild(modal);

        // Re-attach listeners
        document.getElementById('btn-editor-cancel').addEventListener('click', closeEditor);
        document.getElementById('btn-editor-save').addEventListener('click', handleSave);
        document.getElementById('btn-rotate-cw').addEventListener('click', () => handleRotate(90));
        document.querySelectorAll('.filter-choice').forEach(btn => {
            btn.addEventListener('click', () => handleFilter(btn.dataset.filter));
        });
        document.getElementById('editor-text-input').addEventListener('input', (e) => handleText(e.target.value));
    }
}

function createImageEditorModal() {
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

      <div class="editor-canvas-container" style="flex: 1; margin-bottom: var(--space-4);">
        <canvas id="editor-canvas"></canvas>
      </div>

      <div class="editor-controls">
        <div class="flex gap-4 items-center mb-4 overflow-x-auto pb-2">
          <button class="btn btn-ghost btn-sm" id="btn-rotate-cw" title="Xoay phải">🔄 Xoay 90°</button>
          
          <div class="h-divider" style="width: 1px; height: 30px; background: var(--border-color);"></div>

          <div class="flex gap-2">
            <button class="filter-choice btn btn-xs btn-outline" data-filter="none">Vibrant (Gốc)</button>
            <button class="filter-choice btn btn-xs btn-outline" data-filter="grayscale(100%)">B&W</button>
            <button class="filter-choice btn btn-xs btn-outline" data-filter="sepia(100%)">Sepia</button>
            <button class="filter-choice btn btn-xs btn-outline" data-filter="contrast(150%)">High Contrast</button>
            <button class="filter-choice btn btn-xs btn-outline" data-filter="brightness(120%)">Bright</button>
          </div>
        </div>

        <div class="form-group">
          <input type="text" class="form-input" id="editor-text-input" placeholder="Nhập chữ chèn lên ảnh (tự động căn giữa dưới)...">
        </div>
      </div>
    </div>
  `;
    return div;
}
