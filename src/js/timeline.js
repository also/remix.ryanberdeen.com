var Timeline = function () {
    var aqs;
    var selectedIndex;
    var selectedAq;
    var duration;

    var scale = 10;

    var wrapperElt = new Element('div', {'class': 'timeline_wrapper'});
    var headerElt = new Element('div', {'class': 'timeline_header'});
    var typeElt = new Element('select');
    typeElt.observe('change', onTypeChange);
    Timeline.TYPES.each(function(t) {
        typeElt.insert(new Element('option', {'value': t[0]}).update(t[1]));
    });
    var type = typeElt.value;
    headerElt.insert(typeElt);
    var closeElt = new Element('span', {'class': 'close_button'});
    closeElt.observe('click', function (e) {
        wrapperElt.remove();
    });
    headerElt.insert(closeElt);
    wrapperElt.insert(headerElt);
    var scrollElt = new Element('div', {'class': 'timeline_track small_scrollbar'});
    wrapperElt.insert(scrollElt);
    var markerElt = new Element('div', {'class': 'marker', 'style': 'height: 40px'});
    scrollElt.update(markerElt);
    var canvas = new Element('canvas', {'height': 40});
    canvas.observe('click', onClick);
    scrollElt.insert(canvas);

    var ctx = canvas.getContext('2d');
    var top = 0.5;
    var bottom = bottom = canvas.height - 0.5;
    var cornerSize = 0;

    var pitchHeight = (bottom - top) / 12;

    var zoomOptions = Viz.zoomify({
        canvas: canvas,
        wrapper: scrollElt,
        scale: scale,
        setScale: setScale,
        zoomable: false,
        //FIXME
        width: 100
    });

    this.toElement = function() {
        return wrapperElt;
    };

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

    function onTypeChange(e) {
        e.stop();
        type = typeElt.value;
        draw();
    }

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

        var fill = true;
        if (type == 'pitches' && aq.source && aq.source.pitches) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(left, top, right - left, bottom - top);
            ctx.save();
            ctx.translate(left, top);
            Viz.drawSegment(ctx, aq.source, right - left, pitchHeight);
            ctx.restore();
            fill = false;
        }

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(right - cornerWidth, top);
        ctx.lineTo(right, top + cornerSize);
        ctx.lineTo(right, bottom);
        ctx.lineTo(left, bottom);
        ctx.lineTo(left, top);
        if (fill) {
            ctx.fill();
        }
        ctx.stroke();
    }

    this.onPlayerProgress = function (progress, index, sourcePosition) {
        select(index);
        var position = progress * duration;
        center(position);
        positionMarker(position);
    };

    function select(index) {
        if (index == selectedIndex) {
            return;
        }
        selectedIndex = index;
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
        scrollElt.scrollLeft = position * scale - scrollElt.getWidth() / 2;
    }

    function positionMarker(position) {
        markerElt.style.left = position * scale + 'px';
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

Timeline.TYPES = [
    ['plain', 'Plain'],
    ['pitches', 'Pitches']];
