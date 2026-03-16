import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../utils/constants";

const ITEMS = [
  {
    title: "LANÇAMENTOS DE FILMES",
    subtitle: "Ação, drama, comédia e destaque da semana",
  },
  {
    title: "LANÇAMENTOS DE SÉRIES",
    subtitle: "Novas temporadas e episódios em destaque",
  },
  {
    title: "DESTAQUES DO IPTV",
    subtitle: "Live TV, filmes e séries organizados por categoria",
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ITEMS.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const item = ITEMS[index];

  return (
    <View style={styles.wrap}>
      <View style={styles.banner}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>

        <View style={styles.dotsRow}>
          {ITEMS.map((_, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dot, index === i && styles.dotActive]}
              onPress={() => setIndex(i)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },

  banner: {
    minHeight: 140,
    borderRadius: 20,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    justifyContent: "center",
  },

  title: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
    maxWidth: 380,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    maxWidth: 420,
  },

  dotsRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.20)",
  },

  dotActive: {
    backgroundColor: COLORS.primary,
    width: 22,
  },
});
