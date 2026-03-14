 import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import {
  loadM3UAll,
  loadXtreamContent,
  filterM3UBySection,
} from "../utils/iptv";

const { width, height } = Dimensions.get("window");
const drawerWidth = Math.min(270, width * 0.28);

export default function HomeScreen({ route, navigation }) {
  const params = route?.params || {};
  const loginType = params?.loginType || "xtream";
  const server = params?.server || "";
  const username = params?.username || "";
  const password = params?.password || "";
  const m3uUrl = params?.m3uUrl || "";

  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadCarousel() {
      try {
        if (loginType === "xtream") {
          const movies = await loadXtreamContent(server, username, password, "vod");
          const series = await loadXtreamContent(server, username, password, "series");

          const launches = [...movies.slice(0, 8), ...series.slice(0, 8)].slice(0, 12);
          setCarouselItems(launches);
          return;
        }

        const all = await loadM3UAll(m3uUrl);
        const movies = filterM3UBySection(all, "vod").slice(0, 8);
        const series = filterM3UBySection(all, "series").slice(0, 8);
        setCarouselItems([...movies, ...series].slice(0, 12));
      } catch {
        setCarouselItems([]);
      }
    }

    loadCarousel();
  }, [loginType, server, username, password, m3uUrl]);

  useEffect(() => {
    if (!carouselItems.length) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1;
        return next >= carouselItems.length ? 0 : next;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [carouselItems]);

  const activeBanner = useMemo(() => {
    if (!carouselItems.length) return null;
    return carouselItems[activeIndex] || carouselItems[0];
  }, [carouselItems, activeIndex]);

  function formattedDate() {
    return now.toLocaleDateString("pt-BR");
  }

  function formattedTime() {
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function openScreen(screenName) {
    navigation.navigate(screenName, { ...params });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <View style={styles.root}>
        {menuOpen && (
          <View style={styles.drawer}>
            <Text style={styles.brand}>MUNDO PLAY TV</Text>

            <TouchableOpacity style={styles.drawerItem} onPress={() => openScreen("LiveTV")}>
              <Text style={styles.drawerItemText}>Live TV</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.drawerItem} onPress={() => openScreen("Movies")}>
              <Text style={styles.drawerItemText}>Filmes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.drawerItem} onPress={() => openScreen("Series")}>
              <Text style={styles.drawerItemText}>Séries</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate("Settings", { ...params })}>
              <Text style={styles.drawerItemText}>Configuração</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.navigate("Language", { ...params })}>
              <Text style={styles.drawerItemText}>Idiomas</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.replace("Login")}>
              <Text style={styles.drawerItemText}>Sair</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItemHighlight}
              onPress={() => navigation.navigate("SubscriptionInfo", { ...params })}
            >
              <Text style={styles.drawerItemHighlightText}>Validade da lista</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.menuToggle} onPress={() => setMenuOpen(!menuOpen)}>
              <Text style={styles.menuToggleText}>{menuOpen ? "✕" : "☰"}</Text>
            </TouchableOpacity>

            <View style={styles.dateArea}>
              <Text style={styles.dateText}>{formattedTime()}</Text>
              <Text style={styles.dateText}>{formattedDate()}</Text>
            </View>
          </View>

          <View style={styles.hero}>
            {activeBanner?.logo ? (
              <Image source={{ uri: activeBanner.logo }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={[styles.heroImage, styles.heroFallback]}>
                <Text style={styles.heroFallbackText}>LANÇAMENTOS</Text>
              </View>
            )}

            <View style={styles.heroOverlay}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>LANÇAMENTO</Text>
              </View>

              <Text style={styles.heroTitle} numberOfLines={1}>
                {activeBanner?.name || "Conteúdo em destaque"}
              </Text>

              <Text style={styles.heroSubtitle} numberOfLines={2}>
                {activeBanner?.plot || activeBanner?.category || "Filmes e séries em destaque"}
              </Text>

              <View style={styles.heroButtons}>
                <TouchableOpacity style={styles.heroBtn} onPress={() => openScreen("Movies")}>
                  <Text style={styles.heroBtnText}>Filmes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.heroBtnAlt} onPress={() => openScreen("Series")}>
                  <Text style={styles.heroBtnAltText}>Séries</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#12031f",
  },
  root: {
    flex: 1,
    flexDirection: "row",
  },
  drawer: {
    width: drawerWidth,
    backgroundColor: "rgba(16, 7, 33, 0.97)",
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  brand: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 22,
    marginBottom: 20,
  },
  drawerItem: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  drawerItemText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  drawerItemHighlight: {
    backgroundColor: "#18e7a1",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  drawerItemHighlightText: {
    color: "#111",
    fontSize: 18,
    fontWeight: "900",
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  menuToggle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#18e7a1",
    alignItems: "center",
    justifyContent: "center",
  },
  menuToggleText: {
    color: "#111",
    fontSize: 30,
    fontWeight: "900",
  },
  dateArea: {
    flex: 1,
    alignItems: "flex-end",
  },
  dateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  hero: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#26103b",
    minHeight: height * 0.7,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroFallbackText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 30,
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 22,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#18e7a1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 14,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "#ddd",
    fontSize: 18,
    marginTop: 6,
    lineHeight: 24,
  },
  heroButtons: {
    flexDirection: "row",
    marginTop: 18,
  },
  heroBtn: {
    backgroundColor: "#18e7a1",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginRight: 10,
  },
  heroBtnText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 18,
  },
  heroBtnAlt: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  heroBtnAltText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },
});
