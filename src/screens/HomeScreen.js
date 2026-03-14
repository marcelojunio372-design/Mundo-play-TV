import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import {
  getAccountExpiryText,
  getAccountStatusText,
  loadM3UAll,
  loadXtreamPreview,
  filterM3UBySection,
} from "../utils/iptv";

export default function HomeScreen({ route, navigation }) {
  const params = route?.params || {};
  const loginType = params?.loginType || "xtream";
  const server = params?.server || "";
  const username = params?.username || "";
  const password = params?.password || "";
  const authData = params?.authData || null;
  const m3uUrl = params?.m3uUrl || "";

  const [now, setNow] = useState(new Date());
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
          const vodItems = await loadXtreamPreview(
            server,
            username,
            password,
            "vod",
            8
          );
          setCarouselItems(vodItems);
          return;
        }

        const all = await loadM3UAll(m3uUrl);
        const movies = filterM3UBySection(all, "vod").slice(0, 8);
        const series = filterM3UBySection(all, "series").slice(0, 4);
        setCarouselItems([...movies, ...series].slice(0, 8));
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
    }, 3000);

    return () => clearInterval(timer);
  }, [carouselItems]);

  const activeBanner = useMemo(() => {
    if (!carouselItems.length) return null;
    return carouselItems[activeIndex] || carouselItems[0];
  }, [carouselItems, activeIndex]);

  function openScreen(screenName) {
    navigation.navigate(screenName, { ...params });
  }

  function formattedDate() {
    return now.toLocaleDateString("pt-BR");
  }

  function formattedTime() {
    return now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function showValidity() {
    const lines = [];

    if (loginType === "xtream") {
      lines.push(`Status: ${getAccountStatusText(authData)}`);
      lines.push(`Vencimento: ${getAccountExpiryText(authData)}`);
      if (username) lines.push(`Usuário: ${username}`);
      if (server) lines.push(`Servidor: ${server}`);
    } else {
      lines.push("Status: M3U");
      lines.push("Vencimento: Não disponível na lista M3U");
      lines.push("Lista: M3U carregada");
    }

    Alert.alert("Validade da lista", lines.join("\n"));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <Text style={styles.logo}>MUNDO PLAY TV</Text>

        <View style={styles.dateBox}>
          <Text style={styles.dateText}>{formattedDate()}</Text>
          <Text style={styles.dateText}>{formattedTime()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.carouselCard}>
          <Text style={styles.sectionTitle}>Destaques</Text>

          {activeBanner ? (
            <View style={styles.bannerWrap}>
              {activeBanner?.logo ? (
                <Image
                  source={{ uri: activeBanner.logo }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.bannerImage, styles.bannerFallback]}>
                  <Text style={styles.bannerFallbackText}>MUNDO PLAY TV</Text>
                </View>
              )}

              <View style={styles.bannerOverlay}>
                <Text style={styles.bannerTitle} numberOfLines={1}>
                  {activeBanner?.name || "Destaque"}
                </Text>
                <Text style={styles.bannerSubtitle} numberOfLines={2}>
                  {activeBanner?.plot || activeBanner?.category || "Conteúdo em destaque"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.bannerWrap, styles.bannerFallback]}>
              <Text style={styles.bannerFallbackText}>Nenhum banner disponível</Text>
            </View>
          )}

          <View style={styles.dotsRow}>
            {carouselItems.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuButton} onPress={() => openScreen("LiveTV")}>
            <Text style={styles.menuButtonText}>Live TV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => openScreen("Movies")}>
            <Text style={styles.menuButtonText}>Filmes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton} onPress={() => openScreen("Series")}>
            <Text style={styles.menuButtonText}>Séries</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => Alert.alert("Configuração", "Player, cache, conta e atualização.")}
          >
            <Text style={styles.menuButtonText}>Configuração</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => Alert.alert("Idiomas", "Português / English / Español")}
          >
            <Text style={styles.menuButtonText}>Idiomas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.replace("Login")}
          >
            <Text style={styles.menuButtonText}>Sair</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButtonWide} onPress={showValidity}>
            <Text style={styles.menuButtonText}>Validade da lista</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#12031f",
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  logo: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    flex: 1,
    marginRight: 10,
  },
  dateBox: {
    alignItems: "flex-end",
  },
  dateText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  content: {
    paddingBottom: 40,
  },
  carouselCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  bannerWrap: {
    height: 210,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#26103b",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  bannerSubtitle: {
    color: "#ddd",
    marginTop: 4,
  },
  bannerFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  bannerFallbackText: {
    color: "#fff",
    fontWeight: "800",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#18e7a1",
  },
  menuGrid: {
    flexDirection: "column",
  },
  menuButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  menuButtonWide: {
    backgroundColor: "#18e7a1",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  menuButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
});
