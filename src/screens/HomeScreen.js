import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";

function buildFeatured(session) {
  const movies = (session?.data?.movies || []).filter((item) => item.logo);
  const series = (session?.data?.series || []).filter((item) => item.logo);

  const mixed = [];
  const max = Math.max(movies.length, series.length, 6);

  for (let i = 0; i < max; i++) {
    if (movies[i]) {
      mixed.push({
        id: `movie_${movies[i].id || i}`,
        title: movies[i].name || "Filme",
        subtitle: movies[i].group || "Filmes",
        logo: movies[i].logo || "",
        type: "FILME",
      });
    }
    if (series[i]) {
      mixed.push({
        id: `series_${series[i].id || i}`,
        title: series[i].name || "Série",
        subtitle: series[i].group || "Séries",
        logo: series[i].logo || "",
        type: "SÉRIE",
      });
    }
  }

  return mixed.length
    ? mixed.slice(0, 20)
    : [{ id: "f1", title: "Sem destaques", subtitle: "Lista vazia", logo: "", type: "INFO" }];
}

export default function HomeScreen({
  session,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSettings,
  onLogout,
  onReload,
}) {
  const featuredItems = useMemo(() => buildFeatured(session), [session]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 3500);

    const clock = setInterval(() => setNow(new Date()), 1000);

    return () => {
      clearInterval(timer);
      clearInterval(clock);
    };
  }, [featuredItems.length]);

  const current = featuredItems[currentIndex] || featuredItems[0];
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("pt-BR");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>MUNDO PLAY TV</Text>
          <Text style={styles.sub}>IPTV Profissional</Text>
        </View>
        <Text style={styles.clock}>{time}   {date}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.menuBtn} onPress={onOpenLive}><Text style={styles.menuText}>LIVE TV</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={onOpenMovies}><Text style={styles.menuText}>FILMES</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={onOpenSeries}><Text style={styles.menuText}>SÉRIES</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={onOpenSettings}><Text style={styles.menuText}>CONFIG.</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={onReload}><Text style={styles.menuText}>RECARREGAR</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={onLogout}><Text style={styles.menuText}>SAIR</Text></TouchableOpacity>
        </View>

        <View style={styles.main}>
          <View style={styles.hero}>
            {current?.logo ? (
              <Image source={{ uri: current.logo }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroFallback}><Text style={styles.heroFallbackText}>SEM CAPA</Text></View>
            )}

            <View style={styles.heroInfo}>
              <Text style={styles.heroBadge}>{current?.type || "DESTAQUE"}</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>{current?.title || "Lançamentos"}</Text>
              <Text style={styles.heroSubtitle} numberOfLines={2}>{current?.subtitle || "Filmes e séries da lista"}</Text>
            </View>
          </View>

          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickCard} onPress={onOpenLive}>
              <Text style={styles.quickTitle}>Live TV</Text>
              <Text style={styles.quickSub}>Canais ao vivo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={onOpenMovies}>
              <Text style={styles.quickTitle}>Filmes</Text>
              <Text style={styles.quickSub}>Detalhes e play</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={onOpenSeries}>
              <Text style={styles.quickTitle}>Séries</Text>
              <Text style={styles.quickSub}>Detalhes e play</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={onOpenSettings}>
              <Text style={styles.quickTitle}>Config.</Text>
              <Text style={styles.quickSub}>Idiomas e validade</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111d" },
  header: {
    height: 44,
    backgroundColor: "#0d1b2a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { color: "#fff", fontSize: 10, fontWeight: "900" },
  sub: { color: "#9fb2c7", fontSize: 7, marginTop: 1 },
  clock: { color: "#fff", fontSize: 8, fontWeight: "700" },
  body: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 78,
    backgroundColor: "#081624",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
    padding: 6,
  },
  menuBtn: {
    height: 34,
    borderRadius: 10,
    backgroundColor: "#0d1b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  menuText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  main: { flex: 1, padding: 8 },
  hero: {
    height: 130,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0d1b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    marginBottom: 10,
  },
  heroImage: { width: 95, height: "100%", resizeMode: "cover", backgroundColor: "#243a57" },
  heroFallback: { width: 95, height: "100%", backgroundColor: "#243a57", alignItems: "center", justifyContent: "center" },
  heroFallbackText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  heroInfo: { flex: 1, padding: 10, justifyContent: "center" },
  heroBadge: { color: "#38d7ff", fontSize: 8, fontWeight: "900", marginBottom: 5 },
  heroTitle: { color: "#fff", fontSize: 14, fontWeight: "900", lineHeight: 18 },
  heroSubtitle: { color: "#9fb2c7", fontSize: 8, lineHeight: 12, marginTop: 6 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  quickCard: {
    width: "48.5%",
    backgroundColor: "#0d1b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  quickTitle: { color: "#38d7ff", fontSize: 10, fontWeight: "900" },
  quickSub: { color: "#fff", fontSize: 8, marginTop: 4 },
});
