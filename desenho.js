var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var colorInput = document.getElementById('color');
var thicknessInput = document.getElementById('thickness');
var eraseButton = document.getElementById('erase');
var undoButton = document.getElementById('undo');
var clearButton = document.getElementById('clear');

var isDrawing = false;
var lastX = 0;
var lastY = 0;
var drawSnapshotSaved = false;
var undoStack = [];
var currentBackground = './Fundo/download.jpg';

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
        background: currentBackground
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
    context.putImageData(snapshot.imageData, 0, 0);
});