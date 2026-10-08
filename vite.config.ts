import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Plugin que copia el build compilado a /docs, /dist y /assets con nombres estables y con hash
// para que GitHub Pages funcione sin importar si despliega desde GitHub Actions, gh-pages, main /(root) o main /docs.
function githubPagesMultiTargetPlugin() {
  return {
    name: 'github-pages-multi-target',
    transformIndexHtml(html: string) {
      // Al compilar dist/index.html, quitamos github-loader.js para evitar doble carga en dist/ y docs/
      return html.replace(/<script[^>]*github-loader\.js[^>]*><\/script>\s*/gi, '');
    },
    closeBundle() {
      try {
        const rootDir = path.resolve(import.meta.dirname || '.');
        const distDir = path.join(rootDir, 'dist');
        const docsDir = path.join(rootDir, 'docs');
        const rootAssetsDir = path.join(rootDir, 'assets');
        const distAssetsDir = path.join(distDir, 'assets');

        if (fs.existsSync(distAssetsDir)) {
          const files = fs.readdirSync(distAssetsDir);
          const mainJs = files.find(f => /^index-[A-Za-z0-9_-]+\.js$/.test(f));
          const mainCss = files.find(f => /^index-[A-Za-z0-9_-]+\.css$/.test(f));

          // Crear copias con nombre fijo (app-bundle.js y app-bundle.css) para evitar errores 404 por caché
          if (mainJs) {
            fs.copyFileSync(
              path.join(distAssetsDir, mainJs),
              path.join(distAssetsDir, 'app-bundle.js')
            );
          }
          if (mainCss) {
            fs.copyFileSync(
              path.join(distAssetsDir, mainCss),
              path.join(distAssetsDir, 'app-bundle.css')
            );
          }

          if (mainJs) {
            const loaderCode = `// Universal Static Host & GitHub Pages Loader (when deployed from main branch root)
(function() {
  if (window.__SOMISA_APP_MOUNTED__ || window.__SOMISA_LOADER_STARTED__) return;
  var isDevServer = window.location.port === '3000' || window.location.hostname.indexOf('run.app') !== -1;
  function injectBundle() {
    if (window.__SOMISA_APP_MOUNTED__ || window.__SOMISA_LOADER_STARTED__) return;
    var rootEl = document.getElementById('root');
    if (rootEl && rootEl.children.length > 0) return;
    window.__SOMISA_LOADER_STARTED__ = true;
    ${mainCss ? `var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = './assets/${mainCss}'; document.head.appendChild(link);` : ''}
    var script = document.createElement('script');
    script.type = 'module';
    script.src = './assets/${mainJs}';
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
`;
            fs.writeFileSync(path.join(distAssetsDir, 'github-loader.js'), loaderCode, 'utf-8');
          }

          // Copiar dist/assets a /assets en la raíz
          fs.rmSync(rootAssetsDir, { recursive: true, force: true });
          fs.cpSync(distAssetsDir, rootAssetsDir, { recursive: true, force: true });
        }

        // Asegurar .nojekyll y 404.html en dist/
        if (fs.existsSync(distDir)) {
          fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf-8');
          if (fs.existsSync(path.join(distDir, 'index.html'))) {
            fs.copyFileSync(path.join(distDir, 'index.html'), path.join(distDir, '404.html'));
          }
          // Limpiar y copiar todo dist/ a docs/ (por si GitHub Pages apunta a main /docs)
          fs.rmSync(docsDir, { recursive: true, force: true });
          fs.cpSync(distDir, docsDir, { recursive: true, force: true });
        }

        // Copiar somisa_crest.jpg, somisa_data.json, 404.html y .nojekyll a la raíz para main /(root)
        if (fs.existsSync(path.join(rootDir, 'public', 'somisa_crest.jpg'))) {
          fs.copyFileSync(path.join(rootDir, 'public', 'somisa_crest.jpg'), path.join(rootDir, 'somisa_crest.jpg'));
        }
        if (fs.existsSync(path.join(rootDir, 'public', 'somisa_data.json'))) {
          fs.copyFileSync(path.join(rootDir, 'public', 'somisa_data.json'), path.join(rootDir, 'somisa_data.json'));
        }
        if (fs.existsSync(path.join(distDir, 'index.html'))) {
          fs.copyFileSync(path.join(distDir, 'index.html'), path.join(rootDir, '404.html'));
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
