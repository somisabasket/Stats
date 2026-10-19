// Universal Static Host & GitHub Pages Loader (when deployed from main branch root)
(function() {
  if (window.__SOMISA_APP_MOUNTED__ || window.__SOMISA_LOADER_STARTED__) return;
  var isDevServer = window.location.port === '3000' || window.location.hostname.indexOf('run.app') !== -1;
  function injectBundle() {
    if (window.__SOMISA_APP_MOUNTED__ || window.__SOMISA_LOADER_STARTED__) return;
    var rootEl = document.getElementById('root');
    if (rootEl && rootEl.children.length > 0) return;
    window.__SOMISA_LOADER_STARTED__ = true;
    var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = './assets/index-DWy4HVe7.css'; document.head.appendChild(link);
    var script = document.createElement('script');
    script.type = 'module';
    script.src = './assets/index-D3ccg-j0.js';
    script.onerror = function() {
      var fallback = document.createElement('script');
      fallback.type = 'module';
      fallback.src = './assets/app-bundle.js';
      document.body.appendChild(fallback);
    };
    document.body.appendChild(script);
  }
  if (!isDevServer) {
    injectBundle();
  } else {
    window.addEventListener('load', function() {
      setTimeout(injectBundle, 1500);
    });
  }
})();
