document.addEventListener('DOMContentLoaded', function () {
    const icons = document.querySelectorAll('.icon'); 
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    let imageLoaded = false;
    let rotationAngle = {}; 
    const iconSizeInput = document.getElementById('icon-size');
    const iconSizeValue = document.getElementById('icon-size-value');

    iconSizeInput.addEventListener('input', function () {
        iconSizeValue.textContent = `${iconSizeInput.value} px`;
    });

    const image = new Image();
    image.src = './Fundo/download.jpg'; 
    image.onload = function() {
        if (window.currentBackground === './Fundo/download.jpg') {
            canvas.width = this.width;
            canvas.height = this.height;
            ctx.drawImage(this, 0, 0);
            if (typeof window.saveCanvasSnapshot === 'function') {
                window.saveCanvasSnapshot();
            }
        }
        imageLoaded = true;
    };

    icons.forEach(icon => {
        rotationAngle[icon.id] = 0;
    });

    document.addEventListener('click', function(e) {
        const icon = e.target.closest('.icon');
        if (!icon || !icon.closest('.gadgets')) return;

        const iconId = icon.id;
        rotationAngle[iconId] = ((rotationAngle[iconId] || 0) + 90) % 360;
        const image = icon.querySelector('img');
        image.classList.remove('rotated-90', 'rotated-180', 'rotated-270');
        if (rotationAngle[iconId] !== 0) {
            image.classList.add('rotated-' + rotationAngle[iconId]);
        }
    });

    document.addEventListener('dragstart', function(e) {
        const icon = e.target.closest('.icon');
        if (!icon || !icon.hasAttribute('data-src')) return;

        const size = Number(iconSizeInput.value);
        e.dataTransfer.setDragImage(icon, size / 2, size / 2);
        e.dataTransfer.setData('text/plain', JSON.stringify({
            src: icon.getAttribute('data-src'),
            id: icon.id,
            playerName: icon.getAttribute('data-player-name') || ''
        }));
    });

    canvas.addEventListener('dragover', function (e) {
        e.preventDefault();
    });

    canvas.addEventListener('drop', function (e) {
        e.preventDefault();
        if (!imageLoaded) return;

        if (typeof window.saveCanvasSnapshot === 'function') {
            window.saveCanvasSnapshot();
        }

        const rect = canvas.getBoundingClientRect();
        const size = Number(iconSizeInput.value);
        const x = (e.clientX - rect.left) * (canvas.width / rect.width) - (size / 2);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height) - (size / 2);
        
       
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const iconSrc = data.src;
        const iconId = data.id;
        const playerName = (data.playerName || '').trim();
        const iconRotation = rotationAngle[iconId] || 0; 

        const iconImg = new Image();
        iconImg.src = iconSrc;
        iconImg.onload = function() {
            ctx.save();
            ctx.translate(x + (size / 2), y + (size / 2));

          
            if (document.getElementById(iconId).closest('.gadgets')) {
                ctx.rotate((iconRotation * Math.PI) / 180);
            }

            ctx.drawImage(iconImg, -(size / 2), -(size / 2), size, size);
            if (playerName) {
                const fontSize = Math.max(12, Math.round(size * 0.32));
                const labelY = -(size / 2) - 5;
                ctx.font = `bold ${fontSize}px Arial, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.lineJoin = 'round';
                ctx.lineWidth = Math.max(2, fontSize * 0.18);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
                ctx.fillStyle = '#fff';
                ctx.strokeText(playerName, 0, labelY, size * 3);
                ctx.fillText(playerName, 0, labelY, size * 3);
            }
            ctx.restore();
        };
    });
});
