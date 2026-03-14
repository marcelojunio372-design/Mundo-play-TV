export function normalizeUrl(url = "") {
  let u = String(url).trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  return u.replace(/\/+$/, "");
}

export async function fetchText(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "*/*" },
  });

  if (!res.ok) {
    throw new Error(`Erro HTTP ${res.status}`);
  }

  return await res.text();
}

export async function fetchJson(url) {
  const text = await fetchText(url);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Resposta inválida do servidor.");
  }
}

export async function xtreamAuth(server, username, password) {
  const fixedServer = normalizeUrl(server);
  const url =
    `${fixedServer}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  const data = await fetchJson(url);

  if (!data || typeof data !== "object") {
    throw new Error("Servidor retornou resposta inválida.");
  }

  const ok =
    data?.user_info &&
    (data.user_info.auth === 1 || data.user_info.auth === "1");

  if (!ok) {
    throw new Error("Login inválido.");
  }

  return data;
}

export function parseM3U(text = "") {
  const lines = text.split(/\r?\n/);
  const items = [];
  let current = null;

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    if (l.startsWith("#EXTINF:")) {
      const tvgName = (l.match(/tvg-name="([^"]*)"/i) || [])[1] || "";
      const groupTitle = (l.match(/group-title="([^"]*)"/i) || [])[1] || "";
      const logo = (l.match(/tvg-logo="([^"]*)"/i) || [])[1] || "";
      const commaIndex = l.lastIndexOf(",");
      const name =
        commaIndex >= 0
          ? l.slice(commaIndex + 1).trim()
          : tvgName || "Sem nome";

      current = {
        id: `${Date.now()}_${items.length}`,
        name,
        logo,
        category: groupTitle || "Geral",
        url: "",
        plot: "",
        epg: "",
        raw: l,
      };
    } else if (!l.startsWith("#") && current) {
      current.url = l;
      items.push(current);
      current = null;
    }
  }

  return items;
}

export async function loadM3UAll(m3uUrl) {
  const text = await fetchText(m3uUrl);
  return parseM3U(text);
}

export async function loadM3UPreview(m3uUrl, limit = 100) {
  const all = await loadM3UAll(m3uUrl);
  return all.slice(0, limit);
}

export async function loadXtreamContent(server, username, password, kind = "live") {
  const fixedServer = normalizeUrl(server);

  const action =
    kind === "live"
      ? "get_live_streams"
      : kind === "vod"
      ? "get_vod_streams"
      : "get_series";

  const url =
    `${fixedServer}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}`;

  const data = await fetchJson(url);
  const safe = Array.isArray(data) ? data : [];

  return safe.map((x, idx) => ({
    id: String(x.stream_id || x.series_id || x.category_id || idx),
    name: x.name || x.title || `Item ${idx + 1}`,
    logo: x.stream_icon || x.cover || x.cover_big || "",
    category: x.category_name || x.genre || "Geral",
    epg: x.epg_channel_id || "",
    plot: x.plot || x.description || x.story_plot || "",
    raw: x,
  }));
}

export async function loadXtreamPreview(server, username, password, kind = "live", limit = 100) {
  const items = await loadXtreamContent(server, username, password, kind);
  return items.slice(0, limit);
}

export async function loadXtreamSeriesInfo(server, username, password, seriesId) {
  const fixedServer = normalizeUrl(server);
  const url =
    `${fixedServer}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_info&series_id=${encodeURIComponent(seriesId)}`;

  const data = await fetchJson(url);
  return data || {};
}

export function mapSeriesEpisodes(seriesInfo = {}) {
  const episodes = seriesInfo?.episodes || {};
  return Object.keys(episodes)
    .sort((a, b) => Number(a) - Number(b))
    .map((seasonKey) => ({
      season: seasonKey,
      items: (episodes[seasonKey] || []).map((ep, idx) => ({
        id: String(ep.id || ep.episode_num || idx),
        name: ep.title || ep.name || `Episódio ${idx + 1}`,
        episodeNum: ep.episode_num || idx + 1,
        containerExtension: ep.container_extension || "mp4",
        raw: ep,
      })),
    }));
}

export function buildSeriesEpisodeUrl(server, username, password, episode = {}) {
  const fixedServer = normalizeUrl(server);
  const episodeId = episode?.raw?.id || episode?.id;
  const ext =
    episode?.containerExtension ||
    episode?.raw?.container_extension ||
    "mp4";

  if (!episodeId) return "";
  return `${fixedServer}/series/${username}/${password}/${episodeId}.${ext}`;
}

export async function loadShortEpg(server, username, password, streamId) {
  const fixedServer = normalizeUrl(server);
  const url =
    `${fixedServer}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_short_epg&stream_id=${encodeURIComponent(streamId)}&limit=5`;

  const data = await fetchJson(url);
  return data?.epg_listings || [];
}

export function buildLiveStreamUrl(server, username, password, item) {
  const raw = item?.raw || {};
  const streamId = raw?.stream_id || item?.id;
  if (!streamId) return item?.url || "";
  return `${normalizeUrl(server)}/live/${username}/${password}/${streamId}.m3u8`;
}

export function buildMovieStreamUrl(server, username, password, item) {
  const raw = item?.raw || {};
  const streamId = raw?.stream_id || item?.id;
  if (!streamId) return item?.url || "";
  return `${normalizeUrl(server)}/movie/${username}/${password}/${streamId}.mp4`;
}

export function formatUnixDate(value) {
  if (!value) return "Não informado";
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "Não informado";
  return new Date(n * 1000).toLocaleDateString("pt-BR");
}

export function getAccountExpiryText(authData) {
  const exp =
    authData?.user_info?.exp_date ||
    authData?.server_info?.exp_date ||
    null;

  return formatUnixDate(exp);
}

export function getAccountStatusText(authData) {
  const status =
    authData?.user_info?.status ||
    authData?.user_info?.auth ||
    "";

  if (status === "Active" || status === "1" || status === 1) return "Ativa";
  if (status === "Banned") return "Banida";
  if (status === "Disabled") return "Desativada";
  if (status === "Expired") return "Expirada";
  return "Não informado";
}

export function getRecentItemsBySection(items = [], section = "live") {
  return items.filter((x) => x?.section === section);
}

function textHasAny(text, words = []) {
  const t = String(text || "").toLowerCase();
  return words.some((w) => t.includes(w));
}

export function detectM3USection(item) {
  const url = (item?.url || "").toLowerCase();
  const category = (item?.category || "").toLowerCase();
  const name = (item?.name || "").toLowerCase();
  const text = `${url} ${category} ${name}`;

  if (text.includes("/series/")) return "series";
  if (text.includes("/movie/")) return "vod";
  if (text.includes("/live/")) return "live";

  if (textHasAny(text, ["serie", "series", "série", "séries", "temporada", "episodio", "episódio"])) {
    return "series";
  }

  if (textHasAny(text, ["filme", "filmes", "movie", "movies", "cinema", "vod"])) {
    return "vod";
  }

  return "live";
}

export function filterM3UBySection(items = [], section = "live") {
  return items.filter((item) => detectM3USection(item) === section);
}
