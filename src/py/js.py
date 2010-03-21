import System
import sys

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
    except SyntaxError as ex:
        window.__pyevalexception = repr(ex)
    except Exception as ex:
        exceptionType, exceptionValue, exceptionTraceback = sys.exc_info()
        filtered_tb = []
        string_seen = False

        while exceptionTraceback:
            frame = exceptionTraceback.tb_frame
            filename = frame.f_code.co_filename
            if not string_seen:
                if filename == '<string>':
                    string_seen = True
                else:
                    exceptionTraceback = exceptionTraceback.tb_next
                    continue
            # TODO use line numbers once debugging info is present
            line = -1#frame.f_lineno
            filtered_tb.append((filename, line, frame.f_code.co_name))
            exceptionTraceback = exceptionTraceback.tb_next
        window.__pyevalexception = repr({'ex': ex, 'traceback': filtered_tb})

window.__pyevalfn = System.EventHandler[System.Windows.Browser.HtmlEventArgs](pyeval)
