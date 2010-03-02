var Remix = {
  init: function() {
    swfobject.embedSWF('player.swf', 'swf', '400', '120', '9.0.0');
    this._remixJsElt = document.getElementById('remixJs');
    this._progressElt = document.getElementById('progress');
    if (location.hash) {
      Remix._loadScript();
    }
    initCanvas();

    // add selection and sorting functions to global scope
    extend(window, selection);
    extend(window, sorting);
  },

  __init: function() {
    this._swf = document.getElementById('swf');
  },

  __setAnalysis: function(analysis) {
    this.analysis = new AudioAnalysis(analysis);
  },

  __remix: function() {
    var i;
    try {
      eval(this._remixJsElt.value);
    }
    catch(e) {
      alert(e);
      return;
    }
    if (remix == null) {
      alert('remix function not found!');
      return;
    }
    try {
      var sampleRanges = remix(this.analysis);

      if (!sampleRanges) {
        alert('remix must return an array of positions');
        return;
      }

      if (sampleRanges.length == 0) {
        alert('remix must return at least one range');
        return;
      }

      if (sampleRanges[0].start) {  // does this look like an array of AudioQuantums?
        this.sampleRanges = [];
        for (i = 0; i < sampleRanges.length; i++) {
          var aq = sampleRanges[i];
          this.sampleRanges.push(aq.start, aq.end);
        }
      }
      else {
        this.sampleRanges = sampleRanges;
      }

      if (this.sampleRanges.length % 2 != 0) {
        alert('remix must return an even number of positions');
        return;
      }

      remixDuration = 0;
      for (i = 0; i < this.sampleRanges.length - 2; i += 2) {
        var start = this.sampleRanges[i];
        var end = this.sampleRanges[i + 1];
        if (end <= start) {
          alert('end position ' + (i / 2 + 1) + ' is not after start position');
          return;
        }
        remixDuration += end - start;
      }
      draw();
      this._swf.setRemixString(this.sampleRanges.join(','))
    }
    catch (e) {
      alert(e);
    }
  },

  __setProgress: function(progress) {
    this._progressElt.style.width = 100 * progress + '%';
  },

  _scriptLoaded: function() {
    if (remix) {
      this._remixJsElt.value = remix;
    }
    else {
      alert('Remix function not found in script.');
    }
  },

  _loadScript: function() {
    remix = null;
    document.write('<script src="' + location.hash.substring(1) + '" onload="Remix._scriptLoaded();"><' + '/script>');
  }
};
