var Viz = (function () {

var wrapper;
var analysisCanvas;
var analysisCanvasScale = 10;

var selection;

function createCanvas () {
    wrapper = new Element('div', {'class': 'track_viz small_scrollbar'});
    analysisCanvas = new Element('canvas', {width: 1, height: '130'});
    analysisCanvas.observe('mousedown', onAnalysisMouseDown);
    zoomify({
        canvas: analysisCanvas,
        wrapper: wrapper,
        scale: analysisCanvasScale,
        setScale: setScale,
        width: App.selectedTrack.analysis.duration,
        zoomable: true
    });
    wrapper.update(analysisCanvas);
    selection = App.selectedTrack.selection;
    setScale(analysisCanvasScale);
    return wrapper;
}

function setScale(scale) {
    analysisCanvasScale = scale;
    analysisCanvas.width = scale * App.selectedTrack.analysis.duration;
    drawAnalysis();
}

var pitchColors = ["47, 255, 0", "160, 255, 0", "255, 227, 0", "255, 90, 0", "255, 0, 0", "255, 0, 0", "167, 0, 0", "98, 0, 181", "67, 0, 242", "0, 0, 255", "0, 132, 255", "0, 255, 216"];

function drawAnalysis() {
    var track = App.selectedTrack;
    var canvas = analysisCanvas;

    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 10, canvas.width, canvas.height - 10);

    ctx.save();
    ctx.fillStyle = '#dddddd';
    ctx.translate(0, 12.5);
    drawEvents(ctx, track.analysis.bars);
    ctx.translate(0, 6);
    drawEvents(ctx, track.analysis.beats);
    ctx.translate(0, 6);
    drawEvents(ctx, track.analysis.tatums);

    var segs = track.analysis.segments;
    var offsetTop = 32;
    var height = Math.floor((canvas.height - offsetTop) / 12);
    ctx.translate(0, 8);
    var left = 0;
    for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        for (var j = 0; j < 12; j++) {
            var p = s.pitches[j];
            var right = Math.round(s.end * analysisCanvasScale);
            var top = j * height + 0.5;
            var width = right - left;
            ctx.fillStyle = 'rgba(' + pitchColors[j] + ', ' + p + ')';
            ctx.fillRect(left, top, width, height);
        }
        left = right;
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

function center(position) {
    positionAnalysis(wrapper.getWidth() / 2, position);
}

function onAnalysisMouseDown(e) {
    e.stop();
    var track = App.selectedTrack;
    selection = {
        start: analysisPosition(e),
        track: track
    };
    $(document).observe('mouseup', onAnalysisMouseUp);
    $(document).observe('mousemove', onAnalysisMouseMove);
}

function onAnalysisMouseUp(e) {
    e.stop();
    var track = App.selectedTrack;
    selection.end = analysisPosition(e);
    $(document).stopObserving('mouseup', onAnalysisMouseUp);
    $(document).stopObserving('mousemove', onAnalysisMouseMove);
    if (selection.end < selection.start) {
        var start = selection.end;
        selection.end = selection.start;
        selection.start = start;
    }
    App.selectTrackRange(selection, Viz);
}

function onAnalysisMouseMove(e) {
    e.stop();
    var track = App.selectedTrack;
    selection.end = analysisPosition(e);
    drawSelection();
}

function selectTrackRange(source) {
    selection = App.selectedTrack.selection;
    drawSelection();
    if (source != Viz) {
        center(selection.start);
    }
}

function drawSelection() {
    var canvas = analysisCanvas;
    var track = App.selectedTrack;
    var left = Math.round(selection.start * analysisCanvasScale) + 0.5;
    var right = Math.round(selection.end * analysisCanvasScale) + 0.5;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.getWidth(), 10);
    ctx.strokeStyle = 'rgb(0, 174, 239)';
    ctx.fillStyle = 'rgba(0, 174, 239, 0.5)';
    ctx.fillRect(left, 0, right - left, 10);

    ctx.beginPath();
    ctx.moveTo(left, 0);
    ctx.lineTo(left, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(right, 0);
    ctx.lineTo(right, 10);
    ctx.stroke();
}

function zoomify(options) {
    var canvas = options.canvas;
    var scale = options.scale;
    var setScale = options.setScale;
    var wrapper = options.wrapper;

    var drawTimeout = null;
    wrapper.observe('mousewheel', onMouseWheel);

    canvas.width = scale * options.width;

    function onMouseWheel(e) {
        // TODO if the scrolling element is in another scrolling element, when
        // the user scrolls to the edge it is easy to get unexpected vertical
        // scrolling, because the element no longer captures the scrolling
        if (Math.abs(e.wheelDeltaY) > 0 && Math.abs(e.wheelDeltaX) < 10) {
            e.stop();
            if (drawTimeout) {
                clearTimeout(drawTimeout);
            }
            if (!options.zoomable) {
                return;
            }
            var pos = (e.pointerX() - canvas.cumulativeOffset().left + canvas.cumulativeScrollOffset().left) / scale;
            var targetScale = scale + e.wheelDeltaY / 200;
            var newWidth = Math.floor(targetScale * options.width);
            scale = newWidth / options.width;
            canvas.style.width = newWidth + 'px';
            drawTimeout = setTimeout(redraw, 300);
            wrapper.scrollLeft = Math.round(pos * scale) - (e.pointerX() - canvas.cumulativeOffset().left);
        }
    }

    function redraw() {
        setScale(scale);
    }

    return options;
}

return {
    createCanvas: createCanvas,
    selectTrackRange: selectTrackRange,
    zoomify: zoomify
}
})();
