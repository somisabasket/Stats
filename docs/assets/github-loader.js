// Universal GitHub Pages Fallback Loader (when deployed from main branch root)
(function() {
  if (window.__SOMISA_APP_MOUNTED__) return;
  var isStaticHost = window.location.hostname.indexOf('github.io') !== -1 || window.location.protocol === 'file:';
  function injectBundle() {
    if (window.__SOMISA_APP_MOUNTED__) return;
    var rootEl = document.getElementById('root');
    if (rootEl && rootEl.children.length > 0) return;
    var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = './assets/index-BXjc-Oyx.css'; document.head.appendChild(link);
    var script = document.createElement('script');
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    script.src = './assets/index-xmTTJJzL.js';
    document.body.appendChild(script);
  }
  if (isStaticHost) {
    injectBundle();
  } else {
    window.addEventListener('load', function() {
      setTimeout(injectBundle, 1200);
    });
  }
})();
