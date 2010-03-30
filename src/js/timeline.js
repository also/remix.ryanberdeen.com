var Timeline = function () {
    var aqs;
    var selectedAq;
    var duration;

    var scale = 10;

    var canvas = $('timeline_canvas');
    canvas.observe('click', onClick);

    var wrapper = canvas.up();
    var ctx = canvas.getContext('2d');
    var top = 0.5;
    var bottom = bottom = canvas.height - 0.5;
    var cornerSize = 0;

    var zoomOptions = Viz.zoomify({
        canvas: canvas,
        wrapper: wrapper,
        scale: scale,
        setScale: setScale,
        zoomable: false,
        //FIXME
        width: 100
    });

    this.setMix = function (mix) {
        aqs = mix;
        selectedAq = null;

        duration = 0;

        for (var i = 0; i < aqs.length; i++) {
            duration += aqs[i].duration;
        }

        zoomOptions.width = duration;
        zoomOptions.zoomable = true;

        setScale(scale);
    };

    function setScale(newScale) {
        scale = newScale;
        // TODO should be in zoomify
        canvas.width = scale * duration;
        canvas.style.width = canvas.width + 'px';
        draw();
    }

    function draw() {;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var i, aq;

        applyDefaultStyle();

        for (var i = 0; i < aqs.length; i++) {
            drawAq(aqs[i]);
        }

        if (selectedAq) {
            drawSelection();
        }
    }

    function applyDefaultStyle() {
        ctx.fillStyle = '#cccccc';
        ctx.strokeStyle = '#aaaaaa';
    }

    function applySelectedtStyle() {
        ctx.fillStyle = '#80d7f7';
        ctx.strokeStyle = '#00aeef';
    }

    function drawAq(aq) {
        var width = (aq.duration) * scale;
        var cornerWidth = Math.min(cornerSize, width - 4);
        var pos = aq.offset * scale;
        var left = Math.floor(pos + 1) + .5;
        var right = Math.floor(pos + width - 1) + .5;

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right - cornerWidth, top);
        ctx.lineTo(right, top + cornerSize);
        ctx.lineTo(right, bottom);
        ctx.lineTo(left, bottom);
        ctx.lineTo(left, top);
        ctx.fill();
        ctx.stroke();
    }

    this.onPlayerProgress = function (progress, index, sourcePosition) {
        select(index);
        center(selectedAq.offset);
    };

    function select(index) {
        if (selectedAq) {
            applyDefaultStyle();
            drawAq(selectedAq);
        }
        selectedAq = aqs[index];
        drawSelection()
    }

    function drawSelection() {
        applySelectedtStyle();
        drawAq(selectedAq);
    }

    function center(position) {
        wrapper.scrollLeft = position * scale - wrapper.getWidth() / 2;
    }

    function onClick(e) {
        e.stop();
        var offset = position(e);
        var aq
        for (var i = 0; i < aqs.length; i++) {
            aq = aqs[i];
            var pos = aq.offset;
            if (offset < pos + aq.duration && offset >= pos) {
                break;
            }
        }
        select(i);
        App.selectTrackRange(aq);
    }

    function position(e) {
        return (e.pointerX() - canvas.cumulativeOffset().left + canvas.cumulativeScrollOffset().left) / scale;
    }
}
