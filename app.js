var apiKey = null;
var required = Remix.apiKeyRequired();

if (required) {
    apiKey = prompt('Enter your Echo Nest API key')
}

if (!required || apiKey) {
    Editor.init(apiKey);
}

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
        elt.observe('click', function () {
            if (Editor.selectedTrack) {
                Editor.selectedTrack.elt.removeClassName('selected');
            }
            Editor.selectedTrack = track;
            track.elt.addClassName('selected');
        });
        var titleElt = new Element('span', {'class': 'track_title'});
        elt.insert(titleElt);

        var playElt = new Element('span', {'class': 'button disabled'});
        playElt.update('Play');
        playElt.observe('click', function() { playTrack(track); });
        track.playElt = playElt;
        elt.insert(playElt);

        var analysisStatusWrapperElt = new Element('span', {'class': 'track_analysis_status'});
        analysisStatusWrapperElt.insert('Analysis: ');
        var analysisStatusElt = new Element('span', {'class': 'value'});
        analysisStatusWrapperElt.insert(analysisStatusElt);
        elt.insert(analysisStatusWrapperElt);

        var soundStatusWrapperElt = new Element('span', {'class': 'track_sound_status'});
        soundStatusWrapperElt.insert('Sound: ');
        var soundStatusElt = new Element('span', {'class': 'value'});
        soundStatusWrapperElt.insert(soundStatusElt);
        elt.insert(soundStatusWrapperElt);

        titleElt.update('Track loading...');
        tracksElt.insert(elt);
        track.elt = elt;
        track.titleElt = titleElt;
        track.analysisStatusElt = analysisStatusElt;
        track.soundStatusElt = soundStatusElt;
    },

    onTrackSoundLoading: function (track) {
        if (track.file.name) {
            track.titleElt.update(track.file.name);
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
    },

    onPlayerPaused: function () {
        playButtonElt.update('Play');
    },

    onPlayerPlaying: function () {
        playButtonElt.update('Pause');
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

var searchParamsElt = $('search_params');

$('show_search_button').observe('click', function () {
    $('search_params').toggle();
});

var simplesearchInputElt = $('simplesearch_input');
simplesearchInputElt.observe('search', function (e) {
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
    var doneElt = new Element('span', {'class': 'button done_button'}).update('done');
    // TODO remove search object
    doneElt.observe('click', function () { wrapperElt.remove(); });
    wrapperElt.insert(doneElt);
    var resultsElt = new Element('div', {'class': 'search_results'});
    wrapperElt.insert(resultsElt);
    resultsElt.update('Searching...');

    var search = Remix.search(params);
    search.resultsElt = resultsElt;
    searchParamsElt.insert({after: wrapperElt});
}

function load(result) {
    var track = Remix.load(result.url, result.trackID);
    track.searchResult = result;
    track.titleElt.update(result.title.escapeHTML() + ' by ' + result.artist.escapeHTML());
}
