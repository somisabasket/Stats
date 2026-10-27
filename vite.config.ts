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
          if (fs.existsSync(distDir)) {
            fs.copyFileSync(path.join(rootDir, 'public', 'somisa_data.json'), path.join(distDir, 'somisa_data.json'));
          }
          if (fs.existsSync(docsDir)) {
            fs.copyFileSync(path.join(rootDir, 'public', 'somisa_data.json'), path.join(docsDir, 'somisa_data.json'));
          }
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

function devSavePlugin() {
  return {
    name: 'dev-save-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/save-shared-data', (req: any, res: any) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (!data || !Array.isArray(data.games) || data.games.length === 0) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Payload must contain games array' }));
                return;
              }

              const rootDir = path.resolve(import.meta.dirname || '.');

              // Combinar con partidos que pudieran ya existir en disco para no perder ninguno
              let finalGames = data.games;
              const diskPath = path.join(rootDir, 'public', 'somisa_data.json');
              if (fs.existsSync(diskPath)) {
                try {
                  const diskData = JSON.parse(fs.readFileSync(diskPath, 'utf-8'));
                  if (Array.isArray(diskData.games) && diskData.games.length > 0) {
                    const existingMap = new Map();
                    // Priorizamos los partidos entrantes (ediciones más recientes)
                    data.games.forEach((g: any) => {
                      if (g && g.id) existingMap.set(g.id, g);
                    });
                    // Agregamos partidos de disco que no estén en el payload
                    diskData.games.forEach((g: any) => {
                      if (g && g.id && !existingMap.has(g.id)) {
                        existingMap.set(g.id, g);
                      }
                    });
                    finalGames = Array.from(existingMap.values()).sort(
                      (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                  }
                } catch {}
              }

              const safePayload = {
                appName: 'Club SOMISA Básquetbol',
                version: '4.0.0',
                exportDate: new Date().toISOString(),
                totalGames: finalGames.length,
                roster: data.roster || [],
                games: finalGames
              };

              const jsonStr = JSON.stringify(safePayload, null, 2);
              const targetFiles = [
                path.join(rootDir, 'public', 'somisa_data.json'),
                path.join(rootDir, 'somisa_data.json'),
                path.join(rootDir, 'docs', 'somisa_data.json'),
              ];
              for (const tf of targetFiles) {
                try {
                  fs.mkdirSync(path.dirname(tf), { recursive: true });
                  fs.writeFileSync(tf, jsonStr, 'utf-8');
                } catch {}
              }

              // También actualizar src/utils/bundledGamesData.ts para sincronizar el código compilado de GitHub
              const bundledPath = path.join(rootDir, 'src', 'utils', 'bundledGamesData.ts');
              const tsCode = `import { Game, PlayerProfile } from "../types/basketball";\n\nexport const BUNDLED_SOMISA_DATA: {\n  appName?: string;\n  version?: string;\n  exportDate?: string;\n  totalGames?: number;\n  roster: PlayerProfile[];\n  games: Game[];\n} = ${jsonStr};\n`;
              try {
                fs.writeFileSync(bundledPath, tsCode, 'utf-8');
              } catch {}

              // Si existe la carpeta dist/, sincronizar dist/somisa_data.json
              const distDir = path.join(rootDir, 'dist');
              if (fs.existsSync(distDir)) {
                try {
                  fs.writeFileSync(path.join(distDir, 'somisa_data.json'), jsonStr, 'utf-8');
                  if (fs.existsSync(path.join(distDir, 'public'))) {
                    fs.writeFileSync(path.join(distDir, 'public', 'somisa_data.json'), jsonStr, 'utf-8');
                  }
                } catch {}
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: finalGames.length }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), githubPagesMultiTargetPlugin(), devSavePlugin()],
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
