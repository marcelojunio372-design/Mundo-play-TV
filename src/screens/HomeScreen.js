import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  FlatList,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: W } = Dimensions.get("window");

const BG_IMAGE = require("../../assets/bg.jpg");
const LOGO_IMAGE = require("../../assets/logo.png");

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
    noCarousel: "No carousel items.",
    loadingAll: "Loading full list...",
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
const EPG_URL_REGEX = /x-tvg-url="([^"]+)"/i;

async function loadEPG(url){
  try{
    const res = await fetch(url)
    const xml = await res.text()

    const map = {}

    const programs = xml.split("<programme")

    programs.forEach(p=>{
      const ch = p.match(/channel="([^"]+)"/)
      const title = p.match(/<title[^>]*>([^<]+)</)

      if(ch && title){
        map[ch[1]] = title[1]
      }
    })

    return map

  }catch(e){
    console.log("EPG error",e)
    return {}
  }
}

async function attachEPG(items, epg){
  return items.map(i=>{
    const id = i.tvgId || i.name
    return {
      ...i,
      epgNow: epg[id] || ""
    }
  })
}
function normalizeUrl(u) {
  let s = String(u || "").trim();
  if (!s) return "";

  if (!s.startsWith("http://") && !s.startsWith("https://")) {
    s = "http://" + s;
  }

  try {
    const url = new URL(s);

    if (!url.hostname) {
  return url.toString().replace(/\/$/, "");
}
  } catch {
    return s.replace(/\/$/, "");
  }
}

async function fetchJson(url) {
  const safeUrl = normalizeUrl(url);

  const response = await fetch(safeUrl, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Falha HTTP ${response.status}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Resposta inválida da API.");
  }
}

async function xtreamAuth(server, username, password) {
  const fixedServer = normalizeUrl(server);

  const url =
    `${fixedServer}/player_api.php?username=${encodeURIComponent(username)}` +
    `&password=${encodeURIComponent(password)}`;

  return await fetchJson(url);
}

async function loadFromXtream(server, username, password, kind) {
  const fixedServer = normalizeUrl(server);

  const action =
    kind === "live"
      ? "get_live_streams"
      : kind === "vod"
      ? "get_vod_streams"
      : "get_series";

  const url =
    `${fixedServer}/player_api.php?username=${encodeURIComponent(username)}` +
    `&password=${encodeURIComponent(password)}&action=${action}`;

  const data = await fetchJson(url);
  const safe = Array.isArray(data) ? data : [];

  return safe.map((x, idx) => {
    let streamUrl = "";

    if (kind === "live" && x.stream_id) {
      streamUrl = `${fixedServer}/live/${username}/${password}/${x.stream_id}.m3u8`;
    } else if (kind === "vod" && x.stream_id) {
      streamUrl = `${fixedServer}/movie/${username}/${password}/${x.stream_id}.${x.container_extension || "mp4"}`;
    } else if (kind === "series") {
      streamUrl = "";
    }

    return {
      id: String(x.stream_id || x.series_id || idx),
      name: x.name || x.title || `Item ${idx + 1}`,
      logo: x.stream_icon || x.cover || x.cover_big || "",
      url: x.stream_url || x.url || x.stream_source || streamUrl,
      description: x.plot || x.description || x.story_plot || x.overview || "",
      group:
        x.category_name ||
        x.group_name ||
        (kind === "live" ? "Live TV" : kind === "vod" ? "Filmes" : "Séries"),
      type: kind,
      raw: x,
    };
  });
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
const [favoriteItems, setFavoriteItems] = useState([]);

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
  }, [movieItems, seriesItems, liveItems]);

  useEffect(() => {
    loadLanguage();
    reload();
loadFavorites();

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

      const server = normalizeUrl(await AsyncStorage.getItem("xtream_server"));
      const user = await AsyncStorage.getItem("xtream_user");
      const pass = await AsyncStorage.getItem("xtream_pass");

      if (!server || !user || !pass) {
        throw new Error("Login Xtream não encontrado. Entre novamente.");
      }

      const auth = await xtreamAuth(server, user, pass);

      if (!auth?.user_info?.auth) {
        throw new Error("Login Xtream inválido.");
      }

      const live = await loadFromXtream(server, user, pass, "live");

setLiveItems(live.slice(0, 300));
setMovieItems([]);
setSeriesItems([]);

setStatusText(
  `${t.live} ${live.length} • ${t.movies} sob demanda • ${t.series} sob demanda`
);

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

  async function openBrowse(title, items, type) {
  try {
    setLoading(true);
    setStatusText(t.loadingAll);

    let finalItems = items;

    if (!items || !items.length) {
      const server = normalizeUrl(await AsyncStorage.getItem("xtream_server"));
      const user = await AsyncStorage.getItem("xtream_user");
      const pass = await AsyncStorage.getItem("xtream_pass");

      if (!server || !user || !pass) {
        throw new Error("Login Xtream não encontrado.");
      }

      if (type === "live") {
        finalItems = await loadFromXtream(server, user, pass, "live");
        setLiveItems(finalItems);
      } else if (type === "vod") {
        finalItems = await loadFromXtream(server, user, pass, "vod");
        setMovieItems(finalItems);
      } else if (type === "series") {
        finalItems = await loadFromXtream(server, user, pass, "series");
        setSeriesItems(finalItems);
      }
    }

    navigation.navigate("Browse", {
      title,
      items: finalItems,
      type,
      liveItems: type === "live" ? finalItems : liveItems,
      movieItems: type === "vod" ? finalItems : movieItems,
      seriesItems: type === "series" ? finalItems : seriesItems,
    });
  } catch (e) {
    Alert.alert("Erro", String(e?.message || e));
  } finally {
    setLoading(false);
  }
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
          <Image source={LOGO_IMAGE} style={styles.carouselLogo} />
        )}
      </View>

      <Text style={styles.carouselName} numberOfLines={1}>
        {item.name}
      </Text>
<Text style={{color:"#bbb",fontSize:11}}>
{item.epgNow || ""}
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
    <ImageBackground source={BG_IMAGE} resizeMode="cover" style={styles.root}>
      <View style={styles.overlay}>
        <View style={styles.topRightClock}>
          <Text style={styles.clockText}>{clock}</Text>
        </View>

        <View style={styles.rowMain}>
          
<View style={[styles.sidebar, { width: sidebarW }]}>
           


 <Image source={LOGO_IMAGE} style={styles.sideLogo} resizeMode="contain" />

<TouchableOpacity onPress={() => openBrowse("Favoritos", favoriteItems, "live")}>


<Text style={styles.sideBtnText}>⭐ Favoritos</Text>


</TouchableOpacity>
            
<TouchableOpacity onPress={() => openBrowse(t.live, liveItems, "live")}>
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.20)",
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
