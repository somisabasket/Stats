import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Plugin que genera archivos con nombres FIJOS (app-bundle.js y app-bundle.css) además de los hashes,
// y sincroniza /dist, /docs y /assets en la raíz para que al subir archivos a GitHub siempre tome los cambios nuevos.
function githubPagesMultiTargetPlugin() {
  return {
    name: 'github-pages-multi-target',
    closeBundle() {
      try {
        const rootDir = path.resolve(import.meta.dirname || '.');
        const distDir = path.join(rootDir, 'dist');
        const docsDir = path.join(rootDir, 'docs');
        const rootAssetsDir = path.join(rootDir, 'assets');
        const distAssetsDir = path.join(distDir, 'assets');
        const buildVersion = Date.now();

        if (fs.existsSync(distAssetsDir)) {
          const files = fs.readdirSync(distAssetsDir);
          const mainJs = files.find(f => /^index-[A-Za-z0-9_-]+\.js$/.test(f)) || files.find(f => f.endsWith('.js') && f.startsWith('index'));
          const mainCss = files.find(f => /^index-[A-Za-z0-9_-]+\.css$/.test(f)) || files.find(f => f.endsWith('.css') && f.startsWith('index'));

          // Crear copias con nombre fijo (app-bundle.js y app-bundle.css) para facilitar reemplazo manual en GitHub
          if (mainJs) {
            fs.copyFileSync(path.join(distAssetsDir, mainJs), path.join(distAssetsDir, 'app-bundle.js'));
          }
          if (mainCss) {
            fs.copyFileSync(path.join(distAssetsDir, mainCss), path.join(distAssetsDir, 'app-bundle.css'));
          }

          if (mainJs) {
            const loaderCode = `// Universal GitHub Pages Fallback Loader (Build ${buildVersion})
(function() {
  if (window.__SOMISA_APP_MOUNTED__) return;
  var isStaticHost = window.location.hostname.indexOf('github.io') !== -1 || window.location.protocol === 'file:';
  function injectBundle() {
    if (window.__SOMISA_APP_MOUNTED__) return;
    var rootEl = document.getElementById('root');
    if (rootEl && rootEl.children.length > 0) return;
    var bust = '?v=${buildVersion}_' + Date.now();
    ${mainCss ? `var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = './assets/${mainCss}' + bust; document.head.appendChild(link);` : ''}
    var script = document.createElement('script');
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    script.src = './assets/${mainJs}' + bust;
    script.onerror = function() {
      var fallbackScript = document.createElement('script');
      fallbackScript.type = 'module';
      fallbackScript.src = './assets/app-bundle.js' + bust;
      document.body.appendChild(fallbackScript);
    };
    document.body.appendChild(script);
  }
  if (isStaticHost) {
    injectBundle();
  } else {
    window.addEventListener('load', function() {
      setTimeout(injectBundle, 1000);
    });
  }
})();
`;
            fs.writeFileSync(path.join(distAssetsDir, 'github-loader.js'), loaderCode, 'utf-8');
          }
        }

        // 1. Limpiar y copiar todo dist/ a docs/ (por si GitHub Pages apunta a main /docs)
        if (fs.existsSync(distDir)) {
          fs.rmSync(docsDir, { recursive: true, force: true });
          fs.cpSync(distDir, docsDir, { recursive: true, force: true });
        }

        // 2. Limpiar y copiar dist/assets a /assets en la raíz (por si GitHub Pages apunta a main /(root))
        if (fs.existsSync(distAssetsDir)) {
          fs.rmSync(rootAssetsDir, { recursive: true, force: true });
          fs.cpSync(distAssetsDir, rootAssetsDir, { recursive: true, force: true });
        }

        // 3. Copiar somisa_crest.jpg, somisa_data.json y .nojekyll a la raíz para que funcionen en main /(root)
        if (fs.existsSync(path.join(rootDir, 'public', 'somisa_crest.jpg'))) {
          fs.copyFileSync(path.join(rootDir, 'public', 'somisa_crest.jpg'), path.join(rootDir, 'somisa_crest.jpg'));
        }
        if (fs.existsSync(path.join(rootDir, 'public', 'somisa_data.json'))) {
          fs.copyFileSync(path.join(rootDir, 'public', 'somisa_data.json'), path.join(rootDir, 'somisa_data.json'));
        }
        fs.writeFileSync(path.join(rootDir, '.nojekyll'), '', 'utf-8');
      } catch (err) {
        console.warn('Warning copying static assets for GitHub Pages:', err);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), githubPagesMultiTargetPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
