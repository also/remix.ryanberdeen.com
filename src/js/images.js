function draw(width, height, fn) {
    var canvas = new Element('canvas', {width: width, height: height});
    var c = canvas.getContext('2d');
    fn(c);
    return canvas.toDataURL();
}

var playImageUrl = draw(5, 10, function (c) {
    c.fillStyle = 'white';
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(5, 5);
    c.lineTo(0, 10);
    c.fill();
});

var pauseImageUrl = draw(8, 8, function (c) {
    c.fillStyle = 'white';
    c.fillRect(0, 0, 3, 8);
    c.fillRect(5, 0, 5, 8);
});

function drawCloseImage(color) {
    return draw(14, 14, function (c) {
        c.fillStyle = color;
        c.arc(7, 7, 7, 0, Math.PI * 2, false);
        c.fill();
        c.strokeStyle = 'white';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(4, 4);
        c.lineTo(10, 10);
        c.stroke();
        c.moveTo(10, 4);
        c.lineTo(4, 10);
        c.stroke();
    });
}

var closeImageUrl = drawCloseImage('#cccccc');
var closeHoverImageUrl = drawCloseImage('#aaaaaa');

function rule(selector, url) {
    return selector + '{background-image: url("' + url + '");}';
}

document.write('<style type="text/css">'
    + rule('.play_button', playImageUrl)
    + rule('.pause_button', pauseImageUrl)
    + rule('.close_button', closeImageUrl)
    + rule('.close_button:hover', closeHoverImageUrl)
    + '</style>');
