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
  loadXtreamPreview,
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
        } else {
          setCarouselItems([]);
        }
      } catch {
        setCarouselItems([]);
      }
    }

    loadCarousel();
  }, [loginType, server, username, password]);

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
    navigation.navigate(screenName, {
      ...params,
    });
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.sidebar}>
          <Text style={styles.logo}>MUNDO PLAY TV</Text>

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
            onPress={() =>
              Alert.alert("Configurações", "Player, cache, conta e atualização.")
            }
          >
            <Text style={styles.menuButtonText}>Configuração</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() =>
              Alert.alert("Idiomas", "Português / English / Español")
            }
          >
            <Text style={styles.menuButtonText}>Idiomas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.replace("Login")}
          >
            <Text style={styles.menuButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.main}>
          <View style={styles.topRight}>
            <Text style={styles.topInfo}>{formattedDate()}</Text>
            <Text style={styles.topInfo}>{formattedTime()}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>Informações da lista</Text>
              <Text style={styles.statusText}>
                Status: {loginType === "xtream" ? getAccountStatusText(authData) : "M3U"}
              </Text>
              <Text style={styles.statusText}>
                Vencimento: {loginType === "xtream" ? getAccountExpiryText(authData) : "Não disponível"}
              </Text>
              {!!username && <Text style={styles.statusText}>Usuário: {username}</Text>}
              {!!server && <Text style={styles.statusText}>Servidor: {server}</Text>}
              {!server && !!m3uUrl && <Text style={styles.statusText}>Lista: M3U carregada</Text>}
            </View>

            <View style={styles.carouselCard}>
              <Text style={styles.sectionTitle}>Carrossel</Text>

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
                      {activeBanner?.plot || activeBanner?.category || "Catálogo em destaque"}
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
                    style={[
                      styles.dot,
                      index === activeIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.welcomeCard}>
              <Text style={styles.sectionTitle}>Bem-vindo</Text>
              <Text style={styles.welcomeText}>
                Escolha uma opção no menu lateral para abrir Live TV, Filmes ou Séries.
              </Text>
            </View>
          </ScrollView>
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
  container: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 220,
    backgroundColor: "#1d0b2f",
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  logo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
  },
  menuButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  menuButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  main: {
    flex: 1,
    padding: 14,
  },
  topRight: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  topInfo: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  content: {
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  statusTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  statusText: {
    color: "#d9d9d9",
    marginBottom: 6,
  },
  carouselCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  bannerWrap: {
    height: 220,
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
  welcomeCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
  },
  welcomeText: {
    color: "#d9d9d9",
    lineHeight: 22,
  },
});
