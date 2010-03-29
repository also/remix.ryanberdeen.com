var App = (function () {
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

/// TRACK LIST
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

    onSearchNoResults: function (search) {
        search.resultsElt.update('Sorry, no tracks matched your search.');
    },

    onSearchError: function (search) {
        search.resultsElt.update('Sorry, an error occurred during your search.');
    },

    onRemix: function (aqs) {
        Timeline.draw(aqs);
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

function updateTrackInfo(track) {
    trackInfoElt.update();
    //trackInfoElt.update(track.displayTitle.escapeHTML());
    if (track.analysisLoaded) {
        track.selection = {track: track, start: 0, end: 0};
        trackInfoElt.insert(Viz.createCanvas());
    }
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

return {load: load};
})();
