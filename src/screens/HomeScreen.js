import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: W } = Dimensions.get("window");
const LANGUAGE_KEY = "MPT_LANGUAGE";

const LANGS = {
  pt: {
    live: "Live TV",
    movies: "Filmes",
    series: "Séries",
    settings: "Config / Idiomas",
    reload: "RECARREGAR",
    loading: "CARREGANDO...",
    exit: "SAIR",
    carousel: "DESTAQUES",
    noCarousel: "Sem itens no carrossel.",
    loadingAll: "Carregando lista completa...",
  },
  en: {
    live: "Live TV",
    movies: "Movies",
    series: "Series",
    settings: "Settings / Languages",
    reload: "RELOAD",
    loading: "LOADING...",
    exit: "EXIT",
    carousel: "FEATURED",
    noCarousel: "No items in carousel.",
    loadingAll: "Loading full playlist...",
  },
  es: {
    live: "Live TV",
    movies: "Películas",
    series: "Series",
    settings: "Config / Idiomas",
    reload: "RECARGAR",
    loading: "CARGANDO...",
    exit: "SALIR",
    carousel: "DESTACADOS",
    noCarousel: "Sin elementos en el carrusel.",
    loadingAll: "Cargando lista completa...",
  },
};

function normalizeUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return "http://" + s;
}

function isXtreamLikeM3U(url) {
  try {
    const u = new URL(url);
    const username = u.searchParams.get("username") || "";
    const password = u.searchParams.get("password") || "";
    return !!(username && password && u.host);
  } catch {
    return false;
  }
}

function xtreamFromM3U(url) {
  try {
    const u = new URL(url);
    return {
      server: `${u.protocol}//${u.host}`,
      username: u.searchParams.get("username") || "",
      password: u.searchParams.get("password") || "",
    };
  } catch {
    return { server: "", username: "", password: "" };
  }
}

async function fetchJson(url) {
  const safeUrl = normalizeUrl(url);

  const r = await fetch(safeUrl, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "User-Agent": "Mozilla/5.0 MundoPlayTV",
    },
  });

  if (!r.ok) {
    throw new Error(`Falha HTTP ${r.status}`);
  }

  return await r.json();
}

function inferItemType(urlLine, groupTitle, name) {
  const lowerUrl = String(urlLine || "").toLowerCase();
  const lowerGroup = String(groupTitle || "").toLowerCase();
  const lowerName = String(name || "").toLowerCase();

  const movieExts = [
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".m4v",
    ".mpg",
    ".mpeg",
  ];

  const seriesHints = [
    "series",
    "serie",
    "temporada",
    "season",
    "episodio",
    "episode",
  ];

  const movieHints = [
    "filmes",
    "filme",
    "movies",
    "movie",
    "cinema",
    "vod",
  ];

  if (seriesHints.some((x) => lowerGroup.includes(x) || lowerName.includes(x) || lowerUrl.includes(`/${x}/`))) {
    return "series";
  }

  if (
    movieHints.some((x) => lowerGroup.includes(x) || lowerName.includes(x) || lowerUrl.includes(`/${x}/`)) ||
    movieExts.some((ext) => lowerUrl.includes(ext)) ||
    lowerUrl.includes("/movie/") ||
    lowerUrl.includes("/vod/")
  ) {
    return "vod";
  }

  return "live";
}

function parseM3UContent(txt) {
  const lines = String(txt || "").split(/\r?\n/);

  const all = [];
  let currentName = "";
  let currentGroup = "";
  let currentLogo = "";
  let currentTvgId = "";

  for (let i = 0; i < lines.length; i += 1) {
    const line = String(lines[i] || "").trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF")) {
      const groupMatch = /group-title="([^"]+)"/i.exec(line);
      const logoMatch = /tvg-logo="([^"]+)"/i.exec(line);
      const tvgIdMatch = /tvg-id="([^"]+)"/i.exec(line);

      currentGroup = groupMatch?.[1] || "";
      currentLogo = logoMatch?.[1] || "";
      currentTvgId = tvgIdMatch?.[1] || "";

      const comma = line.lastIndexOf(",");
      currentName = comma >= 0 ? line.slice(comma + 1).trim() : "Item";
      continue;
    }

    if (!line.startsWith("#")) {
      const itemType = inferItemType(line, currentGroup, currentName);

      all.push({
        id: String(all.length + 1),
        name: currentName || `Item ${all.length + 1}`,
        logo: currentLogo || "",
        url: line,
        group: currentGroup || "",
        description: "",
        type: itemType,
        tvgId: currentTvgId || "",
      });

      currentName = "";
      currentGroup = "";
      currentLogo = "";
      currentTvgId = "";
    }
  }

  return {
    live: all.filter((x) => x.type === "live"),
    vod: all.filter((x) => x.type === "vod"),
    series: all.filter((x) => x.type === "series"),
  };
}

async function loadAllFromM3U(url) {
  const safeUrl = normalizeUrl(url);

  const r = await fetch(safeUrl, {
    method: "GET",
    headers: {
      Accept: "*/*",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      "User-Agent": "Mozilla/5.0 MundoPlayTV",
    },
  });

  if (!r.ok) {
    throw new Error(`Falha HTTP ${r.status}`);
  }

  const txt = await r.text();
  return parseM3UContent(txt);
}

async function loadFromXtream(server, username, password, kind) {
  const action =
    kind === "live"
      ? "get_live_streams"
      : kind === "vod"
      ? "get_vod_streams"
      : "get_series";

  const url =
    `${server}/player_api.php?username=${encodeURIComponent(username)}` +
    `&password=${encodeURIComponent(password)}&action=${action}`;

  const data = await fetchJson(url);
  const safe = Array.isArray(data) ? data : [];

  return safe.map((x, idx) => ({
    id: String(x.stream_id || x.series_id || idx),
    name: x.name || x.title || `Item ${idx + 1}`,
    logo: x.stream_icon || x.cover || x.cover_big || "",
    url:
      x.stream_url ||
      x.url ||
      x.stream_source ||
      (x.stream_id && kind === "live"
        ? `${server}/live/${username}/${password}/${x.stream_id}.m3u8`
        : x.stream_id && kind === "vod"
        ? `${server}/movie/${username}/${password}/${x.stream_id}.${x.container_extension || "mp4"}`
        : ""),
    description: x.plot || x.description || x.story_plot || x.overview || "",
    group:
      x.category_name ||
      x.group_name ||
      (kind === "live" ? "Live TV" : kind === "vod" ? "Filmes" : "Séries"),
    type: kind,
    raw: x,
  }));
}

function formatClock(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${h}:${mi}`;
}

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [liveItems, setLiveItems] = useState([]);
  const [movieItems, setMovieItems] = useState([]);
  const [seriesItems, setSeriesItems] = useState([]);
  const [statusText, setStatusText] = useState("Clique em RECARREGAR.");
  const [lang, setLang] = useState("pt");
  const [clock, setClock] = useState(formatClock(new Date()));
  const [carouselOffset, setCarouselOffset] = useState(0);

  const t = LANGS[lang] || LANGS.pt;
  const sidebarW = useMemo(() => Math.min(W * 0.21, 128), []);
  const contentW = useMemo(() => W - sidebarW - 18, [sidebarW]);
  const carouselRef = useRef(null);

  const carouselItems = useMemo(() => {
    const mixed = [
      ...movieItems.slice(0, 12),
      ...seriesItems.slice(0, 8),
      ...liveItems.slice(0, 8),
    ];
    return mixed;
  }, [liveItems, movieItems, seriesItems]);

  useEffect(() => {
    loadLanguage();
    reload();

    const timer = setInterval(() => {
      setClock(formatClock(new Date()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!carouselItems.length) return;

    const timer = setInterval(() => {
      setCarouselOffset((prev) => {
        const next = prev + 220;
        const limit = Math.max(0, carouselItems.length * 220 - contentW);
        const finalOffset = next > limit ? 0 : next;

        if (carouselRef.current) {
          carouselRef.current.scrollToOffset({
            offset: finalOffset,
            animated: true,
          });
        }

        return finalOffset;
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [carouselItems, contentW]);

  async function loadLanguage() {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (saved) setLang(saved);
    } catch {}
  }

  async function logout() {
    await AsyncStorage.multiRemove([
      "m3u_url",
      "login_mode",
      "xtream_server",
      "xtream_user",
      "xtream_pass",
    ]);
    navigation.replace("Login");
  }

  async function reload() {
    try {
      setLoading(true);
      setStatusText(t.loadingAll);

      const mode = await AsyncStorage.getItem("login_mode");
      const m3u = normalizeUrl(await AsyncStorage.getItem("m3u_url"));

      let server = await AsyncStorage.getItem("xtream_server");
      let user = await AsyncStorage.getItem("xtream_user");
      let pass = await AsyncStorage.getItem("xtream_pass");

      if ((!server || !user || !pass) && m3u && isXtreamLikeM3U(m3u)) {
        const x = xtreamFromM3U(m3u);
        server = x.server;
        user = x.username;
        pass = x.password;

        await AsyncStorage.multiSet([
          ["login_mode", "xtream"],
          ["xtream_server", server],
          ["xtream_user", user],
          ["xtream_pass", pass],
        ]);
      }

      let live = [];
      let vod = [];
      let series = [];

      if (mode === "xtream" && server && user && pass) {
        live = await loadFromXtream(server, user, pass, "live");
        vod = await loadFromXtream(server, user, pass, "vod");
        series = await loadFromXtream(server, user, pass, "series");
      } else if (m3u) {
        const parsed = await loadAllFromM3U(m3u);
        live = parsed.live;
        vod = parsed.vod;
        series = parsed.series;
      } else {
        throw new Error("Sem URL M3U salva.");
      }

      setLiveItems(live);
      setMovieItems(vod);
      setSeriesItems(series);

      setStatusText(
        `${t.live} ${live.length} • ${t.movies} ${vod.length} • ${t.series} ${series.length}`
      );
    } catch (e) {
      Alert.alert("Erro", String(e?.message || e));
      setStatusText("Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  function openBrowse(title, items, type) {
    navigation.navigate("Browse", {
      title,
      items,
      type,
      liveItems,
      movieItems,
      seriesItems,
    });
  }

  const renderCarouselItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.carouselCard}
      onPress={() => navigation.navigate("Player", { channel: item })}
    >
      <View style={styles.carouselLogoBox}>
        {item.logo ? (
          <Image source={{ uri: item.logo }} style={styles.carouselLogo} />
        ) : (
          <Image
            source={require("../../assets/logo.png")}
            style={styles.carouselLogo}
          />
        )}
      </View>

      <Text style={styles.carouselName} numberOfLines={1}>
        {item.name}
      </Text>

      <Text style={styles.carouselType}>
        {item.type === "live"
          ? t.live
          : item.type === "vod"
          ? t.movies
          : t.series}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <Image
        source={require("../../assets/bg.jpg")}
        style={styles.bg}
        resizeMode="cover"
      />

      <View style={styles.topRightClock}>
        <Text style={styles.clockText}>{clock}</Text>
      </View>

      <View style={styles.rowMain}>
        <View style={[styles.sidebar, { width: sidebarW }]}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.sideLogo}
            resizeMode="contain"
          />

          <TouchableOpacity
            onPress={() => openBrowse(t.live, liveItems, "live")}
            hasTVPreferredFocus
          >
            <Text style={styles.sideBtnText}>{t.live}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openBrowse(t.movies, movieItems, "vod")}>
            <Text style={styles.sideBtnText}>{t.movies}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openBrowse(t.series, seriesItems, "series")}>
            <Text style={styles.sideBtnText}>{t.series}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Text style={styles.sideBtnText}>{t.settings}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={reload}
            style={[styles.sideBtnAction, loading && { opacity: 0.65 }]}
            disabled={loading}
          >
            <Text style={styles.sideBtnActionText}>
              {loading ? t.loading : t.reload}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={logout} style={styles.sideBtnExit}>
            <Text style={styles.sideBtnExitText}>{t.exit}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.header}>{t.carousel}</Text>
          {!!statusText && <Text style={styles.sub}>{statusText}</Text>}

          {carouselItems.length ? (
            <FlatList
              ref={carouselRef}
              data={carouselItems}
              keyExtractor={(item, index) => `${item.id}_${index}`}
              renderItem={renderCarouselItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 4, maxHeight: 145 }}
            />
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{t.noCarousel}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  bg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.95,
  },

  topRightClock: {
    position: "absolute",
    top: 6,
    right: 10,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  clockText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  rowMain: {
    flex: 1,
    flexDirection: "row",
    padding: 6,
  },

  sidebar: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },

  sideLogo: {
    width: "100%",
    height: 70,
    marginBottom: 8,
  },

  sideBtnText: {
    width: "100%",
    textAlign: "center",
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },

  sideBtnAction: {
    width: "100%",
    backgroundColor: "rgba(134,76,255,0.55)",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 6,
  },

  sideBtnActionText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900",
  },

  sideBtnExit: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },

  sideBtnExitText: {
    color: "#000",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "900",
  },

  content: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 18,
    padding: 12,
  },

  header: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
  },

  sub: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },

  emptyBox: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
  },

  emptyText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
  },

  carouselCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 10,
  },

  carouselLogoBox: {
    width: "100%",
    height: 88,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  carouselLogo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  carouselName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },

  carouselType: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    marginTop: 2,
  },
});
