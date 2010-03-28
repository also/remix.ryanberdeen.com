(function () {
Remix.onSearchResults = function (search) {
    var ulElt = new Element('ul');
    search.resultsElt.update(ulElt);
    search.results.each(function (result) {
        var liElt = new Element('li').update(result.title.escapeHTML() + ' by ' + result.artist.escapeHTML());
        liElt.observe('click', function (e) {
            App.load(result);
        });
        ulElt.insert(liElt);
    });
};

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
    search({combined: value});
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

var defaultParams = {heather: true};

function search(params) {
    params = extend(extend({}, defaultParams), params);
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
})();
