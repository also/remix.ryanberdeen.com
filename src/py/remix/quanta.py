"""
The main `Echo Nest`_ `Remix API`_ module for manipulating audio files and
their associated `Echo Nest`_ `Analyze API`_ analyses.

AudioData, and getpieces by Robert Ochshorn
on 2008-06-06.  Some refactoring and everything else by Joshua Lifton
2008-09-07.  Refactoring by Ben Lacker 2009-02-11. Other contributions
by Adam Lindsay.

:group Base Classes: AudioAnalysis, AudioRenderable, AudioData
:group Building Blocks: AudioQuantum, AudioSegment, AudioQuantumList

:group Utility functions: chain_from_mixed,

.. _Analyze API: http://developer.echonest.com/pages/overview?version=2
.. _Remix API: http://code.google.com/p/echo-nest-remix/
.. _Echo Nest: http://the.echonest.com/
"""

import selection

class AudioData(object):
    pass

class AudioAnalysis(object):
    pass

class AudioRenderable(object):
    pass


class AudioQuantum(AudioRenderable) :
    """
    A unit of musical time, identified at minimum with a start time and
    a duration, both in seconds. It most often corresponds with a `section`,
    `bar`, `beat`, `tatum`, or (by inheritance) `segment` obtained from an Analyze
    API call.

    Additional properties include:

    end
        computed time offset for convenience: `start` + `duration`
    container
        a circular reference to the containing `AudioQuantumList`,
        created upon creation of the `AudioQuantumList` that covers
        the whole track
    """
    def __init__(self, start=0, duration=0, kind=None, confidence=None, source=None) :
        """
        Initializes an `AudioQuantum`.

        :param start: offset from the start of the track, in seconds
        :param duration: length of the `AudioQuantum`
        :param kind: string containing what kind of rhythm unit it came from
        :param confidence: float between zero and one
        """
        self.start = start
        self.duration = duration
        self.kind = kind
        self.confidence = confidence
        self._source = source

    def get_end(self):
        return self.start + self.duration

    end = property(get_end, doc="""
    A computed property: the sum of `start` and `duration`.
    """)

    def get_source(self):
        "Returns itself or its parent."
        if self._source:
            return self._source
        else:
            source = None
            try:
                source = self.container.source
            except AttributeError:
                source = None
            return source

    def set_source(self, value):
        if isinstance(value, AudioData):
            self._source = value
        else:
            raise TypeError("Source must be an instance of echonest.audio.AudioData")

    source = property(get_source, set_source, doc="""
    The `AudioData` source for the AudioQuantum.
    """)

    def parent(self):
        """
        Returns the containing `AudioQuantum` in the rhythm hierarchy:
        a `tatum` returns a `beat`, a `beat` returns a `bar`, and a `bar` returns a
        `section`.
        """
        pars = {'tatum': 'beats',
                'beat':  'bars',
                'bar':   'sections'}
        try:
            uppers = getattr(self.container.container, pars[self.kind])
            return uppers.that(selection.overlap(self))[0]
        except LookupError:
            # Might not be in pars, might not have anything in parent.
            return None

    def children(self):
        """
        Returns an `AudioQuantumList` of the AudioQuanta that it contains,
        one step down the hierarchy. A `beat` returns `tatums`, a `bar` returns
        `beats`, and a `section` returns `bars`.
        """
        chils = {'beat':    'tatums',
                 'bar':     'beats',
                 'section': 'bars'}
        try:
            downers = getattr(self.container.container, chils[self.kind])
            return downers.that(selection.are_contained_by(self))
        except LookupError:
            return None

    def group(self):
        """
        Returns the `children`\() of the `AudioQuantum`\'s `parent`\().
        In other words: 'siblings'. If no parent is found, then return the
        `AudioQuantumList` for the whole track.
        """
        if self.parent():
            return self.parent().children()
        else:
            return self.container

    def prev(self, step=1):
        """
        Step backwards in the containing `AudioQuantumList`.
        Returns `self` if a boundary is reached.
        """
        group = self.container
        try:
            loc = group.index(self)
            new = max(loc - step, 0)
            return group[new]
        except:
            return self

    def next(self, step=1):
        """
        Step forward in the containing `AudioQuantumList`.
        Returns `self` if a boundary is reached.
        """
        group = self.container
        try:
            loc = group.index(self)
            new = min(loc + step, len(group))
            return group[new]
        except:
            return self

    def __str__(self):
        """
        Lists the `AudioQuantum`.kind with start and
        end times, in seconds, e.g.::

            "segment (20.31 - 20.42)"
        """
        return "%s (%.2f - %.2f)" % (self.kind, self.start, self.end)

    def __repr__(self):
        """
        A string representing a constructor, including kind, start time,
        duration, and (if it exists) confidence, e.g.::

            "AudioQuantum(kind='tatum', start=42.198267, duration=0.1523394)"
        """
        if self.confidence is not None:
            return "AudioQuantum(kind='%s', start=%f, duration=%f, confidence=%f)" % (self.kind, self.start, self.duration, self.confidence)
        else:
            return "AudioQuantum(kind='%s', start=%f, duration=%f)" % (self.kind, self.start, self.duration)

    def local_context(self):
        """
        Returns a tuple of (*index*, *length*) within rhythm siblings, where
        *index* is the (zero-indexed) position within its `group`\(), and
        *length* is the number of siblings within its `group`\().
        """
        group = self.group()
        count = len(group)
        try:
            loc  = group.index(self)
        except: # seem to be some uncontained beats
            loc = 0
        return (loc, count,)

    def absolute_context(self):
        """
        Returns a tuple of (*index*, *length*) within the containing
        `AudioQuantumList`, where *index* is the (zero-indexed) position within
        its container, and *length* is the number of siblings within the
        container.
        """
        group = self.container
        count = len(group)
        loc = group.index(self)
        return (loc, count,)

    def context_string(self):
        """
        Returns a one-indexed, human-readable version of context.
        For example::

            "bar 4 of 142, beat 3 of 4, tatum 2 of 3"
        """
        if self.parent() and self.kind != "bar":
            return "%s, %s %i of %i" % (self.parent().context_string(),
                                  self.kind, self.local_context()[0] + 1,
                                  self.local_context()[1])
        else:
            return "%s %i of %i" % (self.kind, self.absolute_context()[0] + 1,
                                  self.absolute_context()[1])


class AudioSegment(AudioQuantum):
    """
    Subclass of `AudioQuantum` for the data-rich segments returned by
    the Analyze API.
    """
    def __init__(self, start=0., duration=0., pitches=[], timbre=[],
                 loudness_begin=0., loudness_max=0., time_loudness_max=0.,
                 loudness_end=None, kind='segment', source=None):
        """
        Initializes an `AudioSegment`.

        :param start: offset from start of the track, in seconds
        :param duration: duration of the `AudioSegment`, in seconds
        :param pitches: a twelve-element list with relative loudnesses of each
                pitch class, from C (pitches[0]) to B (pitches[11])
        :param timbre: a twelve-element list with the loudness of each of a
                principal component of time and/or frequency profile
        :param kind: string identifying the kind of AudioQuantum: "segment"
        :param loudness_begin: loudness in dB at the start of the segment
        :param loudness_max: loudness in dB at the loudest moment of the
                segment
        :param time_loudness_max: time (in sec from start of segment) of
                loudest moment
        :param loudness_end: loudness at end of segment (if it is given)
        """
        self.start = start
        self.duration = duration
        self.pitches = pitches
        self.timbre = timbre
        self.loudness_begin = loudness_begin
        self.loudness_max = loudness_max
        self.time_loudness_max = time_loudness_max
        if loudness_end:
            self.loudness_end = loudness_end
        self.kind = kind
        self.confidence = None
        self._source = source

class AudioQuantumList(list, AudioRenderable):
    """
    A container that enables content-based selection and filtering.
    A `List` that contains `AudioQuantum` objects, with additional methods
    for manipulating them.

    When an `AudioQuantumList` is created for a track via a call to the
    Analyze API, `attach`\() is called so that its container is set to the
    containing `AudioAnalysis`, and the container of each of the
    `AudioQuantum` list members is set to itself.

    Additional accessors now include AudioQuantum elements such as
    `start`, `duration`, and `confidence`, which each return a List of the
    corresponding properties in the contained AudioQuanta. A special name
    is `kinds`, which returns a List of the `kind` of each `AudioQuantum`.
    If `AudioQuantumList.kind` is "`segment`", then `pitches`, `timbre`,
    `loudness_begin`, `loudness_max`, `time_loudness_max`, and `loudness_end`
    are available.
    """
    def __init__(self, initial = None, kind = None, container = None, source = None):
        """
        Initializes an `AudioQuantumList`. All parameters are optional.

        :param initial: a `List` type with the initial contents
        :param kind: a label for the kind of `AudioQuantum` contained
            within
        :param container: a reference to the containing `AudioAnalysis`
        :param source: a reference to the `AudioData` with the corresponding samples
            and time base for the contained AudioQuanta
        """
        list.__init__(self)
        self.kind = None
        self._source = None
        if isinstance(initial, AudioQuantumList):
            self.kind = initial.kind
            self.container = initial.container
            self._source = initial.source
        if kind:
            self.kind = kind
        if container:
            self.container = container
        if source:
            self._source = source
        if initial:
            self.extend(initial)

    def get_many(attribute):
        def fun(self):
            """
            Returns a list of %s for each `AudioQuantum`.
            """ % attribute
            return [getattr(x, attribute) for x in list.__iter__(self)]
        return fun

    def get_many_if_segment(attribute):
        def fun(self):
            """
            Returns a list of %s for each `Segment`.
            """ % attribute
            if self.kind == 'segment':
                return [getattr(x, attribute) for x in list.__iter__(self)]
            else:
                raise AttributeError("<%s> only accessible for segments" % (attribute,))
        return fun

    def get_duration(self):
        return sum(self.durations)

    def get_source(self):
        "Returns its own or its parent's source."
        if self._source:
            return self._source
        else:
            try:
                source = self.container.source
            except AttributeError:
                source = self[0].source
            return source

    def set_source(self, value):
        "Checks input to see if it is an `AudioData`."
        if isinstance(value, AudioData):
            self._source = value
        else:
            raise TypeError("Source must be an instance of echonest.audio.AudioData")

    durations  = property(get_many('duration'))
    kinds      = property(get_many('kind'))
    start      = property(get_many('start'))
    confidence = property(get_many('confidence'))

    pitches           = property(get_many_if_segment('pitches'))
    timbre            = property(get_many_if_segment('timbre'))
    loudness_begin    = property(get_many_if_segment('loudness_begin'))
    loudness_max      = property(get_many_if_segment('loudness_max'))
    time_loudness_max = property(get_many_if_segment('time_loudness_max'))
    loudness_end      = property(get_many_if_segment('loudness_end'))

    source = property(get_source, set_source, doc="""
    The `AudioData` source for the `AudioQuantumList`.
    """)

    duration = property(get_duration, doc="""
    Total duration of the `AudioQuantumList`.
    """)

    def that(self, filt):
        """
        Method for applying a function to each of the contained
        `AudioQuantum` objects. Returns a new `AudioQuantumList`
        of the same `kind` containing the `AudioQuantum` objects
        for which the input function is true.

        See `echonest.selection` for example selection filters.

        :param filt: a function that takes one `AudioQuantum` and returns
            a `True` value `None`

        :change: experimenting with a filter-only form
        """
        out = AudioQuantumList(kind=self.kind)
        out.extend(filter(filt, self))
        return out

    def ordered_by(self, function, descending=False):
        """
        Returns a new `AudioQuantumList` of the same `kind` with the
        original elements, but ordered from low to high according to
        the input function acting as a key.

        See `echonest.sorting` for example ordering functions.

        :param function: a function that takes one `AudioQuantum` and returns
            a comparison key
        :param descending: when `True`, reverses the sort order, from
            high to low
        """
        out = AudioQuantumList(kind=self.kind)
        out.extend(sorted(self, key=function, reverse=descending))
        return out

    def beget(self, source, which=None):
        """
        There are two basic forms: a map-and-flatten and an converse-that.

        The basic form, with one `function` argument, returns a new
        `AudioQuantumList` so that the source function returns
        `None`, one, or many AudioQuanta for each `AudioQuantum` contained within
        `self`, and flattens them, in order. ::

            beats.beget(the_next_ones)

        A second form has the first argument `source` as an `AudioQuantumList`, and
        a second argument, `which`, is used as a filter for the first argument, for
        *each* of `self`. The results are collapsed and accordianned into a flat
        list.

        For example, calling::

            beats.beget(segments, which=overlap)

        Gets evaluated as::

            for beat in beats:
                return segments.that(overlap(beat))

        And all of the `AudioQuantumList`\s that return are flattened into
        a single `AudioQuantumList`.

        :param source: A function of one argument that is applied to each
            `AudioQuantum` of `self`, or an `AudioQuantumList`, in which case
            the second argument is required.
        :param which: A function of one argument that acts as a `that`\() filter
            on the first argument if it is an `AudioQuantumList`, or as a filter
            on the output, in the case of `source` being a function.
        """
        out = AudioQuantumList()
        if isinstance(source, AudioQuantumList):
            if not which:
                raise TypeError("'beget' requires a second argument, 'which'")
            out.extend(chain_from_mixed([source.that(which(x)) for x in self]))
        else:
            out.extend(chain_from_mixed(map(source, self)))
            if which:
                out = out.that(which)
        return out

    def attach(self, container):
        """
        Create circular references to the containing `AudioAnalysis` and for the
        contained `AudioQuantum` objects.
        """
        self.container = container
        for i in self:
            i.container = self


def _dataParser(tag, nodes):
    out = AudioQuantumList(kind=tag)
    for n in nodes:
        out.append(AudioQuantum(start=n['start'], kind=tag, confidence=n['confidence']))
    if len(out) > 1:
        for i in range(len(out) - 1) :
            out[i].duration = out[i+1].start - out[i].start
        out[-1].duration = out[-2].duration
    return out


def _attributeParser(tag, nodes):
    out = AudioQuantumList(kind=tag)
    for n in nodes :
        out.append(AudioQuantum(n['start'], n['duration'], tag))
    return out


def _segmentsParser(nodes):
    out = AudioQuantumList(kind='segment')
    for n in nodes:
        out.append(AudioSegment(start=n['start'], duration=n['duration'],
                                pitches=n['pitches'], timbre=n['timbre'],
                                loudness_begin=n['loudness_begin'],
                                loudness_max=n['loudness_max'],
                                time_loudness_max=n['time_loudness_max'],
                                loudness_end=n['loudness_end']))
    return out


def chain_from_mixed(iterables):
    """
    Helper function to flatten a list of elements and lists
    into a list of elements.
    """
    for y in iterables:
        try:
            iter(y)
            for element in y:
                yield element
        except:
            yield y