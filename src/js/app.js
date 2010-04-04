var App = (function () {

var progressElt;
var sourceIndex;
var tracksElt;
var playButtonElt;
var trackInfoElt;

var _snips;
var remixJsElt;

var userCallbacks = {};

function init() {
    // don't steal this, asshole
    Remix.init('TFWCGFDDK8ZSK1PUA');

    _snips = {};

    remixJsElt = document.getElementById('remixJs');

    $('run_button').observe('click', function (e) {run();});
    playButtonElt = $('play_button');
    playButtonElt.observe('click', function (e) {Remix.togglePlayPause();});
    tracksElt = $('tracks');

    $('hide_error_button').observe('click', function (e) { e.stop(); $('error').hide(); });

    progressElt = document.getElementById('progress');
    trackInfoElt = $('track_info');
    App.timeline = new Timeline();
    $('main_timeline').update(App.timeline);
}

extend(Remix, {
    onError: function (error) {
        $('error').show();
        $('error_message').update(error);
    },

/// TRACK LIST
    onTrackAdded: function (track) {
        var elt = new Element('li');
        elt.observe('click', function (e) {
            e.stop();
            selectTrack(track);
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
        });
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

/// PLAYER
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

    onPlayerProgress: function(progress, newSourceIndex, sourcePosition) {
        if (!Remix.playingSingleRange) {
            if (newSourceIndex != sourceIndex) {
                Remix.log(newSourceIndex);
                sourceIndex = newSourceIndex;
            }
            App.playingTimeline.onPlayerProgress(progress, newSourceIndex, sourcePosition);
        }
        progressElt.style.width = 100 * progress + '%';
    }
});

function getScript() {
    var script = remixJsElt.value;
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

function run() {
    var script = getScript();
    if (!script) {
        return;
    }
    var remixCalled = false;
    var play = function () {
        App.timeline.setTitle('Untitled Edit');
        playInMainTimeline.apply(App, arguments);

        remixCalled = true;
    };
    var preview = Remix.play.bind(Remix);
    // TODO use copies
    var tracks = Remix._tracks;
    var track = App.selectedTrack || tracks[0];
    if (!track) {
        Remix.onError('No tracks available.');
        return;
    }
    var selection = track.selection;
    var analysis = track.analysis;
    var snips = _snips;
    var callbacks = userCallbacks;
    try {
        eval(script);
    }
    catch(e) {
        Remix.onError(e);
    }
}

function updateTrack(track) {
    track.titleElt.update(track.displayTitle.escapeHTML());
    if (track == App.selectedTrack) {
        updateTrackInfo(track);
    }
}

function updateTrackInfo(track) {
    trackInfoElt.update();
    //trackInfoElt.update(track.displayTitle.escapeHTML());
    if (track.analysisLoaded) {
        track.selection = {start: 0, end: 0};
        trackInfoElt.insert(Viz.createCanvas());
    }
}

function playTrack(track) {
    if (!track.soundLoaded) {
        return;
    }
    if (track.analysisLoaded) {
        playInMainTimeline(track.analysis.segments);
    }
    else {
        var aq = {start: 0, end: track.sound.length, track: track};
        playInMainTimeline([aq]);
    }
    App.timeline.setTitle(track.displayTitle);
}

function selectTrack(track) {
    if (App.selectedTrack != track) {
        if (App.selectedTrack) {
            App.selectedTrack.elt.removeClassName('selected');
        }
        App.selectedTrack = track;
        track.elt.addClassName('selected');
        updateTrackInfo(track);
    }
}

function selectTrackRange(selection, source) {
    var track = selection.track;
    selectTrack(selection.track);
    track.selection = selection;
    if (track.analysisLoaded) {
        Viz.selectTrackRange(source);
    }
    if (userCallbacks.onSelect) {
        try {
            userCallbacks.onSelect(selection);
        }
        catch (e) {
            Remix.onError(e);
        }
    }
    else {
        Remix.play(selection);
    }
}

function load(result) {
    var track = Remix.load(result.url, result.trackID);
    track.searchResult = result;
    track.displayTitle = result.title + ' by ' + result.artist;
    updateTrack(track);
}

function addTimeline(aqs) {
    var timeline = new Timeline();
    timeline.setTitle('Untitled Edit');
    $('track_info').insert({before: timeline});
    timeline.setMix(Remix.processAqs(aqs));
}

function playTimeline(timeline) {
    App.playingTimeline = timeline;
    Remix.remix(timeline.getAqs());
}

function playInMainTimeline(aqs) {
    App.timeline.setMix(Remix.processAqs(aqs));
    App.playTimeline(App.timeline);
}

function closeTimeline(timeline) {
    if (timeline == App.playingTimeline && !Remix.playingSingleRange) {
        // TODO stop playback
    }
    timeline.close();
}

var JSLINT_OPTIONS = {debug: true, evil: true, laxbreak: true, forin: true, sub: true, css: true, cap: true, on: true, fragment: true};

return {
    init: init,
    load: load,
    selectTrackRange: selectTrackRange,
    playTimeline: playTimeline,
    closeTimeline: closeTimeline
};
})();
