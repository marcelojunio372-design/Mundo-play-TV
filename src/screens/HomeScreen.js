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
        title: movies[i].name || movies[i].title || "Filme",
        subtitle: movies[i].group || "Filmes",
        logo: movies[i].logo || "",
        type: "FILME",
      });
    }

    if (series[i]) {
      mixed.push({
        id: `series_${series[i].id || i}`,
        title: series[i].name || series[i].title || "Série",
        subtitle: series[i].group || "Séries",
        logo: series[i].logo || "",
        type: "SÉRIE",
      });
    }
  }

  if (mixed.length === 0) {
    return [
      {
        id: "fallback_1",
        title: "Lançamentos",
        subtitle: "Filmes e séries da lista",
        logo: "",
        type: "DESTAQUE",
      },
    ];
  }

  return mixed.slice(0, 20);
}

export default function HomeScreen({
  session,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSettings,
  onLogout,
}) {
  const featuredItems = useMemo(() => buildFeatured(session), [session]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 3000);

    const clock = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(clock);
    };
  }, [featuredItems.length]);

  const current = featuredItems[currentIndex] || featuredItems[0];
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString("pt-BR");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>MUNDO PLAY TV</Text>
          <Text style={styles.sub}>IPTV Profissional</Text>
        </View>

        <Text style={styles.clock}>
          {time}   {date}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.menuBtn} onPress={onOpenLive}>
            <Text style={styles.menuText}>LIVE TV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuBtn} onPress={onOpenMovies}>
            <Text style={styles.menuText}>FILMES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuBtn} onPress={onOpenSeries}>
            <Text style={styles.menuText}>SÉRIES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuBtn} onPress={onOpenSettings}>
            <Text style={styles.menuText}>CONFIG.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuBtn} onPress={onLogout}>
            <Text style={styles.menuText}>SAIR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.main}>
          <View style={styles.hero}>
            {current?.logo ? (
              <Image source={{ uri: current.logo }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroFallback}>
                <Text style={styles.heroFallbackText}>SEM CAPA</Text>
              </View>
            )}

            <View style={styles.heroInfo}>
              <Text style={styles.heroBadge}>{current?.type || "DESTAQUE"}</Text>

              <Text style={styles.heroTitle} numberOfLines={2}>
                {current?.title || "Lançamentos"}
              </Text>

              <Text style={styles.heroSubtitle} numberOfLines={2}>
                {current?.subtitle || "Filmes e séries da lista"}
              </Text>
            </View>
          </View>

          <View style={styles.quickGrid}>
            <TouchableOpacity style={styles.quickCard} onPress={onOpenLive}>
              <Text style={styles.quickTitle}>Live TV</Text>
              <Text style={styles.quickSub}>Canais da lista</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={onOpenMovies}>
              <Text style={styles.quickTitle}>Filmes</Text>
              <Text style={styles.quickSub}>Capas da lista</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickCard} onPress={onOpenSeries}>
              <Text style={styles.quickTitle}>Séries</Text>
              <Text style={styles.quickSub}>Capas da lista</Text>
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
    height: 48,
    backgroundColor: "#0d1b2a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },

  sub: {
    color: "#9fb2c7",
    fontSize: 8,
    marginTop: 1,
  },

  clock: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
  },

  body: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: 84,
    backgroundColor: "#081624",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
    padding: 6,
  },

  menuBtn: {
    height: 38,
    borderRadius: 10,
    backgroundColor: "#0d1b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },

  menuText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  main: {
    flex: 1,
    padding: 8,
  },

  hero: {
    height: 170,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0d1b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    marginBottom: 10,
  },

  heroImage: {
    width: 115,
    height: "100%",
    resizeMode: "cover",
    backgroundColor: "#243a57",
  },

  heroFallback: {
    width: 115,
    height: "100%",
    backgroundColor: "#243a57",
    alignItems: "center",
    justifyContent: "center",
  },

  heroFallbackText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  heroInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },

  heroBadge: {
    color: "#38d7ff",
    fontSize: 9,
    fontWeight: "900",
    marginBottom: 6,
  },

  heroTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },

  heroSubtitle: {
    color: "#9fb2c7",
    fontSize: 10,
    lineHeight: 14,
    marginTop: 8,
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  quickCard: {
    width: "48.5%",
    backgroundColor: "#0d1b2a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },

  quickTitle: {
    color: "#38d7ff",
    fontSize: 12,
    fontWeight: "900",
  },

  quickSub: {
    color: "#ffffff",
    fontSize: 9,
    marginTop: 4,
  },
});
