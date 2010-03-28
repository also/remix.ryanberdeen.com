var Viz = (function () {

var wrapper;
var analysisCanvas;
var analysisCanvasScale = 10;
    
function createCanvas () {
    wrapper = new Element('div', {'class': 'track_viz'});
    analysisCanvas = new Element('canvas', {width: 1, height: '130'});
    analysisCanvas.observe('mousedown', onAnalysisMouseDown);
    analysisCanvas.observe('mousewheel', onAnalysisMouseWheel);
    wrapper.update(analysisCanvas);
    drawAnalysis();
    return wrapper;
}

var pitchColors = ["47, 255, 0", "160, 255, 0", "255, 227, 0", "255, 90, 0", "255, 0, 0", "255, 0, 0", "167, 0, 0", "98, 0, 181", "67, 0, 242", "0, 0, 255", "0, 132, 255", "0, 255, 216"];

function drawAnalysis() {
    var track = Editor.selectedTrack;
    var canvas = analysisCanvas;
    canvas.width = analysisCanvasScale * track.analysis.duration;
    var ctx = canvas.getContext('2d');

    ctx.save();
    ctx.fillStyle = '#dddddd';
    ctx.translate(0, 12);
    drawEvents(ctx, track.analysis.bars);
    ctx.translate(0, 6);
    drawEvents(ctx, track.analysis.beats);
    ctx.translate(0, 6);
    drawEvents(ctx, track.analysis.tatums);

    var segs = track.analysis.segments;
    var offsetTop = 32;
    var height = (canvas.height - offsetTop) / 12;
    ctx.translate(0, 8.5);
    ctx.clearRect(0, 10, canvas.width, canvas.height - 10);
    for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        for (var j = 0; j < 12; j++) {
            var p = s.pitches[j];
            ctx.fillStyle = 'rgba(' + pitchColors[j] + ', ' + p + ')';
            ctx.fillRect(s.start * analysisCanvasScale, j * height, s.duration * analysisCanvasScale, height);
        }
    }
    ctx.restore();
    drawSelection();
}

function drawEvents(ctx, events) {
    for (var i = 0; i < events.length; i++) {
        ctx.beginPath();
        var e = events[i];
        ctx.arc(e.start * analysisCanvasScale, 2, 2, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
    }
}

function analysisPosition(e) {
    return (e.pointerX() - analysisCanvas.cumulativeOffset().left + analysisCanvas.cumulativeScrollOffset().left) / analysisCanvasScale;
}

function positionAnalysis(offset, target) {
    var scaledTarget = Math.round(target * analysisCanvasScale);
    wrapper.scrollLeft = scaledTarget - offset;
}

function onAnalysisMouseDown(e) {
    e.stop();
    var track = Editor.selectedTrack;
    track.selection.start = analysisPosition(e);
    $(document).observe('mouseup', onAnalysisMouseUp);
    $(document).observe('mousemove', onAnalysisMouseMove);
}

function onAnalysisMouseUp(e) {
    e.stop();
    var track = Editor.selectedTrack;
    var selection = track.selection;
    selection.end = analysisPosition(e);
    $(document).stopObserving('mouseup', onAnalysisMouseUp);
    $(document).stopObserving('mousemove', onAnalysisMouseMove);
    if (selection.end < selection.start) {
        var start = selection.end;
        selection.end = selection.start;
        selection.start = start;
    }
    drawSelection();
    Remix.remix([selection]);
}

function onAnalysisMouseMove(e) {
    e.stop();
    var track = Editor.selectedTrack;
    var selection = track.selection;
    selection.end = analysisPosition(e);
    drawSelection();
}

var drawAnalysisTimeout = null;

function onAnalysisMouseWheel(e) {
    if (Math.abs(e.wheelDeltaY) > 0 && Math.abs(e.wheelDeltaX) < 10) {
        e.stop();
        if (drawAnalysisTimeout) {
            clearTimeout(drawAnalysisTimeout);
        }
        var pos = analysisPosition(e);
        var targetScale = analysisCanvasScale + e.wheelDeltaY / 200;
        var newWidth = Math.floor(targetScale * Editor.selectedTrack.analysis.duration)
        analysisCanvasScale = newWidth / Editor.selectedTrack.analysis.duration;
        analysisCanvas.style.width = newWidth + 'px';
        drawAnalysisTimeout = setTimeout(drawAnalysis, 300);
        positionAnalysis(e.pointerX() - analysisCanvas.cumulativeOffset().left, pos);
    }
}

function drawSelection() {
    var canvas = analysisCanvas;
    var track = Editor.selectedTrack;
    var selection = track.selection;
    var track = Editor.selectedTrack;
    var left = selection.start * analysisCanvasScale;
    var right = selection.end * analysisCanvasScale;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.getWidth(), 10);
    ctx.strokeStyle = 'rgb(0, 174, 239)';
    ctx.fillStyle = 'rgba(0, 174, 239, 0.5)';
    ctx.fillRect(left, 0, right - left, 10);
    // ctx.moveTo(left, 0);
    // ctx.lineTo(left, 10);
    // ctx.stroke();
    // ctx.moveTo(right, 0);
    // ctx.lineTo(right, 10);
    // ctx.stroke();
}

return {
    createCanvas: createCanvas
}
})();
