var Timeline = (function () {
    function draw(aqs) {
        var canvas = $('timeline_canvas');
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var duration = 0;
        var i, aq;
        for (i = 0; i < aqs.length; i++) {
            aq = aqs[i];
            duration += aq.end - aq.start;
        }

        ctx.fillStyle = '#cccccc';
        ctx.strokeStyle = '#aaaaaa';
        var scale = canvas.width / duration;
        var pos = 0;
        var top = 0.5;
        var cornerSize = 0;
        var bottom = canvas.height - 0.5;
        for (i = 0; i < aqs.length; i++) {
            aq = aqs[i];
            var width = (aq.end - aq.start) * scale;
            var cornerWidth = Math.min(cornerSize, width - 4);
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
            pos += width;
        }
    }
    
    return {
        draw: draw
    };
})();
