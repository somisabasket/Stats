import { Game, ExcelRowStats, PlayerProfile } from '../types/basketball';
import { calculateRowMetrics } from './calculations';
import { BUNDLED_SOMISA_DATA as bundledSharedData } from './bundledGamesData';

const STORAGE_KEY = 'somisa_stats_data_v5_all_matches';
const ROSTER_KEY = 'somisa_master_roster_v2';
const DARK_MODE_KEY = 'somisa_dark_mode';
const GITHUB_SYNC_CONFIG_KEY = 'somisa_github_sync_config_v1';

export interface GitHubSyncConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export function loadGitHubSyncConfig(): GitHubSyncConfig {
  try {
    const raw = localStorage.getItem(GITHUB_SYNC_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        owner: parsed.owner || '',
        repo: parsed.repo || '',
        branch: parsed.branch || 'main',
        token: parsed.token || '',
        autoSync: Boolean(parsed.autoSync),
        lastSyncedAt: parsed.lastSyncedAt
      };
    }
  } catch {
    // ignore
  }
  // Auto-detect owner and repo if hosted on *.github.io
  let detectedOwner = '';
  let detectedRepo = '';
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')) {
    detectedOwner = window.location.hostname.replace('.github.io', '');
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      detectedRepo = pathParts[0];
    }
  }
  return {
    owner: detectedOwner,
    repo: detectedRepo,
    branch: 'main',
    token: '',
    autoSync: false
  };
}

export function saveGitHubSyncConfig(config: GitHubSyncConfig): void {
  try {
    localStorage.setItem(GITHUB_SYNC_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save GitHub sync config:', err);
  }
}

/**
 * Fetches shared games & roster from ./somisa_data.json (hosted on GitHub Pages or repo)
 * and merges with local games so any browser opening the GitHub URL gets all published matches.
 */
export async function fetchRemoteSharedData(): Promise<{ games?: Game[]; roster?: PlayerProfile[]; updatedAt?: string } | null> {
  const cfg = loadGitHubSyncConfig();
  const urlsToTry: string[] = [
    `./somisa_data.json?t=${Date.now()}`,
    `./public/somisa_data.json?t=${Date.now()}`
  ];

  // Si estamos en GitHub Pages o tenemos owner/repo configurados, consultar también raw.githubusercontent.com
  // para obtener al instante el último public/somisa_data.json sin esperar el caché de CDN de GitHub Pages
  if (cfg.owner && cfg.repo) {
    const branch = cfg.branch || 'main';
    urlsToTry.unshift(
      `https://raw.githubusercontent.com/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/${encodeURIComponent(branch)}/public/somisa_data.json?t=${Date.now()}`,
      `https://raw.githubusercontent.com/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/${encodeURIComponent(branch)}/somisa_data.json?t=${Date.now()}`
    );
  }

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.games) && data.games.length > 0) {
          return {
            games: data.games as Game[],
            roster: Array.isArray(data.roster) ? (data.roster as PlayerProfile[]) : undefined,
            updatedAt: data.exportDate
          };
        }
      }
    } catch {
      // Try next URL
    }
  }

  // Fallback to bundled somisa_data.json compiled into the JS bundle
  if (bundledSharedData && Array.isArray(bundledSharedData.games) && bundledSharedData.games.length > 0) {
    return {
      games: bundledSharedData.games as unknown as Game[],
      roster: Array.isArray(bundledSharedData.roster) ? (bundledSharedData.roster as unknown as PlayerProfile[]) : undefined,
      updatedAt: bundledSharedData.exportDate
    };
  }

  return null;
}

/**
 * Genera una clave única por partido combinando rival y resultado (o fecha si aún está 0-0)
 * para evitar que un mismo encuentro importado en distintas PCs (con distinto timestamp ID)
 * aparezca 2 veces al sincronizar con GitHub.
 */
function getMatchSignature(g: Game): string {
  const opp = (g.opponentName || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
  const scoreMy = Number(g.scoreMyTeam) || 0;
  const scoreOpp = Number(g.scoreOpponent) || 0;
  if (scoreMy === 0 && scoreOpp === 0) {
    return `${opp}__0-0__${g.date || ''}__${g.id}`;
  }
  return `${opp}__${scoreMy}-${scoreOpp}`;
}

export function deduplicateGamesList(games: Game[]): Game[] {
  const byId = new Map<string, Game>();
  const bySignature = new Map<string, Game>();

  for (const g of games) {
    if (!g || !g.id) continue;
    const sig = getMatchSignature(g);
    if (byId.has(g.id) || bySignature.has(sig)) {
      continue;
    }
    byId.set(g.id, g);
    bySignature.set(sig, g);
  }

  let result = Array.from(byId.values());
  if (result.length > 1 && result.some(g => g.id !== 'game_somisa_gimnasia_2026')) {
    result = result.filter(g => g.id !== 'game_somisa_gimnasia_2026');
  }

  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Merges remote/bundled games and local games by ID and by match signature (Opponent + Score)
 * so every browser on any PC gets all matches without duplicating matches imported on different PCs.
 */
export function mergeGamesList(localGames: Game[], remoteGames: Game[]): Game[] {
  if (!remoteGames || remoteGames.length === 0) return deduplicateGamesList(localGames);
  // Priorizamos remoteGames (oficiales del repositorio) y luego agregamos los locales nuevos que no existan
  return deduplicateGamesList([...remoteGames, ...localGames]);
}

/**
 * Pushes the current games & roster directly to the GitHub repository via GitHub REST API
 * Updating public/somisa_data.json, docs/somisa_data.json and somisa_data.json so all browsers see it immediately.
 */
export async function pushDataToGitHubRepo(
  config: GitHubSyncConfig,
  games: Game[],
  roster: PlayerProfile[]
): Promise<{ ok: boolean; message: string }> {
  const { owner, repo, branch, token } = config;
  if (!owner.trim() || !repo.trim() || !token.trim()) {
    return {
      ok: false,
      message: 'Completa el Usuario de GitHub, Nombre del Repositorio y tu Token (PAT) para sincronizar directamente.'
    };
  }

  const cleanGames = deduplicateGamesList(games);
  const payload = {
    appName: 'Club SOMISA Básquetbol',
    version: '4.0.0',
    exportDate: new Date().toISOString(),
    totalGames: cleanGames.length,
    roster,
    games: cleanGames
  };

  const jsonContent = JSON.stringify(payload, null, 2);
  // Encode UTF-8 string to Base64
  const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));
  const targetPaths = ['public/somisa_data.json', 'somisa_data.json', 'docs/somisa_data.json'];
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token.trim()}`,
    'Content-Type': 'application/json'
  };

  let updatedCount = 0;
  let lastError = '';

  for (const filePath of targetPaths) {
    try {
      const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repo.trim())}/contents/${filePath}`;
      // 1. Check if file already exists to get its SHA
      let sha: string | undefined;
      const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch.trim() || 'main')}`, {
        method: 'GET',
        headers
      });
      if (getRes.ok) {
        const existing = await getRes.json();
        sha = existing.sha;
      }

      // 2. PUT updated file content
      const putBody: Record<string, any> = {
        message: `Actualizar partidos Club SOMISA (${games.length} partidos)`,
        content: base64Content,
        branch: branch.trim() || 'main'
      };
      if (sha) {
        putBody.sha = sha;
      }

      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(putBody)
      });

      if (putRes.ok) {
        updatedCount++;
      } else {
        const errData = await putRes.json().catch(() => ({}));
        lastError = errData.message || `HTTP ${putRes.status}`;
      }
    } catch (err: any) {
      lastError = err?.message || 'Error de red';
    }
  }

  // Also try updating gh-pages branch if it exists so sites deployed from gh-pages update immediately without waiting for Actions
  try {
    const ghPagesUrl = `https://api.github.com/repos/${encodeURIComponent(owner.trim())}/${encodeURIComponent(repo.trim())}/contents/somisa_data.json`;
    const getGh = await fetch(`${ghPagesUrl}?ref=gh-pages`, { method: 'GET', headers });
    if (getGh.ok) {
      const existingGh = await getGh.json();
      await fetch(ghPagesUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Sync partidos Club SOMISA en gh-pages (${games.length} partidos)`,
          content: base64Content,
          branch: 'gh-pages',
          sha: existingGh.sha
        })
      });
    }
  } catch {
    // gh-pages branch might not exist, ignore
  }

  if (updatedCount > 0) {
    return {
      ok: true,
      message: `¡Sincronizado en GitHub con éxito! (${games.length} partidos publicados para todos los navegadores).`
    };
  }

  return {
    ok: false,
    message: `No se pudo subir a GitHub: ${lastError || 'Verifica el nombre del repositorio y permisos del Token (repo / contents:write).'}`
  };
}

export const DEFAULT_SOMISA_ROSTER: PlayerProfile[] = [
  { id: 'som_p1', name: 'PAEZ, FELIPE', number: 1, position: 'Base', isCaptain: false, active: true },
  { id: 'som_p2', name: 'PEDEMONTE, JUAN PABLO', number: 2, position: 'Alero', isCaptain: false, active: true },
  { id: 'som_p3', name: 'ZACCHERINI ROMERO, FABRICIO MATIAS', number: 4, position: 'Escolta', isCaptain: false, active: true },
  { id: 'som_p4', name: 'GONZALEZ ROVEDA, LUCIO', number: 5, position: 'Alero', isCaptain: false, active: true },
  { id: 'som_p5', name: 'DIAZ, JAIME', number: 7, position: 'Escolta', isCaptain: false, active: true },
  { id: 'som_p6', name: 'BUALO, AGUSTIN', number: 8, position: 'Base', isCaptain: false, active: true },
  { id: 'som_p7', name: 'BROVARONE, FAUSTINO', number: 9, position: 'Escolta', isCaptain: false, active: true },
  { id: 'som_p8', name: 'VITANGELI, SANTINO', number: 10, position: 'Base', isCaptain: false, active: true },
  { id: 'som_p9', name: 'RATTERO, RAMIRO', number: 11, position: 'Ala-Pívot', isCaptain: false, active: true },
  { id: 'som_p10', name: 'URANGA, SEBASTIAN', number: 12, position: 'Pívot', isCaptain: true, active: true },
  { id: 'som_p11', name: 'VASSOLO, EMILIANO', number: 13, position: 'Alero', isCaptain: false, active: true },
  { id: 'som_p12', name: 'MASCAZZINI, ALEJO BENJAMIN', number: 20, position: 'Alero', isCaptain: false, active: true },
  { id: 'som_p13', name: 'ANDOLLO, SEBASTIAN', number: 33, position: 'Pívot', isCaptain: false, active: true },
  { id: 'som_p14', name: 'MENA, SEBASTIAN ALEJANDRO', number: 88, position: 'Pívot', isCaptain: false, active: true }
];

export function loadMasterRoster(): PlayerProfile[] {
  const bundledRoster = (bundledSharedData && Array.isArray(bundledSharedData.roster) && bundledSharedData.roster.length > 0)
    ? (bundledSharedData.roster as unknown as PlayerProfile[])
    : DEFAULT_SOMISA_ROSTER;

  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with DEFAULT_SOMISA_ROSTER / bundledRoster so new players (like #13 Vassolo, #88 Mena) are included
        const map = new Map<string, PlayerProfile>();
        DEFAULT_SOMISA_ROSTER.forEach(p => map.set(p.name.trim().toUpperCase(), p));
        bundledRoster.forEach(p => map.set(p.name.trim().toUpperCase(), p));
        parsed.forEach((p: PlayerProfile) => map.set(p.name.trim().toUpperCase(), p));
        return Array.from(map.values()).sort((a, b) => a.number - b.number);
      }
    }
  } catch (err) {
    console.error('Failed to load master roster:', err);
  }
  saveMasterRoster(DEFAULT_SOMISA_ROSTER);
  return DEFAULT_SOMISA_ROSTER;
}

export function saveMasterRoster(roster: PlayerProfile[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  } catch (err) {
    console.error('Failed to save master roster:', err);
  }
}

export function getSampleGameRows(): ExcelRowStats[] {
  const rawData: Partial<ExcelRowStats>[] = [
    { playerNumber: 1, playerName: 'PAEZ, FELIPE', playerPosition: 'Base', min: '00:00', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 0, fpr: 0, ptsTot: 0 },
    { playerNumber: 2, playerName: 'PEDEMONTE, JUAN PABLO', playerPosition: 'Alero', min: '34:20', tc: 4, ti: 4, c3p: 5, i3p: 9, tlc: 2, tli: 2, rd: 3, ro: 0, as: 0, rec: 0, per: 2, tap: 0, fpc: 2, fpr: 2, ptsTot: 21 },
    { playerNumber: 4, playerName: 'ZACCHERINI ROMERO, FABRICIO MATIAS', playerPosition: 'Escolta', min: '06:34', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 1, ro: 1, as: 0, rec: 0, per: 2, tap: 0, fpc: 2, fpr: 0, ptsTot: -2 },
    { playerNumber: 5, playerName: 'GONZALEZ ROVEDA, LUCIO', playerPosition: 'Alero', min: '36:13', tc: 6, ti: 9, c3p: 2, i3p: 4, tlc: 2, tli: 2, rd: 7, ro: 0, as: 5, rec: 3, per: 0, tap: 0, fpc: 3, fpr: 4, ptsTot: 30 },
    { playerNumber: 7, playerName: 'DIAZ, JAIME', playerPosition: 'Escolta', min: '00:00', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 0, fpr: 0, ptsTot: 0 },
    { playerNumber: 8, playerName: 'BUALO, AGUSTIN', playerPosition: 'Base', min: '31:03', tc: 2, ti: 3, c3p: 3, i3p: 10, tlc: 1, tli: 2, rd: 6, ro: 0, as: 3, rec: 0, per: 3, tap: 0, fpc: 1, fpr: 3, ptsTot: 13 },
    { playerNumber: 9, playerName: 'BROVARONE, FAUSTINO', playerPosition: 'Escolta', min: '17:02', tc: 0, ti: 1, c3p: 1, i3p: 4, tlc: 0, tli: 0, rd: 0, ro: 1, as: 3, rec: 1, per: 1, tap: 0, fpc: 1, fpr: 0, ptsTot: 2 },
    { playerNumber: 10, playerName: 'VITANGELI, SANTINO', playerPosition: 'Base', min: '00:00', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 0, fpr: 0, ptsTot: 0 },
    { playerNumber: 11, playerName: 'RATTERO, RAMIRO', playerPosition: 'Ala-Pívot', min: '19:50', tc: 1, ti: 3, c3p: 1, i3p: 3, tlc: 2, tli: 2, rd: 4, ro: 0, as: 1, rec: 0, per: 1, tap: 0, fpc: 5, fpr: 2, ptsTot: 4 },
    { playerNumber: 12, playerName: 'URANGA, SEBASTIAN', playerPosition: 'Pívot', min: '27:40', tc: 0, ti: 1, c3p: 0, i3p: 3, tlc: 2, tli: 2, rd: 3, ro: 1, as: 2, rec: 1, per: 2, tap: 0, fpc: 3, fpr: 4, ptsTot: 4 },
    { playerNumber: 20, playerName: 'MASCAZZINI, ALEJO BENJAMIN', playerPosition: 'Alero', min: '00:07', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 0, fpr: 0, ptsTot: 0 },
    { playerNumber: 33, playerName: 'ANDOLLO, SEBASTIAN', playerPosition: 'Pívot', min: '27:06', tc: 5, ti: 6, c3p: 0, i3p: 0, tlc: 2, tli: 4, rd: 8, ro: 1, as: 3, rec: 2, per: 4, tap: 0, fpc: 2, fpr: 3, ptsTot: 20 }
  ];

  return rawData.map(d => calculateRowMetrics(d));
}

export function getInitialGames(): Game[] {
  if (bundledSharedData && Array.isArray(bundledSharedData.games) && bundledSharedData.games.length > 0) {
    return bundledSharedData.games as unknown as Game[];
  }

  const sampleRows = getSampleGameRows();
  const sampleGame: Game = {
    id: 'game_somisa_gimnasia_2026',
    title: 'SOMISA (San Nicolas) vs GIMNASIA (Pergamino)',
    date: '2026-03-28',
    competition: 'LIGA PCIAL FBB (Masculino 2026) - CABB',
    season: '2026',
    homeAway: 'home',
    myTeamName: 'SOMISA (San Nicolas)',
    opponentName: 'GIMNASIA (Pergamino)',
    scoreMyTeam: 83,
    scoreOpponent: 75,
    notes: 'Partido oficial de Liga Provincial FBB. Gran efectividad en dobles (67%) y triples de Pedemonte.',
    rows: sampleRows,
    opponentStats: {
      pts: 75,
      tc: 19,
      ti: 38,
      c3p: 8,
      i3p: 26,
      tlc: 13,
      tli: 18,
      rd: 26,
      ro: 8,
      as: 14,
      rec: 5,
      per: 13,
      tap: 2,
      fpc: 18
    },
    shots: [
      { id: 's1', gameId: 'game_somisa_gimnasia_2026', playerId: 'som_p2', playerName: 'PEDEMONTE, JUAN PABLO', playerNumber: 2, quarter: 1, x: 25, y: 15, made: true, shotType: '2pt', zone: 'restricted', timestamp: Date.now() - 3600000 },
      { id: 's2', gameId: 'game_somisa_gimnasia_2026', playerId: 'som_p2', playerName: 'PEDEMONTE, JUAN PABLO', playerNumber: 2, quarter: 2, x: 10, y: 40, made: true, shotType: '3pt', zone: 'arc3_left', timestamp: Date.now() - 2600000 },
      { id: 's3', gameId: 'game_somisa_gimnasia_2026', playerId: 'som_p4', playerName: 'GONZALEZ ROVEDA, LUCIO', playerNumber: 5, quarter: 3, x: 26, y: 22, made: true, shotType: '2pt', zone: 'paint', timestamp: Date.now() - 1600000 },
      { id: 's4', gameId: 'game_somisa_gimnasia_2026', playerId: 'som_p12', playerName: 'ANDOLLO, SEBASTIAN', playerNumber: 33, quarter: 4, x: 24, y: 12, made: true, shotType: '2pt', zone: 'restricted', timestamp: Date.now() - 600000 }
    ]
  };

  return [sampleGame];
}

export function loadSavedGames(): Game[] {
  const initialBundled = getInitialGames();
  try {
    const rawCurrent = localStorage.getItem(STORAGE_KEY);
    const rawLegacy = localStorage.getItem('somisa_stats_data_v4');
    let localList: Game[] = [];

    if (rawCurrent) {
      const parsed = JSON.parse(rawCurrent);
      if (Array.isArray(parsed)) localList = [...localList, ...parsed];
    }
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      if (Array.isArray(parsedLegacy)) localList = [...localList, ...parsedLegacy];
    }

    const merged = mergeGamesList(localList, initialBundled);
    saveGames(merged);
    return merged;
  } catch (err) {
    console.error('Failed to load games from localStorage:', err);
  }
  saveGames(initialBundled);
  return initialBundled;
}

export function saveGames(games: Game[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (err) {
    console.error('Failed to save games to localStorage:', err);
  }
}

export function getDarkModePreference(): boolean {
  try {
    const val = localStorage.getItem(DARK_MODE_KEY);
    if (val !== null) {
      return val === 'true';
    }
  } catch {
    // fallback
  }
  return true;
}

export function saveDarkModePreference(isDark: boolean): void {
  try {
    localStorage.setItem(DARK_MODE_KEY, String(isDark));
  } catch {
    // fallback
  }
}
