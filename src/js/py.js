function pyeval(string) {
    window.__pyevalresult = null;
    window.__pyevalexception = null;
    window.__pyevalarg = string;
    window.__pyevalfn(null, null);
    if (window.__pyevalexception) {
        throw window.__pyevalexception;
    }
    return window.__pyevalresult;
}
