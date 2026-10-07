import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Plugin que genera archivos con nombres FIJOS (app-bundle.js y app-bundle.css) además de los hashes,
// limpia el cargador fallback del HTML ya compilado (/dist y /docs) para evitar doble ejecución,
// y mantiene /assets en la raíz para que funcione incluso si GitHub Pages sirve main /(root).
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

        // 0. En dist/index.html (que ya tiene el <script type="module" src="./assets/index-xxx.js"> inyectado por Vite),
        // eliminar el bloque inline de github-loader.js para que NUNCA cargue el bundle dos veces en dist/, docs/ o gh-pages.
        const distIndexHtmlPath = path.join(distDir, 'index.html');
        if (fs.existsSync(distIndexHtmlPath)) {
          let htmlContent = fs.readFileSync(distIndexHtmlPath, 'utf-8');
          htmlContent = htmlContent.replace(/<script>\s*\/\/ Cargador directo[\s\S]*?<\/script>/g, '');
          fs.writeFileSync(distIndexHtmlPath, htmlContent, 'utf-8');
        }

        if (fs.existsSync(distAssetsDir)) {
          const files = fs.readdirSync(distAssetsDir);
          const mainJs = files.find(f => /^index-[A-Za-z0-9_-]+\.js$/.test(f)) || files.find(f => f.endsWith('.js') && f.startsWith('index'));
          const mainCss = files.find(f => /^index-[A-Za-z0-9_-]+\.css$/.test(f)) || files.find(f => f.endsWith('.css') && f.startsWith('index'));

          // Crear copias con nombre fijo (app-bundle.js y app-bundle.css)
          if (mainJs) {
            fs.copyFileSync(path.join(distAssetsDir, mainJs), path.join(distAssetsDir, 'app-bundle.js'));
          }
          if (mainCss) {
            fs.copyFileSync(path.join(distAssetsDir, mainCss), path.join(distAssetsDir, 'app-bundle.css'));
          }

          if (mainJs) {
            // IMPORTANTE: No agregar ?v=... a la ruta de un ES Module que usa import('./chunk.js') relativos,
            // y verificar si ya existe el script en el DOM para jamás duplicar la carga de React.
            const loaderCode = `// Universal GitHub Pages Fallback Loader (Build ${buildVersion})
(function() {
  if (window.__SOMISA_APP_MOUNTED__ || window.__SOMISA_LOADING_STARTED__) return;
  var existingScripts = document.querySelectorAll('script[type="module"]');
  for (var i = 0; i < existingScripts.length; i++) {
    var src = existingScripts[i].getAttribute('src') || '';
    if (src.indexOf('assets/index-') !== -1 || src.indexOf('app-bundle.js') !== -1) {
      return; // El HTML ya es la versión compilada de dist/ o docs/
    }
  }
  window.__SOMISA_LOADING_STARTED__ = true;
  ${mainCss ? `var link = document.createElement('link'); link.rel = 'stylesheet'; link.href = './assets/${mainCss}'; document.head.appendChild(link);` : ''}
  var script = document.createElement('script');
  script.type = 'module';
  script.crossOrigin = 'anonymous';
  script.src = './assets/${mainJs}';
  script.onerror = function() {
    var fallbackScript = document.createElement('script');
    fallbackScript.type = 'module';
    fallbackScript.src = './assets/app-bundle.js';
    document.body.appendChild(fallbackScript);
  };
  document.body.appendChild(script);
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

        // 2. Copiar los archivos compilados nuevos a /assets en la raíz SIN borrar los hashes anteriores
        // para que si alguien subió solo algunos archivos a mano, nunca dé error 404 de chunk faltante.
        if (fs.existsSync(distAssetsDir)) {
          fs.mkdirSync(rootAssetsDir, { recursive: true });
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
