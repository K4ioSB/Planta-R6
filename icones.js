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
        canvas.width = this.width;
        canvas.height = this.height;
        ctx.drawImage(this, 0, 0);
        imageLoaded = true;
        if (typeof window.saveCanvasSnapshot === 'function') {
            window.saveCanvasSnapshot();
        }
    };

    icons.forEach(icon => {
        const iconId = icon.id;
        rotationAngle[iconId] = 0; 

        
        if (icon.closest('.gadgets')) {
            icon.addEventListener('click', function () {
               
                rotationAngle[iconId] = (rotationAngle[iconId] + 90) % 360;
                
              
                icon.querySelector('img').classList.remove('rotated-90', 'rotated-180', 'rotated-270');
                if (rotationAngle[iconId] === 90) {
                    icon.querySelector('img').classList.add('rotated-90');
                } else if (rotationAngle[iconId] === 180) {
                    icon.querySelector('img').classList.add('rotated-180');
                } else if (rotationAngle[iconId] === 270) {
                    icon.querySelector('img').classList.add('rotated-270');
                }
            });
        }

        icon.addEventListener('dragstart', function (e) {
            const size = Number(iconSizeInput.value);
            e.dataTransfer.setDragImage(this, size / 2, size / 2);
            e.dataTransfer.setData('text/plain', JSON.stringify({ src: icon.getAttribute('data-src'), id: iconId }));
        });
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
            ctx.restore();
        };
    });
});
