import System

from System import Array

def log(m):
    window.console.Invoke('log', Array[object]([m]))

EXCLUDE_TYPES = set(['module', 'namespace#', 'function', 'classobj'])

def pyeval(s, e):
    try:
        g = {}
        exec window.__pyevalarg in g
        g.pop('__builtins__')
        result = {}
        for k in g.iterkeys():
            v = g[k]
            t = type(v).__name__
            if t not in EXCLUDE_TYPES:
                result[k] = v
        window.__pyevalresult = repr(result)
    except Exception as ex:
        window.__pyevalexception = repr(ex)

window.__pyevalfn = System.EventHandler[System.Windows.Browser.HtmlEventArgs](pyeval)
