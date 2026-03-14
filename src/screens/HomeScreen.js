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
  getAccountExpiryText,
  getAccountStatusText,
  loadM3UAll,
  loadXtreamPreview,
  filterM3UBySection,
} from "../utils/iptv";

const { width, height } = Dimensions.get("window");

export default function HomeScreen({ route, navigation }) {
  const params = route?.params || {};
  const loginType = params?.loginType || "xtream";
  const server = params?.server || "";
  const username = params?.username || "";
  const password = params?.password || "";
  const authData = params?.authData || null;
  const m3uUrl = params?.m3uUrl || "";

  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(true);
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
          const vod = await loadXtreamPreview(server, username, password, "vod", 10);
          const series = await loadXtreamPreview(server, username, password, "series", 6);
          setCarouselItems([...vod.slice(0, 7), ...series.slice(0, 3)].slice(0, 10));
          return;
        }

        const all = await loadM3UAll(m3uUrl);
        const movies = filterM3UBySection(all, "vod").slice(0, 8);
        const series = filterM3UBySection(all, "series").slice(0, 4);
        setCarouselItems([...movies, ...series].slice(0, 10));
      } catch {
        setCarouselItems([]);
      }
    }

    loadCarousel();
  }, [loginType, server, username, password, m3uUrl]);

  useEffect(() => {
    if (!carouselItems.length) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1 >= carouselItems.length ? 0 : prev + 1));
    }, 3500);

    return () => clearInterval(timer);
  }, [carouselItems]);

  const activeBanner = useMemo(() => {
    if (!carouselItems.length) return null;
    return carouselItems[activeIndex] || carouselItems[0];
  }, [carouselItems, activeIndex]);

  function openScreen(screenName) {
    navigation.navigate(screenName, { ...params });
  }

  function showSubscription() {
    navigation.navigate("SubscriptionInfo", { ...params });
  }

  function formattedDate() {
    return now.toLocaleDateString("pt-BR");
  }

  function formattedTime() {
    return now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const rightInset = menuOpen ? 0 : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <View style={styles.root}>
        <View style={[styles.drawer, !menuOpen && styles.drawerClosed]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.brand}>MUNDO PLAY TV</Text>
          </View>

          <TouchableOpacity style={styles.drawerItem} onPress={() => openScreen("LiveTV")}>
            <Text style={styles.drawerItemText}>Live TV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => openScreen("Movies")}>
            <Text style={styles.drawerItemText}>Filmes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => openScreen("Series")}>
            <Text style={styles.drawerItemText}>Séries</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem}>
            <Text style={styles.drawerItemText}>Configuração</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem}>
            <Text style={styles.drawerItemText}>Idiomas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItem} onPress={() => navigation.replace("Login")}>
            <Text style={styles.drawerItemText}>Sair</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.drawerItemHighlight} onPress={showSubscription}>
            <Text style={styles.drawerItemHighlightText}>Validade da lista</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.menuToggle} onPress={() => setMenuOpen(!menuOpen)}>
              <Text style={styles.menuToggleText}>{menuOpen ? "✕" : "☰"}</Text>
            </TouchableOpacity>

            <View style={[styles.dateArea, { marginRight: rightInset }]}>
              <Text style={styles.dateText}>{formattedTime()}</Text>
              <Text style={styles.dateText}>{formattedDate()}</Text>
            </View>
          </View>

          <View style={styles.hero}>
            {activeBanner?.logo ? (
              <Image source={{ uri: activeBanner.logo }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={[styles.heroImage, styles.heroFallback]}>
                <Text style={styles.heroFallbackText}>MUNDO PLAY TV</Text>
              </View>
            )}

            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {activeBanner?.name || "Destaque"}
              </Text>
              <Text style={styles.heroSubtitle} numberOfLines={2}>
                {activeBanner?.plot || activeBanner?.category || "Conteúdo em destaque"}
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

          <View style={styles.dotsRow}>
            {carouselItems.map((_, index) => (
              <View key={index} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.infoRibbon}>
            <Text style={styles.infoRibbonText}>
              Status: {loginType === "xtream" ? getAccountStatusText(authData) : "M3U"}{"  •  "}
              Vencimento: {loginType === "xtream" ? getAccountExpiryText(authData) : "Não disponível"}
              {!!username ? `{"  •  "}Usuário: ${username}` : ""}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const drawerWidth = Math.min(260, width * 0.62);

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
    backgroundColor: "rgba(16, 7, 33, 0.96)",
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  drawerClosed: {
    width: 0,
    padding: 0,
    borderRightWidth: 0,
    overflow: "hidden",
  },
  drawerHeader: {
    marginBottom: 18,
    paddingTop: 8,
  },
  brand: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 20,
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
    marginTop: 2,
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
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#18e7a1",
    alignItems: "center",
    justifyContent: "center",
  },
  menuToggleText: {
    color: "#111",
    fontSize: 28,
    fontWeight: "900",
  },
  dateArea: {
    flex: 1,
    alignItems: "flex-end",
  },
  dateText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  hero: {
    flex: 1,
    minHeight: height * 0.52,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#26103b",
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
    fontSize: 28,
    fontWeight: "900",
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: "#ddd",
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
  },
  heroButtons: {
    flexDirection: "row",
    marginTop: 14,
  },
  heroBtn: {
    backgroundColor: "#18e7a1",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 10,
  },
  heroBtnText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 16,
  },
  heroBtnAlt: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  heroBtnAltText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 10,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#18e7a1",
  },
  infoRibbon: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoRibbonText: {
    color: "#e7e7e7",
    fontWeight: "700",
  },
});
