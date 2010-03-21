import System

#from System import Array
#window.Invoke("test", Array[object]([]))

def pyeval(s, e):
    g = {}
    exec window.__pyevalarg in g
    g.pop('__builtins__')
    window.__pyevalresult = repr(g)

window.__pyevalfn = System.EventHandler[System.Windows.Browser.HtmlEventArgs](pyeval)