export async function fetchM3U(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();

    const lines = text.split("\n");

    const channels = [];

    let current = {};

    for (let line of lines) {
      line = line.trim();

      if (line.startsWith("#EXTINF")) {
        const name = line.split(",")[1];

        current = {
          name: name || "Canal",
        };
      }

      if (line.startsWith("http")) {
        current.url = line;
        channels.push(current);
      }
    }

    return channels;
  } catch (err) {
    console.log("Erro M3U:", err);
    return [];
  }
}
