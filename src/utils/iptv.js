export function normalizeUrl(url = "") {
  let u = String(url).trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  return u.replace(/\/+$/, "");
}

export async function fetchText(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
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
  } catch (e) {
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

export async function loadM3UPreview(m3uUrl, limit = 100) {
  const text = await fetchText(m3uUrl);
  const parsed = parseM3U(text);
  return parsed.slice(0, limit);
}

export async function loadM3UAll(m3uUrl) {
  const text = await fetchText(m3uUrl);
  return parseM3U(text);
}

export async function loadXtreamContent(
  server,
  username,
  password,
  kind = "live"
) {
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
    raw: x,
  }));
}

export async function loadXtreamPreview(
  server,
  username,
  password,
  kind = "live",
  limit = 100
) {
  const items = await loadXtreamContent(server, username, password, kind);
  return items.slice(0, limit);
}
