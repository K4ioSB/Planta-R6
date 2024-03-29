window.onload = function () {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var isDrawing = false;
    var colorPicker = document.getElementById('color');
    var thicknessInput = document.getElementById('thickness');
    var eraseButton = document.getElementById('erase');
    var clearButton = document.getElementById('clear');
    var isErasing = false;
    var icons = document.querySelectorAll('.icon');

    // Posição inicial do ícone
    var iconX = 50;
    var iconY = 50;

    // Função para desenhar ícones no canvas
    function drawIcons() {
        icons.forEach(function(icon) {
            context.drawImage(icon, iconX, iconY, icon.width, icon.height);
        });
    }

    // Desenha os ícones ao carregar a página
    drawIcons();

    // Adiciona evento de clique no canvas
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    clearButton.addEventListener('click', clearCanvas);

    // Variáveis para controle do movimento do ícone
    var isIconClicked = false;
    var iconClicked = null;
    var initialMouseX = 0;
    var initialMouseY = 0;
    var initialIconX = 0;
    var initialIconY = 0;

    // Adiciona evento de clique nos ícones
    icons.forEach(function(icon) {
        icon.addEventListener('click', function(e) {
            isIconClicked = true;
            iconClicked = icon;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;
            initialIconX = iconX;
            initialIconY = iconY;
        });
    });

    // Adiciona evento de movimento do mouse no canvas
    canvas.addEventListener('mousemove', function(e) {
        if (isIconClicked && iconClicked) {
            var deltaX = e.clientX - initialMouseX;
            var deltaY = e.clientY - initialMouseY;
            iconX = initialIconX + deltaX;
            iconY = initialIconY + deltaY;

            context.clearRect(0, 0, canvas.width, canvas.height);
            drawIcons();
        }
    });

    // Função de início de desenho
    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }

    // Função de desenho
    function draw(e) {
        if (!isDrawing) return;

        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;

        context.lineWidth = thicknessInput.value;
        context.lineCap = 'round';
        if (isErasing) {
            context.strokeStyle = '#811628';
        } else {
            context.strokeStyle = colorPicker.value;
        }

        context.lineTo(x, y);
        context.stroke();
        context.beginPath();
        context.moveTo(x, y);
    }

    // Função de término de desenho
    function stopDrawing() {
        isDrawing = false;
        context.beginPath();
    }

    // Função para limpar o canvas
    function clearCanvas() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        // Redesenhar os ícones após limpar o canvas
        drawIcons();
    }

    // Adiciona evento de clique no botão de borracha
    eraseButton.addEventListener('click', function () {
        isErasing = !isErasing;
        eraseButton.textContent = isErasing ? 'Lápis' : 'Borracha';
    });
};
