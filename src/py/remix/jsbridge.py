import quanta

def browserArrayIterator(a):
    n = int(a.length)
    for i in xrange(n):
        yield a.GetProperty(i)


class TrackList(object):
    def __init__(self, browserTracks, cache={}):
        self.browserTracks = browserTracks
        self._cache = cache.get('tracks')
        if self._cache is None:
            self._cache = {}
            cache['tracks'] = self._cache

    def __len__(self):
        return int(self.browserTracks.length)

    def __getitem__(self, index):
        browserTrack = self.browserTracks.GetProperty(index)
        id = browserTrack.id
        result = self._cache.get(id)
        if result is None:
            result = Track(browserTrack)
            self._cache[id] = result
        return result


class Track(quanta.AudioData):
    def __init__(self, browserTrack):
        self.browserTrack = browserTrack
        self.id = self.browserTrack.id
        self._analysis = None
        self._raw_analysis = None

    @property
    def analysis(self):
        if self._analysis is None:
            self._raw_analysis = self.browserTrack.rawAnalysis
            self._analysis = _buildAnalysis(self._raw_analysis)
            self._analysis.source = self
        return self._analysis


def _buildAnalysis(raw_analysis):
    result = quanta.AudioAnalysis()
    result.bars = _loadBeats('bar', raw_analysis.bars)
    result.bars.attach(result)
    result.beats = _loadBeats('beat', raw_analysis.beats)
    result.beats.attach(result)
    result.tatums = _loadBeats('tatum', raw_analysis.tatums)
    result.tatums.attach(result)
    result.sections = _loadSections(raw_analysis.sections)
    result.sections.attach(result)
    result.segments = _loadSegments(raw_analysis.segments)
    result.segments.attach(result)
    return result


def _loadBeats(tag, browserAnalysis):
    out = quanta.AudioQuantumList(kind=tag)
    for n in browserArrayIterator(browserAnalysis):
        out.append(quanta.AudioQuantum(start=n.value, kind=tag, confidence=n.confidence))
    if len(out) > 1:
        for i in range(len(out) - 1) :
            out[i].duration = out[i+1].start - out[i].start
        out[-1].duration = out[-2].duration
    return out


def _loadSections(nodes):
    tag = 'sections'
    out = quanta.AudioQuantumList(kind=tag)
    for n in browserArrayIterator(nodes):
        out.append(quanta.AudioQuantum(n.start, n.duration, tag))
    return out


def _loadSegments(nodes):
    out = quanta.AudioQuantumList(kind='segment')
    for n in browserArrayIterator(nodes):
        out.append(quanta.AudioSegment(start=n.start, duration=n.duration,
                                pitches=list(browserArrayIterator(n.pitches)),
                                timbre=list(browserArrayIterator(n.timbre)),
                                loudness_begin=n.startLoudness,
                                loudness_max=n.maxLoudmess,
                                time_loudness_max=n.maxLoudmessTimeOffset,
                                loudness_end=n.endLoudness))
    return out


def buildMixSpecString(aqs):
    result = []
    for aq in aqs:
        result.append([aq.container.source.id, aq.start, aq.start + aq.duration])
    return repr(result).replace("'", '"')
