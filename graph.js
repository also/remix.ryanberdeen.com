var canvas;
var ctx;

function initCanvas() {
  canvas = document.getElementById('canvas');
  canvas.width = window.innerWidth;
  canvas.addEventListener('click', canvasClickHandler);
  ctx = canvas.getContext('2d');
  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    if (Remix.mixSpec) {
      draw();
    }
  });
}

function canvasClickHandler() {
  if (draw == drawCurves) {
    draw = drawGraph;
  }
  else {
    draw = drawCurves;
  }
  if (Remix.mixSpec) {
    draw();
  }
}

var remixDuration;
function drawCurves() {
  var segments = Remix.mixSpec;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "darker";

  var maxOriginalPosition = 0;

  var scale = canvas.width / Math.max(remixDuration, Remix.analysis.metadata.duration);

  var remixPosition = 0;
  for (var i = 0; i < segments.length; i++) {
    var start = segments[i][0];
    var end = segments[i][1];
    var duration = end - start;
    var top = start + duration / 2;
    var bottom = remixPosition + duration / 2;
    ctx.beginPath();
    ctx.strokeStyle = '#00aeef';
    ctx.lineWidth = duration * scale ;
    ctx.moveTo(top * scale, 0);
    ctx.bezierCurveTo(top * scale, 200, bottom * scale, canvas.height - 200, bottom * scale, canvas.height);
    ctx.stroke();
    remixPosition += duration;
  }
}

function drawGraph() {
  var segments = Remix.mixSpec;
  ctx.fillStyle = '#222222';
  ctx.globalCompositeOperation = "source-over";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  var maxOriginalPosition = 0;

  var xScale = canvas.width / Remix.analysis.metadata.duration;
  var yScale = canvas.height / remixDuration;

  var remixPosition = 0;
  for (var i = 0; i < segments.length; i++) {
    var start = segments[i][0];
    var end = segments[i][1];
    var duration = end - start;
    ctx.beginPath();
    ctx.strokeStyle = '#00aeef';
    ctx.lineWidth = 1;
    ctx.moveTo(start * xScale, canvas.height - (remixPosition * yScale));
    remixPosition += duration;
    ctx.lineTo(end * xScale, canvas.height - (remixPosition * yScale));
    ctx.stroke();
  }
}

var draw = drawCurves;
