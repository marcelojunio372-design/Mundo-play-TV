function normalizeUrl(rawUrl) {
  let url = (rawUrl || "").trim();
  url = url.replace(/^['"]+|['"]+$/g, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "http://" + url;
  }
  return url;
}

function getAttr(line, name) {
  const match = line.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match ? match[1] : "";
}

function getYearFromName(name) {
  const match = (name || "").match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

function detectType(item) {
  const group = (item.group || "").toLowerCase();
  const name = (item.name || "").toLowerCase();
  const url = (item.url || "").toLowerCase();

  const looksSeriesByName =
    /s\d{1,2}e\d{1,2}/i.test(name) ||
    /temporada|epis[oó]dio|série|series|serie/.test(group);

  const looksMovieByGroup =
    /filmes|filme|movie|movies|cinema|lançamentos|lancamentos|vod/.test(group);

  const looksLiveByGroup =
    /tv|live|ao vivo|canal|canais|abertos|esportes|not[ií]cias|document[aá]rios|infantis|religiosos|variedades/.test(
      group
    );

  const looksVodByUrl =
    url.includes("/movie/") ||
    url.includes("/movies/") ||
    url.endsWith(".mp4") ||
    url.endsWith(".mkv") ||
    url.endsWith(".avi") ||
    url.endsWith(".mpg") ||
    url.endsWith(".mpeg");

  const looksSeriesByUrl = url.includes("/series/");

  if (looksSeriesByName || looksSeriesByUrl) return "series";
  if (looksMovieByGroup || looksVodByUrl) return "movies";
  if (looksLiveByGroup) return "live";

  // fallback melhor: se não parece VOD, fica em live
  return "live";
}

export async function loadM3U(rawUrl) {
  const url = normalizeUrl(rawUrl);
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Não foi possível carregar a lista M3U");
  }

  const text = await res.text();
  const lines = text.split("\n");

  const channels = [];
  const movies = [];
  const series = [];

  let current = null;
  let count = 0;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF")) {
      const titlePart = line.includes(",")
        ? line.split(",").slice(1).join(",").trim()
        : `Item ${count + 1}`;

      current = {
        id: `m3u_${count++}`,
        name: titlePart,
        title: titlePart,
        group: getAttr(line, "group-title") || "OUTROS",
        logo: getAttr(line, "tvg-logo") || "",
        epgId: getAttr(line, "tvg-id") || "",
        description: getAttr(line, "description") || "",
        year: getYearFromName(titlePart),
        url: "",
      };
      continue;
    }

    if (line.startsWith("http://") || line.startsWith("https://")) {
      if (!current) continue;

      current.url = line;
      const type = detectType(current);

      if (type === "movies") movies.push(current);
      else if (type === "series") series.push(current);
      else channels.push(current);

      current = null;
    }
  }

  return {
    channels,
    movies,
    series,
  };
}
