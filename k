import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
} from "react-native";

const { width } = Dimensions.get("window");
const isPhone = width < 900;

function buildCategories(items) {
  const groups = {};
  items.forEach((item) => {
    const key = String(item.group || "OUTROS").trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  return [
    { name: "Tudo", items },
    { name: "Favoritos", items: [] },
    { name: "Visto por último", items: [] },
    ...Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((group) => ({ name: group, items: groups[group] })),
  ];
}

export default function MoviesScreen({
  session,
  onBack,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onSelectMovie,
}) {
  const movies = session?.data?.movies || [];
  const categories = useMemo(() => buildCategories(movies), [movies]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const visibleMovies = categories[selectedCategory]?.items || movies;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topnav}>
        <TouchableOpacity onPress={onBack}><Text style={styles.navText}>Casa</Text></TouchableOpacity>
        <Text style={styles.sep}>|</Text>
        <TouchableOpacity onPress={onOpenLive}><Text style={styles.navText}>TV ao Vivo</Text></TouchableOpacity>
        <Text style={styles.sep}>|</Text>
        <TouchableOpacity onPress={onOpenMovies}><Text style={styles.navTextActive}>Filmes</Text></TouchableOpacity>
        <Text style={styles.sep}>|</Text>
        <TouchableOpacity onPress={onOpenSeries}><Text style={styles.navText}>Séries</Text></TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.leftPanel}>
          <View style={styles.leftHeader}>
            <Text style={styles.leftIcon}>▷</Text>
            <Text style={styles.leftTitle}>voltar</Text>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item, index) => `${item.name}_${index}`}
            renderItem={({ item, index }) => {
              const active = index === selectedCategory;
              return (
                <TouchableOpacity
                  style={[styles.categoryRow, active && styles.categoryActive]}
                  onPress={() => setSelectedCategory(index)}
                >
                  <Text
                    style={[styles.categoryText, active && styles.categoryTextActive]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.categoryCount, active && styles.categoryTextActive]}
                  >
                    {item.items.length}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <View style={styles.rightPanel}>
          <Text style={styles.totalLabel}>
            {categories[selectedCategory]?.name || "Tudo"} ({visibleMovies.length})
          </Text>

          <FlatList
            data={visibleMovies}
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            numColumns={isPhone ? 3 : 5}
            columnWrapperStyle={styles.rowWrap}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => onSelectMovie(item)}>
                <Image
                  source={item.logo ? { uri: item.logo } : undefined}
                  style={styles.poster}
                />
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#040914" },
  topnav: {
    height: isPhone ? 42 : 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  navText: { color: "#d7d7d7", fontSize: isPhone ? 11 : 16 },
  navTextActive: { color: "#ffe04f", fontSize: isPhone ? 11 : 16, fontWeight: "900" },
  sep: { color: "#ccc", marginHorizontal: 12 },

  content: { flex: 1, flexDirection: "row" },

  leftPanel: {
    width: isPhone ? 120 : 260,
    backgroundColor: "#261425",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.1)",
  },
  leftHeader: {
    height: isPhone ? 70 : 110,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  leftIcon: { color: "#fff", fontSize: isPhone ? 30 : 54, marginBottom: 6 },
  leftTitle: { color: "#fff", fontSize: isPhone ? 10 : 14 },

  categoryRow: {
    minHeight: isPhone ? 34 : 50,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  categoryActive: { backgroundColor: "rgba(255,224,79,0.12)" },
  categoryText: { color: "#f4f4f4", fontSize: isPhone ? 9 : 13, flex: 1, marginRight: 8 },
  categoryTextActive: { color: "#ffe04f" },
  categoryCount: { color: "#f4f4f4", fontSize: isPhone ? 9 : 13 },

  rightPanel: { flex: 1, padding: 10 },
  totalLabel: {
    color: "#d9d9d9",
    textAlign: "right",
    fontSize: isPhone ? 12 : 18,
    marginBottom: 10,
  },
  rowWrap: { justifyContent: "space-between", marginBottom: 10 },
  card: { width: isPhone ? "31.8%" : "18.6%" },
  poster: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: 8,
    backgroundColor: "#2a3550",
    marginBottom: 6,
  },
  cardTitle: { color: "#f0f0f0", fontSize: isPhone ? 9 : 12 },
});
