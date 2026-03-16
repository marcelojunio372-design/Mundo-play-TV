import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { APP_CONFIG, COLORS, LAYOUT } from "../utils/constants";
import { HOME_FEATURED } from "../data/mockData";

export default function HomeScreen({
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onOpenSettings,
  onLogout,
}) {
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HOME_FEATURED.length);
    }, 3000);

    const clock = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(clock);
    };
  }, []);

  const featured = HOME_FEATURED[index];

  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const date = now.toLocaleDateString("pt-BR");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>{APP_CONFIG.appName}</Text>
          <Text style={styles.sub}>{APP_CONFIG.tagline}</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.clock}>{time}   {date}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={styles.menuItem} onPress={onOpenLive}>
            <Text style={styles.menuText}>LIVE TV</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onOpenMovies}>
            <Text style={styles.menuText}>FILMES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onOpenSeries}>
            <Text style={styles.menuText}>SÉRIES</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onOpenSettings}>
            <Text style={styles.menuText}>CONFIGURAÇÃO</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Text style={styles.menuText}>SAIR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.main}>
          <View style={styles.carousel}>
            <Text style={styles.carouselTitle}>{featured.title}</Text>
            <Text style={styles.carouselSub}>{featured.subtitle}</Text>

            <View style={styles.dots}>
              {HOME_FEATURED.map((item, i) => (
                <View
                  key={item.id}
                  style={[styles.dot, i === index && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  header: {
    height: LAYOUT.headerHeight,
    paddingHorizontal: LAYOUT.isTV ? 22 : 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.panel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    color: COLORS.text,
    fontSize: LAYOUT.topTitle,
    fontWeight: "900",
  },

  sub: {
    color: COLORS.muted,
    fontSize: LAYOUT.isTV ? 14 : 10,
    marginTop: 4,
  },

  headerRight: {
    alignItems: "flex-end",
  },

  clock: {
    color: COLORS.text,
    fontSize: LAYOUT.isTV ? 16 : 11,
    fontWeight: "800",
  },

  content: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: LAYOUT.sidebarWidth,
    backgroundColor: "#081624",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    padding: LAYOUT.isTV ? 18 : 10,
  },

  menuItem: {
    minHeight: LAYOUT.isTV ? 62 : 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panel,
    justifyContent: "center",
    paddingHorizontal: LAYOUT.isTV ? 18 : 12,
    marginBottom: 12,
  },

  menuText: {
    color: COLORS.text,
    fontSize: LAYOUT.menuText,
    fontWeight: "800",
  },

  main: {
    flex: 1,
    padding: LAYOUT.isTV ? 18 : 10,
  },

  carousel: {
    flex: 1,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panel,
    padding: LAYOUT.isTV ? 26 : 16,
    justifyContent: "center",
  },

  carouselTitle: {
    color: COLORS.text,
    fontSize: LAYOUT.isTV ? 34 : 20,
    fontWeight: "900",
    marginBottom: 10,
    maxWidth: LAYOUT.isTV ? 500 : "100%",
  },

  carouselSub: {
    color: COLORS.muted,
    fontSize: LAYOUT.isTV ? 18 : 12,
    maxWidth: LAYOUT.isTV ? 600 : "100%",
  },

  dots: {
    flexDirection: "row",
    marginTop: 20,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.20)",
    marginRight: 8,
  },

  dotActive: {
    width: 28,
    backgroundColor: COLORS.primary,
  },
});
