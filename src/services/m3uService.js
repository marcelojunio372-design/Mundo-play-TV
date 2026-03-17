function safeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function cleanName(name = "") {
  return safeText(name)
    .replace(/\s+/g, " ")
    .replace(/tvg-logo="[^"]*"/gi, "")
    .trim();
}

function extractAttr(line = "", attr = "") {
  const match = line.match(new RegExp(`${attr}="([^"]*)"`, "i"));
  return match ? match[1] : "";
}

function extractGroup(extinf = "") {
  const g1 = extractAttr(extinf, "group-title");
  if (g1) return safeText(g1);

  const parts = extinf.split(",");
  if (parts.length > 1) return safeText(parts[1]);

  return "OUTROS";
}

function extractName(extinf = "") {
  const parts = extinf.split(",");
  if (parts.length > 1) return cleanName(parts.slice(1).join(","));
  return "Sem nome";
}

function extractLogo(extinf = "") {
  return (
    extractAttr(extinf, "tvg-logo") ||
    extractAttr(extinf, "logo") ||
    ""
  );
}

function extractYear(name = "") {
  const match = name.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? match[1] : "";
}

function extractDescription(extinf = "", name = "") {
  const plot =
    extractAttr(extinf, "plot") ||
    extractAttr(extinf, "description") ||
    extractAttr(extinf, "tvg-description");

  if (plot) return safeText(plot);

  // fallback inteligente
  return name;
}

function inferType(name = "", group = "", url = "") {
  const text = `${name} ${group}`.toLowerCase();
  const link = safeText(url).toLowerCase();

  if (/movie|filme|vod/.test(link)) return "movie";
  if (/series|episodio|temporada|s\d{1,2}e\d{1,2}/.test(text)) return "series";

  return "live";
}

export async function loadM3U(url) {
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok || !text) {
    throw new Error("Falha ao carregar lista");
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const live = [];
  const movies = [];
  const series = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.startsWith("#EXTINF")) continue;

    let streamUrl = "";

    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].startsWith("#")) {
        streamUrl = lines[j];
        i = j;
        break;
      }
    }

    if (!streamUrl) continue;

    const name = extractName(line);
    const group = extractGroup(line);
    const logo = extractLogo(line);
    const type = inferType(name, group, streamUrl);
    const year = extractYear(name);
    const description = extractDescription(line, name);

    const item = {
      id: `${type}_${i}_${name}`.replace(/\s+/g, "_"),
      name,
      group,
      logo,
      url: streamUrl,
      type,
      year,
      description,
    };

    if (type === "movie") {
      movies.push(item);
    } else if (type === "series") {
      series.push(item);
    } else {
      live.push(item);
    }
  }

  return {
    live,
    movies,
    series,
  };
}

export default loadM3U;
