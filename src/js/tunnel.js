var Tunnel = (function () {

var RADIUS = 30;

var canvas = document.getElementById('visualizer');
var ctx = canvas.getContext('2d');

var WIDTH;
var HEIGHT;

var CENTER_X;
var CENTER_Y;

var SLICES = 12;

var TWO_PI = 2 * Math.PI;
var ANGLE = TWO_PI / SLICES;
var DIV = 1 / ANGLE;

var pitchColors = [[47, 255, 0], [160, 255, 0], [255, 227, 0], [255, 90, 0], [255, 0, 0], [255, 0, 0], [167, 0, 0], [98, 0, 181], [67, 0, 242], [0, 0, 255], [0, 132, 255], [0, 255, 216]];

var colors = [];
var interval;

function start() {
    interval = setInterval( draw, 33 );
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    CENTER_X = WIDTH / 2;
    CENTER_Y = HEIGHT / 2;
    //setPitches([0,0,0,0,0,0,0,0,0,0,0,0]);
}

function stop() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
}

function draw() {
    var now = new Date().getTime();
    ctx.globalCompositeOperation = 'copy';
    var x = WIDTH / 20 + Math.cos(now / 806) * 2;
    var y = HEIGHT / 20 + Math.sin(now / 551) * 2;
    ctx.drawImage(canvas, x, y, WIDTH - WIDTH / 10, HEIGHT - HEIGHT / 10, 0, 0, WIDTH, HEIGHT);
    ctx.globalCompositeOperation = 'source-over';

    for (var j = 0; j < SLICES; j++) {
        var a = j / DIV + ((Math.cos(now / 1337) + now / 4096) % TWO_PI);
        ctx.beginPath();
        // NOTE: commenting out this line looks pretty sweet
        ctx.moveTo(CENTER_X - Math.sin(now / 618), CENTER_Y + Math.cos(now / 523));
        ctx.arc(CENTER_X, CENTER_Y, RADIUS, a, a + ANGLE, 0);
        ctx.closePath();
        ctx.fillStyle = colors[j];
        ctx.fill();
    }

    ctx.fillStyle = 'black';
    ctx.arc(CENTER_X, CENTER_Y, RADIUS - 3, 0, TWO_PI, false);
    ctx.fill();
}

function setSegment(segment) {
    var pitches = segment.pitches;
    var tambre = segment.tambre;
    var r = pitches[1] * 255;
    var g = pitches[2] * 255;
    var b = pitches[3] * 255;
    for (var i = 0; i < 12; i++) {
        var c = pitchColors[i];
        var p = pitches[i];
        //colors[i] = 'rgb(' + Math.round(r * p) + ',' + Math.round(g * p) + ',' + Math.round(b * p) + ')';
        colors[i] = 'rgb(' + Math.round(c[0] * p) + ',' + Math.round(c[1] * p) + ',' + Math.round(c[2] * p) + ')';
    }
}
return {
    start: start,
    stop: stop,
    setSegment: setSegment
};

})();
