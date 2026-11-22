var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var colorInput = document.getElementById('color');
var thicknessInput = document.getElementById('thickness');
var eraseButton = document.getElementById('erase');
var undoButton = document.getElementById('undo');
var clearButton = document.getElementById('clear');
var downloadButton = document.getElementById('download');
var drawModeButton = document.getElementById('draw-mode');
var canvasViewport = document.querySelector('.canvas-viewport');
var zoomIndicator = document.getElementById('zoom-indicator');

var isDrawing = false;
var isPanning = false;
var isDrawMode = false;
var lastX = 0;
var lastY = 0;
var panStartX = 0;
var panStartY = 0;
var panStartOffsetX = 0;
var panStartOffsetY = 0;
var zoomScale = 1;
var panX = 0;
var panY = 0;
var undoStack = [];
var currentBackground = './Fundo/download.jpg';
var selectedMapName = 'Planta R6';

function getMapName(imageUrl) {
    var fileName = imageUrl.split('/').pop().replace(/\.[^.]+$/, '');
    var mapNames = {
        Banco: 'Banco',
        Fronteira: 'Fronteira',
        Chale: 'Chalé',
        Club: 'Clube',
        Litoral: 'Litoral',
        Consulado: 'Consulado',
        Cafe: 'Café Dostoyevsky',
        Canal: 'Canal',
        Oregon: 'Oregon',
        Outback: 'Outback',
        Arranha: 'Arranha Céu',
        Parque: 'Parque Traumático',
        Mansao: 'Mansão',
        Covil: 'Covil',
        Lab: 'Laboratórios Nighthaven',
        Esmeralda: 'Planície Esmeralda'
    };
    var mapKey = Object.keys(mapNames).find(function(key) {
        return fileName.indexOf(key) === 0;
    });
    var floorMap = {
        Porao: 'Porão',
        Terreo: 'Térreo',
        Primeiro: '1º Andar',
        Segundo: '2º Andar',
        Telhado: 'Telhado',
        Telhado1: 'Telhado 1',
        Telhado2: 'Telhado 2',
        Terreo1: 'Térreo 1',
        Terreo2: 'Térreo 2',
        Primeiro1: '1º Andar 1',
        Primeiro2: '1º Andar 2'
    };
    var mapName = mapKey ? mapNames[mapKey] : 'Planta R6';
    var suffix = fileName.slice(mapKey ? mapKey.length : 0);
    var floorName = floorMap[suffix] || '';
    return floorName ? mapName + ' - ' + floorName : mapName;
}

function getCanvasPoint(event) {
    var rect = canvas.getBoundingClientRect();
    return [
        (event.clientX - rect.left) * (canvas.width / rect.width),
        (event.clientY - rect.top) * (canvas.height / rect.height)
    ];
}

function updateCanvasTransform() {
    canvas.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoomScale + ')';
}

function centerCanvasView() {
    panX = 0;
    panY = 0;
    zoomScale = 1;
    updateCanvasTransform();
    zoomIndicator.textContent = 'Zoom: 100%';
}

window.centerCanvasView = centerCanvasView;
document.getElementById('center-canvas').addEventListener('click', centerCanvasView);

function constrainPan() {
    var viewportWidth = canvasViewport.clientWidth;
    var viewportHeight = canvasViewport.clientHeight;
    var canvasWidth = canvas.offsetWidth;
    var canvasHeight = canvas.offsetHeight;
    var baseX = (viewportWidth - canvasWidth) / 2;
    var baseY = (viewportHeight - canvasHeight) / 2;
    var minVisible = Math.min(80, viewportWidth / 2, viewportHeight / 2);

    panX = Math.max(minVisible - baseX - canvasWidth * zoomScale,
        Math.min(viewportWidth - minVisible - baseX, panX));
    panY = Math.max(minVisible - baseY - canvasHeight * zoomScale,
        Math.min(viewportHeight - minVisible - baseY, panY));
}

canvasViewport.addEventListener('wheel', function(e) {
    e.preventDefault();

    var previousZoom = zoomScale;
    var nextZoom = Math.max(1, Math.min(3, zoomScale * Math.pow(1.1, -e.deltaY / 100)));
    if (nextZoom === previousZoom) return;

    var rect = canvas.getBoundingClientRect();
    var canvasPointX = (e.clientX - rect.left) / previousZoom;
    var canvasPointY = (e.clientY - rect.top) / previousZoom;
    panX += (previousZoom - nextZoom) * canvasPointX;
    panY += (previousZoom - nextZoom) * canvasPointY;
    zoomScale = nextZoom;
    constrainPan();
    updateCanvasTransform();
    zoomIndicator.textContent = 'Zoom: ' + Math.round(zoomScale * 100) + '%';
}, { passive: false });

drawModeButton.addEventListener('click', function() {
    isDrawMode = !isDrawMode;
    drawModeButton.setAttribute('aria-pressed', String(isDrawMode));
    drawModeButton.textContent = isDrawMode ? 'Mover imagem' : 'Desenhar';
    canvas.classList.toggle('drawing-mode', isDrawMode);
});

function saveCanvasSnapshot() {
    undoStack.push({
        imageData: context.getImageData(0, 0, canvas.width, canvas.height),
        background: currentBackground,
        mapName: selectedMapName
    });
    if (undoStack.length > 50) {
        undoStack.shift();
    }
}

window.saveCanvasSnapshot = saveCanvasSnapshot;

function redrawCurrentBackground() {
    var img = new Image();
    img.onload = function() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = currentBackground;
}

function changeBackground(imageUrl, mapName) {
    saveCanvasSnapshot();
    currentBackground = imageUrl;
    selectedMapName = mapName || getMapName(imageUrl);
    var img = new Image();
    img.onload = function() {
        context.clearRect(0, 0, canvas.width, canvas.height); 
        context.drawImage(img, 0, 0, canvas.width, canvas.height); 
    };
    img.src = imageUrl;
}

canvas.addEventListener('pointerdown', function(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);

    if (isDrawMode) {
        isDrawing = true;
        saveCanvasSnapshot();
        [lastX, lastY] = getCanvasPoint(e);
        return;
    }

    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panStartOffsetX = panX;
    panStartOffsetY = panY;
    canvas.classList.add('panning');
});

canvas.addEventListener('pointermove', function(e) {
    if (isPanning) {
        panX = panStartOffsetX + e.clientX - panStartX;
        panY = panStartOffsetY + e.clientY - panStartY;
        constrainPan();
        updateCanvasTransform();
        return;
    }
    if (!isDrawing) return;

    context.strokeStyle = colorInput.value;
    context.lineWidth = thicknessInput.value;
    if (eraseButton.classList.contains('active')) {
        context.globalCompositeOperation = 'destination-out';
    } else {
        context.globalCompositeOperation = 'source-over';
    }

    context.beginPath();
    context.moveTo(lastX, lastY);
    var point = getCanvasPoint(e);
    context.lineTo(point[0], point[1]);
    context.stroke();
    [lastX, lastY] = point;
});

function finishCanvasInteraction() {
    isDrawing = false;
    isPanning = false;
    canvas.classList.remove('panning');
}

canvas.addEventListener('pointerup', finishCanvasInteraction);
canvas.addEventListener('pointercancel', finishCanvasInteraction);

eraseButton.addEventListener('click', function() {
    eraseButton.classList.toggle('active');
});

clearButton.addEventListener('click', function() {
    saveCanvasSnapshot();
    redrawCurrentBackground();
});

undoButton.addEventListener('click', function() {
    if (undoStack.length === 0) return;

    var snapshot = undoStack.pop();
    currentBackground = snapshot.background;
    selectedMapName = snapshot.mapName;
    context.putImageData(snapshot.imageData, 0, 0);
});

downloadButton.addEventListener('click', function() {
    var link = document.createElement('a');
    var fileName = selectedMapName.replace(/[<>:"/\\|?*]/g, '-').trim();
    link.download = fileName + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});