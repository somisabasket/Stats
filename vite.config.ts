import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Plugin que copia el build compilado a /docs y genera un cargador universal en /assets/github-loader.js
// para que GitHub Pages funcione incluso si el usuario dejó configurada la rama `main` /(root) o `main` /docs.
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

        // 1. Limpiar y copiar todo dist/ a docs/ (por si GitHub Pages apunta a main /docs)
        if (fs.existsSync(distDir)) {
          fs.rmSync(docsDir, { recursive: true, force: true });
          fs.cpSync(distDir, docsDir, { recursive: true, force: true });
        }

        // 2. Limpiar y copiar dist/assets a /assets en la raíz y crear github-loader.js
        // (por si GitHub Pages apunta directamente a main /(root))
        if (fs.existsSync(distAssetsDir)) {
          fs.rmSync(rootAssetsDir, { recursive: true, force: true });
          fs.cpSync(distAssetsDir, rootAssetsDir, { recursive: true, force: true });
          const files = fs.readdirSync(distAssetsDir);
          const mainJs = files.find(f => /^index-[A-Za-z0-9_-]+\.js$/.test(f));
          const mainCss = files.find(f => /^index-[A-Za-z0-9_-]+\.css$/.test(f));

          if (mainJs) {
            const loaderCode = `// Universal GitHub Pages Fallback Loader (when deployed from main branch root)
(function() {
  if (window.__SOMISA_APP_MOUNTED__) return;
  var isStaticHost = window.location.hostname.indexOf('github.io') !== -1 || window.location.protocol === 'file:';
  function injectBundle() {
    if (window.__SOMISA_APP_MOUNTED__) return;
    var rootEl = document.getElementById('root');
    if (rootEl && rootEl.children.length > 0) return;
    ${mainCss ? `var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = './assets/${mainCss}'; document.head.appendChild(link);` : ''}
    var script = document.createElement('script');
    script.type = 'module';
    script.crossOrigin = 'anonymous';
    script.src = './assets/${mainJs}';
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
`;
            fs.writeFileSync(path.join(rootAssetsDir, 'github-loader.js'), loaderCode, 'utf-8');
            if (fs.existsSync(path.join(docsDir, 'assets'))) {
              fs.writeFileSync(path.join(docsDir, 'assets', 'github-loader.js'), loaderCode, 'utf-8');
            }
          }
        }

        // 3. Copiar somisa_crest.jpg y .nojekyll a la raíz para que funcionen en main /(root)
        if (fs.existsSync(path.join(rootDir, 'public', 'somisa_crest.jpg'))) {
          fs.copyFileSync(path.join(rootDir, 'public', 'somisa_crest.jpg'), path.join(rootDir, 'somisa_crest.jpg'));
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
