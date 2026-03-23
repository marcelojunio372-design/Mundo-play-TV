function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeBaseUrl(url = "") {
  return safeText(url).replace(/\/+$/, "");
}

function buildCategoryMap(items = [], idKey = "category_id", nameKey = "category_name") {
  const map = {};

  safeArray(items).forEach((item) => {
    const id = safeText(item?.[idKey]);
    const name = safeText(item?.[nameKey]) || "OUTROS";
    if (id) {
      map[id] = name;
    }
  });

  return map;
}

function buildCategories(items = []) {
  const grouped = {};

  safeArray(items).forEach((item) => {
    const group = safeText(item?.group || "OUTROS").toUpperCase();
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(item);
  });

  return Object.keys(grouped)
    .sort((a, b) => a.localeCompare(b))
    .map((group) => ({
      name: group,
      count: grouped[group].length,
    }));
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok) {
    throw new Error("Falha na API Xtream");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Resposta inválida da API Xtream");
  }
}

export async function loadXtream(baseUrl, username, password) {
  const base = normalizeBaseUrl(baseUrl);
  const user = encodeURIComponent(safeText(username));
  const pass = encodeURIComponent(safeText(password));

  if (!base || !user || !pass) {
    throw new Error("Dados Xtream inválidos");
  }

  const api = `${base}/player_api.php?username=${user}&password=${pass}`;

  const [
    liveCategoriesRaw,
    movieCategoriesRaw,
    seriesCategoriesRaw,
    liveStreamsRaw,
    movieStreamsRaw,
    seriesStreamsRaw,
  ] = await Promise.all([
    fetchJson(`${api}&action=get_live_categories`),
    fetchJson(`${api}&action=get_vod_categories`),
    fetchJson(`${api}&action=get_series_categories`),
    fetchJson(`${api}&action=get_live_streams`),
    fetchJson(`${api}&action=get_vod_streams`),
    fetchJson(`${api}&action=get_series`),
  ]);

  const liveCategoryMap = buildCategoryMap(liveCategoriesRaw);
  const movieCategoryMap = buildCategoryMap(movieCategoriesRaw);
  const seriesCategoryMap = buildCategoryMap(seriesCategoriesRaw);

  const live = safeArray(liveStreamsRaw).map((item, index) => {
    const streamId = safeText(item?.stream_id);
    const name = safeText(item?.name) || `Canal ${index + 1}`;
    const group =
      liveCategoryMap[safeText(item?.category_id)] ||
      safeText(item?.category_name) ||
      "OUTROS";

    return {
      id: `live_${streamId || index}`,
      streamId,
      name,
      group,
      logo: safeText(item?.stream_icon),
      url: `${base}/live/${safeText(username)}/${safeText(password)}/${streamId}.ts`,
      type: "live",
      year: "",
      description: safeText(item?.epg_channel_id || name),
      tvgId: safeText(item?.epg_channel_id),
      tvgName: name,
      aliases: [],
      epgSource: "xtream",
      server: base,
      username: safeText(username),
      password: safeText(password),
    };
  });

  const movies = safeArray(movieStreamsRaw).map((item, index) => {
    const streamId = safeText(item?.stream_id);
    const ext = safeText(item?.container_extension || "mp4");
    const name = safeText(item?.name) || `Filme ${index + 1}`;
    const group =
      movieCategoryMap[safeText(item?.category_id)] ||
      safeText(item?.category_name) ||
      "FILMES";

    return {
      id: `movie_${streamId || index}`,
      name,
      group,
      logo: safeText(item?.stream_icon),
      url: `${base}/movie/${safeText(username)}/${safeText(password)}/${streamId}.${ext}`,
      type: "movie",
      year: safeText(item?.year),
      description: safeText(item?.plot || item?.name),
      tvgId: "",
      tvgName: "",
      aliases: [],
    };
  });

  const series = safeArray(seriesStreamsRaw).map((item, index) => {
    const seriesId = safeText(item?.series_id);
    const name = safeText(item?.name) || `Série ${index + 1}`;
    const group =
      seriesCategoryMap[safeText(item?.category_id)] ||
      safeText(item?.category_name) ||
      "SÉRIES";

    return {
      id: `series_${seriesId || index}`,
      name,
      group,
      logo: safeText(item?.cover || item?.cover_big || item?.stream_icon),
      url: `${api}&action=get_series_info&series_id=${seriesId}`,
      type: "series",
      year: safeText(item?.year),
      description: safeText(item?.plot || item?.name),
      tvgId: "",
      tvgName: "",
      aliases: [],
      seriesId,
      server: base,
      username: safeText(username),
      password: safeText(password),
    };
  });

  return {
    live,
    movies,
    series,
    liveCategories: buildCategories(live),
    movieCategories: buildCategories(movies),
    seriesCategories: buildCategories(series),
    loadedAt: new Date().toISOString(),
  };
}

export default loadXtream;
