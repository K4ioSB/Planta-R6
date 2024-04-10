document.addEventListener('DOMContentLoaded', function () {
    const icons = document.querySelectorAll('.icon');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    let offsetX, offsetY;
    let imageLoaded = false;

    const image = new Image();
    image.src = './Fundo/download.jpg'; 
    image.onload = function() {
        canvas.width = this.width;
        canvas.height = this.height;
        ctx.drawImage(this, 0, 0);
        imageLoaded = true;
    };

    icons.forEach(icon => {
        icon.addEventListener('dragstart', function (e) {
            e.dataTransfer.setDragImage(this, 25, 25);
            offsetX = e.offsetX;
            offsetY = e.offsetY;
            e.dataTransfer.setData('text/plain', icon.getAttribute('data-src')); 
        });
    });

    canvas.addEventListener('dragover', function (e) {
        e.preventDefault();
    });

    canvas.addEventListener('drop', function (e) {
        e.preventDefault();
        if (!imageLoaded) return;
        const x = e.clientX - canvas.getBoundingClientRect().left - offsetX;
        const y = e.clientY - canvas.getBoundingClientRect().top - offsetY;
        const iconSrc = e.dataTransfer.getData('text/plain'); 
        const iconImg = new Image();
        iconImg.src = iconSrc;
        iconImg.onload = function() {
            ctx.drawImage(iconImg, x, y, 50, 50); 
        };
    });
});
