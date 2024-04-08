var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var colorInput = document.getElementById('color');
var thicknessInput = document.getElementById('thickness');
var eraseButton = document.getElementById('erase');
var clearButton = document.getElementById('clear');

var isDrawing = false;
var lastX = 0;
var lastY = 0;

function changeBackground(imageUrl) {
    var img = new Image();
    img.onload = function() {
        context.clearRect(0, 0, canvas.width, canvas.height); 
        context.drawImage(img, 0, 0, canvas.width, canvas.height); 
    };
    img.src = imageUrl;
}

canvas.addEventListener('mousedown', function(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
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
    context.lineTo(e.offsetX, e.offsetY);
    context.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener('mouseup', function() {
    isDrawing = false;
});

eraseButton.addEventListener('click', function() {
    eraseButton.classList.toggle('active');
});

clearButton.addEventListener('click', function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
});