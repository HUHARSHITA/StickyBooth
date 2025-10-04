// --- Initialize Lucide icons and App ---
window.onload = () => {
    lucide.createIcons();
    initializeApp();
};

const canvas = document.getElementById('photo-canvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('image-upload');
const downloadButton = document.getElementById('download-button');
const stickerPalette = document.getElementById('sticker-palette');
const frameOptions = document.getElementById('frame-options');
const deleteStickerButton = document.getElementById('delete-sticker-button');
const messageBox = document.getElementById('message-box');
const themeSelector = document.getElementById('theme-selector');

// --- Core State Management ---
let baseImage = null;
let frameImage = null;
let stickers = [];
let selectedStickerIndex = -1;
let isDragging = false;
let dragOffsetX, dragOffsetY;
let isDraggingBase = false;
let baseDragOffsetX = 0;
let baseDragOffsetY = 0;
let baseImageZoom = 1.0;  // Default: no zoom
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4.0;


const STICKER_DEFAULT_SIZE = 80;

// --- MOCK BASE64 STRING FOR BEACH FRAME (demo only) ---
const BEACH_FRAME_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPoAAAD6CAMAAACUf6dhAAAAA1BMVEXk8t+1u9x8AAAAN0lEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfgAAEZkAAe2Ove4AAAAASUVORK5CYII=';

// --- THEMES & ASSET DATA ---
const THEMES = {
    underwater: {
        name: "🌊 Underwater",
        frames: [
            { id: 'beach', thumb: '🏝️', src: 'beach/beach.png' },
            { id: 'uw1', thumb: '🐠', src: 'beach/sea.png' },
        ],
        stickers: [
            { thumb: '🦀', src: 'beach/crab.png' },
            { thumb: '🏰', src: 'beach/castle.png' },
            { thumb: '🩴', src: 'beach/slipper.png' },
            { thumb: '🐴', src: 'beach/horse.png' },
            { thumb: '🐟', src: 'beach/fish.png' },
            { thumb: '🐢', src: 'beach/turtle.png' },
            { thumb: '🐠', src: 'beach/blue.png' },
            { thumb: '⭐', src: 'beach/star.png' },
            { thumb: '👓', src: 'beach/glass.png' },
            { thumb: '🫧', src: 'beach/bubble.png' },
            { thumb: '🥥', src: 'beach/cocnut.png' },
        ]
    },
    fairytale: {
        name: "🧚 Fairytale",
        frames: [
            { id: 'ft1', thumb: '🏰', src: 'fairytale/fairytale.png' },
            { id: 'ft2', thumb: '✨', src: 'fairytale/fairytale2.png' },
        ],
        stickers: [
            { thumb: '👑', src: 'fairytale/king.png' },
            { thumb: '🦄', src: 'fairytale/horse.png' },
            { thumb: '🧜‍♀️', src: 'fairytale/mermaid.png' },
            { thumb: '🛥️', src: 'fairytale/boat.png' },
            { thumb: '🎃', src: 'fairytale/cart.png' },
            { thumb: '🐱', src: 'fairytale/cat.png' },
            { thumb: '🤡', src: 'fairytale/clown.png' },
            { thumb: '🐉', src: 'fairytale/dragon.png' },
            { thumb: '🐸', src: 'fairytale/frog.png' },
            { thumb: '🫅', src: 'fairytale/prince.png' },
            { thumb: '🧙‍♂️', src: 'fairytale/witch.png' },
        ]
    },
    floral: {
        name: "🌸 Floral",
        frames: [
            { id: 'fl1', thumb: '🌿', src: 'floral/floral.png' },
            { id: 'fl2', thumb: '💐', src: 'floral/floral(1).png' },
        ],
        stickers: [
            { thumb: '🌼', src: 'floral/whit.png' },
            { thumb: '🕯️', src: 'floral/candle.png' },
            { thumb: '☕', src: 'floral/cup.png' },
            { thumb: '🐱', src: 'floral/kitty.png' },
            { thumb: '✉️', src: 'floral/letter.png' },
            { thumb: '🌻', src: 'floral/sunflower.png' },
            { thumb: '📚', src: 'floral/book.png' },

        ]
    },
    baddie: {
        name: "💅 Baddie",
        frames: [
            { id: 'bd1', thumb: '🔥', src: 'baddie/baddie1.png' },
            { id: 'bd2', thumb: '🖤', src: 'baddie/baddie2.png' },
        ],
        stickers: [
            { thumb: '💋', src: 'baddie/lip.png' },
            { thumb: '📷', src: 'baddie/cam.png' },
            { thumb: '❤️', src: 'baddie/card.png' },
            { thumb: '🍒', src: 'baddie/cherry.png' },
            { thumb: '🌸', src: 'baddie/flower.png' },
            { thumb: '💄', src: 'baddie/gloss.png' },
            { thumb: '🫙', src: 'baddie/jar.png' },
            { thumb: '📸', src: 'baddie/pola.png' },
            { thumb: '🐚', src: 'baddie/shell.png' },
        ]
    }
};

// --- Utility Functions ---
function showMessage(text, type = 'blue') {
    messageBox.textContent = text;
    messageBox.className = `mt-4 p-3 rounded-lg block ${type === 'red' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`;
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 4000);
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth, container.clientHeight);
    canvas.width = size;
    canvas.height = size;
    draw();
}

// Camera modal elements
const openCameraBtn = document.getElementById('open-camera-btn');
const cameraModal = document.getElementById('camera-modal');
const video = document.getElementById('video');
const captureBtn = document.getElementById('capture-btn');
const closeCameraBtn = document.getElementById('close-camera-btn');
let stream = null;

openCameraBtn.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        cameraModal.classList.add('show');
        cameraModal.classList.remove('hidden');
    } catch (err) {
        showMessage('Could not access camera: ' + err.message, 'red');
    }
});

closeCameraBtn.addEventListener('click', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    cameraModal.classList.remove('show');
    cameraModal.classList.add('hidden');
});

captureBtn.addEventListener('click', () => {
    // Create a temp canvas for capture
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCanvas.getContext('2d').drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    // Load capture as base image
    loadImage(tempCanvas.toDataURL('image/png'));
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    cameraModal.classList.remove('show');
    cameraModal.classList.add('hidden');
    showMessage('Image captured from camera!');
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw base image
    if (baseImage && canvas.imageData) {
        const { x, y, w, h } = canvas.imageData;
        const scaledW = w * baseImageZoom;
        const scaledH = h * baseImageZoom;
        const offsetX = x - (scaledW - w) / 2; // Keep center fixed
        const offsetY = y - (scaledH - h) / 2;
        ctx.drawImage(baseImage, offsetX, offsetY, scaledW, scaledH);
    }
    else if (!baseImage) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '20px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Upload a photo to start editing', canvas.width / 2, canvas.height / 2);
        downloadButton.disabled = true;
    }

    // 2. Draw stickers (each one)
    stickers.forEach((sticker, index) => {
        ctx.save();
        const centerX = sticker.x + sticker.w / 2;
        const centerY = sticker.y + sticker.h / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(sticker.rotation * Math.PI / 180);
        ctx.drawImage(sticker.img, -sticker.w / 2, -sticker.h / 2, sticker.w, sticker.h);

        // Optional: Show outline if sticker is selected
        if (index === selectedStickerIndex) {
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(-sticker.w / 2, -sticker.h / 2, sticker.w, sticker.h);
        }
        ctx.restore();
    });

    // 3. Draw frame (always on top)
    if (frameImage) {
        ctx.drawImage(frameImage, 0, 0, canvas.width, canvas.height);
    }

    deleteStickerButton.disabled = selectedStickerIndex === -1;
    downloadButton.disabled = !baseImage;
}



function loadImage(src) {
    baseImage = new Image();
    baseImage.onload = () => {
        const scale = Math.min(canvas.width / baseImage.width, canvas.height / baseImage.height);
        const w = baseImage.width * scale;
        const h = baseImage.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        canvas.imageData = { x, y, w, h };
        stickers = [];
        selectedStickerIndex = -1;
        draw();
    };
    baseImage.onerror = () => showMessage('Failed to load image.', 'red');
    baseImage.src = src;
}


// --- Theme & Asset Loading Logic ---
function loadFrame(src) {
    frameImage = new Image();
    frameImage.onload = draw;
    frameImage.onerror = () => showMessage('Failed to load frame. Check the URL.', 'red');
    frameImage.src = src;
}

function loadThemeStickers(themeData) {
    stickerPalette.innerHTML = '';
    themeData.stickers.forEach(sticker => {
        const button = document.createElement('button');
        button.className = 'sticker-button p-2 bg-gray-100 rounded-full text-2xl border border-gray-200';
        button.textContent = sticker.thumb;
        button.dataset.stickerSrc = sticker.src;
        stickerPalette.appendChild(button);
    });
}

function loadThemeFrames(themeData) {
    // Remove all existing frame buttons except the "Clear Frame" button
    const clearFrameButton = document.getElementById('clear-frame');
    frameOptions.innerHTML = '';
    themeData.frames.forEach(frame => {
        const div = document.createElement('div');
        div.className = 'frame-option p-2 border-2 border-transparent rounded-lg cursor-pointer hover:border-pink-500 transition duration-150';
        div.dataset.frameSrc = frame.src;
        div.innerHTML = `<span class="w-10 h-10 rounded flex items-center justify-center text-xl">${frame.thumb}</span>`;
        frameOptions.appendChild(div);
        div.addEventListener('click', (e) => {
            document.querySelectorAll('.frame-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            loadFrame(div.dataset.frameSrc);
            showMessage(`Frame applied: ${themeData.name}.`);
        });
    });
    // Re-add the clear frame button and its listener
    frameOptions.appendChild(clearFrameButton);
    clearFrameButton.addEventListener('click', () => {
        frameImage = null;
        document.querySelectorAll('.frame-option').forEach(el => el.classList.remove('selected'));
        draw();
        showMessage('Frame removed.');
    }, { once: true });
}

// --- Event Listeners Setup ---
function setupListeners() {
    // Populate theme selector
    Object.keys(THEMES).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = THEMES[key].name;
        themeSelector.appendChild(option);
    });
    // Initial load of the first theme
    const initialThemeKey = Object.keys(THEMES)[0];
    loadThemeStickers(THEMES[initialThemeKey]);
    loadThemeFrames(THEMES[initialThemeKey]);

    themeSelector.addEventListener('change', (e) => {
        const key = e.target.value;
        const theme = THEMES[key];
        // Reset frames and stickers when theme changes
        frameImage = null;
        stickers = [];
        selectedStickerIndex = -1;
        document.querySelectorAll('.frame-option').forEach(el => el.classList.remove('selected'));
        loadThemeStickers(theme);
        loadThemeFrames(theme);
        draw();
        showMessage(`Theme switched to ${theme.name}.`);
    });

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            loadImage(URL.createObjectURL(file));
            showMessage('Image loaded successfully.');
        }
    });

    stickerPalette.addEventListener('click', (e) => {
        const button = e.target.closest('.sticker-button');
        if (!button || !baseImage) return;
        const src = button.dataset.stickerSrc;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            stickers.push({
                img: img,
                x: canvas.width / 2 - STICKER_DEFAULT_SIZE / 2,
                y: canvas.height / 2 - STICKER_DEFAULT_SIZE / 2,
                w: STICKER_DEFAULT_SIZE,
                h: STICKER_DEFAULT_SIZE,
                rotation: 0
            });
            selectedStickerIndex = stickers.length - 1;
            draw();
            showMessage('Sticker added. Drag to move, Ctrl/Cmd + Drag to resize, R key to rotate.');
        };
        img.src = src;
    });

    deleteStickerButton.addEventListener('click', () => {
        if (selectedStickerIndex !== -1) {
            stickers.splice(selectedStickerIndex, 1);
            selectedStickerIndex = -1;
            draw();
            showMessage('Sticker deleted.');
        }
    });
    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
        if (!baseImage) return;
        e.preventDefault();
        const zoomChange = e.deltaY < 0 ? 0.1 : -0.1;
        baseImageZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, baseImageZoom + zoomChange));
        draw();
    });

    // Pinch-to-zoom support
    let lastTouchDist = null;
    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (lastTouchDist) {
                let zoomChange = (dist - lastTouchDist) * 0.005;
                baseImageZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, baseImageZoom + zoomChange));
                draw();
            }
            lastTouchDist = dist;
            e.preventDefault();
        }
    });
    canvas.addEventListener('touchend', () => { lastTouchDist = null; });
    canvas.addEventListener('touchcancel', () => { lastTouchDist = null; });
    // Canvas drag/pan events
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('touchstart', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchend', handleEnd);
}

// --- Canvas Interaction Handlers ---
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : null);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : null);
    if (clientX === null) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
}

function isPointInSticker(x, y, sticker) {
    return x >= sticker.x && x <= sticker.x + sticker.w &&
        y >= sticker.y && y <= sticker.y + sticker.h;
}

function handleStart(e) {
    e.preventDefault();
    if (!baseImage) return;
    const pos = getMousePos(e);

    // Check stickers first (topmost first)
    const clickedIndex = stickers.slice().reverse().findIndex(sticker => isPointInSticker(pos.x, pos.y, sticker));
    if (clickedIndex !== -1) {
        selectedStickerIndex = stickers.length - 1 - clickedIndex;
        const sticker = stickers[selectedStickerIndex];
        isDragging = true;
        dragOffsetX = pos.x - sticker.x;
        dragOffsetY = pos.y - sticker.y;
        isDraggingBase = false;
    } else {
        // Check if clicked inside base image bounds
        const imgData = canvas.imageData;
        if (imgData && pos.x >= imgData.x && pos.x <= imgData.x + imgData.w &&
            pos.y >= imgData.y && pos.y <= imgData.y + imgData.h) {
            isDraggingBase = true;
            baseDragOffsetX = pos.x - imgData.x;
            baseDragOffsetY = pos.y - imgData.y;
            selectedStickerIndex = -1;
            isDragging = false;
        } else {
            selectedStickerIndex = -1;
            isDragging = false;
            isDraggingBase = false;
        }
    }
    draw();
}

function handleMove(e) {
    const pos = getMousePos(e);
    if (isDragging && selectedStickerIndex !== -1) {
        e.preventDefault();
        const sticker = stickers[selectedStickerIndex];
        const isCtrl = e.ctrlKey || e.metaKey || (e.touches && e.touches.length > 1);
        if (isCtrl) {
            // Resize sticker logic (unchanged)...
            const centerX = sticker.x + sticker.w / 2;
            const centerY = sticker.y + sticker.h / 2;
            const dx = pos.x - centerX;
            const dy = pos.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const newSize = Math.max(20, Math.min(300, distance * 0.8));
            sticker.x = centerX - newSize / 2;
            sticker.y = centerY - newSize / 2;
            sticker.w = newSize;
            sticker.h = newSize;
        } else {
            sticker.x = pos.x - dragOffsetX;
            sticker.y = pos.y - dragOffsetY;
        }
        draw();
    } else if (isDraggingBase) {
        e.preventDefault();
        // Move base image offset by dragging
        const imgData = canvas.imageData;
        const dx = pos.x - baseDragOffsetX;
        const dy = pos.y - baseDragOffsetY;
        // Update stored image position with same width/height
        canvas.imageData = { x: dx, y: dy, w: imgData.w, h: imgData.h };
        draw();
    }
}


function handleEnd() {
    isDragging = false;
    isDraggingBase = false;
}


// --- Download Button ---
downloadButton.addEventListener('click', () => {
    if (!baseImage) return;

    const exportSize = 1000;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = exportSize;
    tempCanvas.height = exportSize;
    const tempCtx = tempCanvas.getContext('2d');

    const { x, y, w, h } = canvas.imageData;
    const scaledW = w * baseImageZoom;
    const scaledH = h * baseImageZoom;
    const offsetX = x - (scaledW - w) / 2;
    const offsetY = y - (scaledH - h) / 2;

    // Calculate scale factors
    const scaleX = exportSize / canvas.width;
    const scaleY = exportSize / canvas.height;

    // Draw the zoomed base image only once
    tempCtx.drawImage(baseImage, offsetX * scaleX, offsetY * scaleY, scaledW * scaleX, scaledH * scaleY);

    // Draw stickers scaled and rotated
    stickers.forEach(sticker => {
        tempCtx.save();
        const exp_w = sticker.w * scaleX;
        const exp_h = sticker.h * scaleY;
        const exp_x = sticker.x * scaleX;
        const exp_y = sticker.y * scaleY;
        const centerX = exp_x + exp_w / 2;
        const centerY = exp_y + exp_h / 2;
        tempCtx.translate(centerX, centerY);
        tempCtx.rotate(sticker.rotation * Math.PI / 180);
        tempCtx.drawImage(sticker.img, -exp_w / 2, -exp_h / 2, exp_w, exp_h);
        tempCtx.restore();
    });


    // Draw frame
    if (frameImage) {
        tempCtx.drawImage(frameImage, 0, 0, exportSize, exportSize);
    }

    // Download image
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const fileName = `stickerPhotobooth-${themeSelector.value}-${timestamp}.png`;
    link.download = fileName;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
    showMessage('Image downloaded! 🎉');
});


// --- Initialization ---
function initializeApp() {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    setupListeners();
    showMessage('Welcome! Select a theme and upload an image to start editing.');
}

// --- Keyboard shortcuts for rotation/deletion ---
document.addEventListener('keydown', (e) => {
    if (selectedStickerIndex === -1) return;
    const sticker = stickers[selectedStickerIndex];
    if (e.key === 'r' || e.key === 'R') {
        sticker.rotation += 15;
        e.preventDefault();
        draw();
    }
    else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteStickerButton.click();
        e.preventDefault();
    }
});
