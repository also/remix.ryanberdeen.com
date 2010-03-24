// don't steal this, asshole
Editor.init('TFWCGFDDK8ZSK1PUA');

$('run_button').observe('click', function (e) {Editor.run();});
var playButtonElt = $('play_button');
playButtonElt.observe('click', function (e) {Remix.togglePlayPause();});
var tracksElt = $('tracks');

$('hide_error_button').observe('click', function (e) { e.stop(); $('error').hide(); });

extend(Remix, {
    onError: function (error) {
        $('error').show();
        $('error_message').update(error);
    },

    onTrackAdded: function (track) {
        var elt = new Element('li');
        elt.observe('click', function (e) {
            e.stop();
            onTrackSelected(track);
        });

        var titleElt = new Element('span', {'class': 'track_title'});
        elt.insert(titleElt);

        var playElt = new Element('span', {'class': 'play_button button disabled'});
        playElt.observe('click', function() { playTrack(track); });
        track.playElt = playElt;
        elt.insert(playElt);

        var removeElt = new Element('span', {'class': 'close_button'});
        removeElt.observe('click', function (e) {
            Remix.removeTrack(track);
            track.elt.remove();
        })
        elt.insert(removeElt);

        var analysisStatusWrapperElt = new Element('span', {'class': 'track_analysis_status'});
        analysisStatusWrapperElt.insert('Analysis: ');
        var analysisStatusElt = new Element('span', {'class': 'value'}).update('checking');
        analysisStatusWrapperElt.insert(analysisStatusElt);
        elt.insert(analysisStatusWrapperElt);

        var soundStatusWrapperElt = new Element('span', {'class': 'track_sound_status'});
        soundStatusWrapperElt.insert('Sound: ');
        var soundStatusElt = new Element('span', {'class': 'value'});
        soundStatusWrapperElt.insert(soundStatusElt);
        elt.insert(soundStatusWrapperElt);

        track.displayTitle = 'Track loading...';
        titleElt.update(track.displayTitle);
        tracksElt.insert(elt);
        track.elt = elt;
        track.titleElt = titleElt;
        track.analysisStatusElt = analysisStatusElt;
        track.soundStatusElt = soundStatusElt;
    },

    onTrackSoundLoading: function (track) {
        if (track.file.name) {
            track.displayTitle = track.file.name;
            updateTrack(track);
        }
        track.soundStatusElt.update('loading');
    },

    onTrackSoundLoaded: function (track) {
        track.soundStatusElt.update('loaded');
        track.playElt.removeClassName('disabled');
    },

    onTrackAnalysisLoading: function (track) {
        track.analysisStatusElt.update('loading');
    },

    onTrackAnalysisLoaded: function (track) {
        track.analysisStatusElt.update('loaded');
        updateTrack(track);
    },

    onPlayerPaused: function () {
        playButtonElt.removeClassName('pause_button');
        playButtonElt.addClassName('play_button');
    },

    onPlayerPlaying: function () {
        playButtonElt.addClassName('pause_button');
        playButtonElt.removeClassName('play_button');
    },

    onPlayerReady: function () {
        playButtonElt.removeClassName('disabled');
    },

    onPlayerEmpty: function () {
        playButtonElt.addClassName('disabled');
    },

    onSearchResults: function (search) {
        var ulElt = new Element('ul');
        search.resultsElt.update(ulElt);
        search.results.each(function (result) {
            var liElt = new Element('li').update(result.title.escapeHTML() + ' by ' + result.artist.escapeHTML());
            liElt.observe('click', function (e) { load(result); });
            ulElt.insert(liElt);
        });
    },

    onSearchNoResults: function (search) {
        search.resultsElt.update('Sorry, no tracks matched your search.');
    },

    onSearchError: function (search) {
        search.resultsElt.update('Sorry, an error occurred during your search.');
    }
});

function onTrackSelected(track) {
    if (Editor.selectedTrack) {
        Editor.selectedTrack.elt.removeClassName('selected');
    }
    Editor.selectedTrack = track;
    track.elt.addClassName('selected');
    updateTrackInfo(track);
}

var trackInfoElt = $('track_info');

function updateTrack(track) {
    track.titleElt.update(track.displayTitle.escapeHTML());
    if (track == Editor.selectedTrack) {
        updateTrackInfo(track);
    }
}

var analysisCanvas;
var selection = {};

function updateTrackInfo(track) {
    trackInfoElt.update();
    //trackInfoElt.update(track.displayTitle.escapeHTML());
    if (track.analysisLoaded) {
        analysisCanvas = new Element('canvas', {width: trackInfoElt.getWidth() * 3, height: '100'});
        analysisCanvas.observe('mousedown', onAnalysisMouseDown);
        drawAnalysis(track);
        trackInfoElt.insert(analysisCanvas);
        selection = {track: track};
    }
}

var pitchColors = ["47, 255, 0", "160, 255, 0", "255, 227, 0", "255, 90, 0", "255, 0, 0", "255, 0, 0", "167, 0, 0", "98, 0, 181", "67, 0, 242", "0, 0, 255", "0, 132, 255", "0, 255, 216"];

function drawAnalysis(track) {
    var canvas = analysisCanvas;
    var ctx = canvas.getContext('2d');
    var scale = canvas.width / track.analysis.duration;
    var segs = track.analysis.segments;
    var offsetTop = 10;
    var height = (canvas.height - offsetTop) / 12;
    for (var i = 0; i < segs.length; i++) {
        var s = segs[i];
        for (var j = 0; j < 12; j++) {
            var p = s.pitches[j];
            ctx.fillStyle = 'rgba(' + pitchColors[j] + ', ' + p + ')';
            ctx.fillRect(s.start * scale, j * height + offsetTop, s.duration * scale, height);
        }
    }
}

function onAnalysisMouseDown(e) {
    e.stop();
    var track = Editor.selectedTrack;
    var scale = analysisCanvas.width / track.analysis.duration;
    var x = e.pointerX() - analysisCanvas.cumulativeOffset().left + analysisCanvas.cumulativeScrollOffset().left;
    selection.start = x / scale;
    $(document).observe('mouseup', onAnalysisMouseUp);
    $(document).observe('mousemove', onAnalysisMouseMove);
}

function onAnalysisMouseUp(e) {
    e.stop();
    var track = Editor.selectedTrack;
    var scale = analysisCanvas.width / track.analysis.duration;
    var x = e.pointerX() - analysisCanvas.cumulativeOffset().left + analysisCanvas.cumulativeScrollOffset().left;
    selection.end = x / scale;
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
    var scale = analysisCanvas.width / track.analysis.duration;
    var x = e.pointerX() - analysisCanvas.cumulativeOffset().left + analysisCanvas.cumulativeScrollOffset().left;
    selection.end = x / scale;
    drawSelection();
}

function drawSelection() {
    var canvas = analysisCanvas;
    var track = Editor.selectedTrack;
    var scale = canvas.width / track.analysis.duration;
    var left = selection.start * scale;
    var right = selection.end * scale;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, 10);
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

function playTrack(track) {
    if (!track.soundLoaded) {
        return;
    }
    if (track.analysisLoaded) {
        Remix.remix(track.analysis.segments);
    }
    else {
        var aq = {start: 0, end: track.sound.length, track: track};
        Remix.remix([aq]);
    }
}

var advancedSearchElt = $('advanced_search_wrapper');

$('show_search_button').observe('click', function () {
    advancedSearchElt.show();
});

$('hide_search_button').observe('click', function (e) { advancedSearchElt.hide(); });

var simplesearchInputElt = $('simplesearch_input');
$('simplesearch').observe('submit', function (e) {
    e.stop();
    var value = simplesearchInputElt.value.strip();
    if (value.empty()) {
        return;
    }
    search({title: value, artist: value});
});

var searchInputsElt = $('search_inputs');

var SEARCH_FIELDS = [
    'title',
    'artist',
    'query',
    'constraint_tempo_min',
    'constraint_tempo_max',
    'constraint_duration_min',
    'constraint_duration_max',
    'constraint_loudness_min',
    'constraint_loudness_max',
    'constraint_mode',
    'constraint_key',
    'constraint_familiarity_min',
    'constraint_familiarity_max',
    'constraint_hotttnesss_min',
    'constraint_hotttnesss_max',
    'constraint_latitude_min',
    'constraint_latitude_max',
    'constraint_longitude_min',
    'constraint_longitude_max'];

function advancedSearch(e) {
    e.stop();
    var params = {};
    SEARCH_FIELDS.each(function (id) {
        var value = $(id).value.strip();
        if (!value.empty()) {
            params[id] = value;
        }
    });
    Remix.log(params);
    search(params);
}

$('search_button').observe('click', advancedSearch);
$('search_inputs').observe('submit', advancedSearch);

function search(params) {
    params.heather = true;
    var wrapperElt = new Element('div', {'class': 'search_results_wrapper'});
    var titleElt = new Element('h2').update('Search Results');
    wrapperElt.insert(titleElt);
    var doneElt = new Element('span', {'class': 'close_button'});
    // TODO remove search object
    doneElt.observe('click', function () { wrapperElt.remove(); });
    wrapperElt.insert(doneElt);
    var resultsElt = new Element('div', {'class': 'search_results'});
    wrapperElt.insert(resultsElt);
    resultsElt.update('Searching...');

    var search = Remix.search(params);
    search.resultsElt = resultsElt;
    advancedSearchElt.insert({after: wrapperElt});
}

function load(result) {
    var track = Remix.load(result.url, result.trackID);
    track.searchResult = result;
    track.displayTitle = result.title + ' by ' + result.artist;
    updateTrack(track);
}

var JSLINT_OPTIONS = {debug: true, evil: true, laxbreak: true, forin: true, sub: true, css: true, cap: true, on: true, fragment: true};

Editor.getRawScript = Editor.getScript;

Editor.getScript = function () {
    var script = Editor.getRawScript();
    if (!JSLINT(script, JSLINT_OPTIONS)) {
        var lint = JSLINT.errors;
        var errorMessage = '';
        for (var i = 0; i < lint.length; i++) {
            var error = lint[i];
            if (error && error.raw && error.raw != 'Missing semicolon.') {
                errorMessage += '<p><strong>At line ' + error.line + ', character ' + error.character + ': ' + error.reason.escapeHTML() + '</strong>' + '<br/><code>' + error.evidence.escapeHTML() + '</code></p>';
            }
        }
        if (errorMessage.length > 0) {
            Remix.onError(errorMessage);
            return null;
        }
    }
    return script;
}
