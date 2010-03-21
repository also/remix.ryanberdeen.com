window.__pyevalresult = null;

function pyeval(string) {
    window.__pyevalarg = string;
    window.__pyevalfn(null, null);
    return window.__pyevalresult;
}
