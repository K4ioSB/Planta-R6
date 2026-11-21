var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var colorInput = document.getElementById('color');
var thicknessInput = document.getElementById('thickness');
var eraseButton = document.getElementById('erase');
var undoButton = document.getElementById('undo');
var clearButton = document.getElementById('clear');
var downloadButton = document.getElementById('download');

var isDrawing = false;
var lastX = 0;
var lastY = 0;
var drawSnapshotSaved = false;
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

function changeBackground(imageUrl) {
    saveCanvasSnapshot();
    currentBackground = imageUrl;
    selectedMapName = getMapName(imageUrl);
    var img = new Image();
    img.onload = function() {
        context.clearRect(0, 0, canvas.width, canvas.height); 
        context.drawImage(img, 0, 0, canvas.width, canvas.height); 
    };
    img.src = imageUrl;
}

canvas.addEventListener('mousedown', function(e) {
    isDrawing = true;
    drawSnapshotSaved = true;
    saveCanvasSnapshot();
    [lastX, lastY] = getCanvasPoint(e);
});

canvas.addEventListener('mousemove', function(e) {
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

canvas.addEventListener('mouseup', function() {
    isDrawing = false;
});

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