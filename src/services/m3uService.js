export async function loadM3U(url) {
  const res = await fetch(url);
  const text = await res.text();

  const lines = text.split("\n");

  const channels = [];
  const movies = [];
  const series = [];

  let current = null;

  for (let line of lines) {
    line = line.trim();

    if (line.startsWith("#EXTINF")) {
      const name = line.split(",")[1] || "Sem nome";

      const groupMatch = line.match(/group-title="([^"]+)"/);
      const group = groupMatch ? groupMatch[1] : "Outros";

      current = {
        name,
        group,
        url: "",
      };
    }

    else if (line.startsWith("http")) {
      if (!current) continue;

      current.url = line;

      if (current.group.toLowerCase().includes("movie")) {
        movies.push(current);
      }
      else if (current.group.toLowerCase().includes("serie")) {
        series.push(current);
      }
      else {
        channels.push(current);
      }

      current = null;
    }
  }

  return {
    channels,
    movies,
    series,
  };
}
