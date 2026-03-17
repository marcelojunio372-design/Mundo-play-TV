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

export default function SeriesScreen({
  session,
  onBack,
  onOpenLive,
  onOpenMovies,
  onOpenSeries,
  onSelectSeries,
}) {
  const series = session?.data?.series || [];
  const categories = useMemo(() => buildCategories(series), [series]);
  const [selectedCategory, setSelectedCategory] = useState(0);

  const visibleSeries = categories[selectedCategory]?.items || series;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topnav}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.navText}>Casa</Text>
        </TouchableOpacity>

        <Text style={styles.sep}>|</Text>

        <TouchableOpacity onPress={onOpenLive}>
          <Text style={styles.navText}>TV ao Vivo</Text>
        </TouchableOpacity>

        <Text style={styles.sep}>|</Text>

        <TouchableOpacity onPress={onOpenMovies}>
          <Text style={styles.navText}>Filmes</Text>
        </TouchableOpacity>

        <Text style={styles.sep}>|</Text>

        <TouchableOpacity onPress={onOpenSeries}>
          <Text style={styles.navTextActive}>Séries</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.leftPanel}>
          <View style={styles.leftHeader}>
            <Text style={styles.leftIcon}>🎬</Text>
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
                    style={[
                      styles.categoryText,
                      active && styles.categoryTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <Text
                    style={[
                      styles.categoryCount,
                      active && styles.categoryTextActive,
                    ]}
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
            {categories[selectedCategory]?.name || "Tudo"} ({visibleSeries.length})
          </Text>

          <FlatList
            data={visibleSeries}
            keyExtractor={(item, index) => item.id || `${item.name}_${index}`}
            numColumns={isPhone ? 3 : 5}
            columnWrapperStyle={styles.rowWrap}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => onSelectSeries(item)}
              >
                <Image
                  source={item.logo ? { uri: item.logo } : undefined}
                  style={styles.poster}
                />

                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.name}
                </Text>

                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.year || "-"}
                </Text>

                <Text style={styles.cardGroup} numberOfLines={1}>
                  {item.group || "Séries"}
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
  container: {
    flex: 1,
    backgroundColor: "#040914",
  },

  topnav: {
    height: isPhone ? 42 : 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  navText: {
    color: "#d7d7d7",
    fontSize: isPhone ? 11 : 16,
  },

  navTextActive: {
    color: "#ffe04f",
    fontSize: isPhone ? 11 : 16,
    fontWeight: "900",
  },

  sep: {
    color: "#ccc",
    marginHorizontal: 12,
  },

  content: {
    flex: 1,
    flexDirection: "row",
  },

  leftPanel: {
    width: isPhone ? 108 : 260,
    backgroundColor: "#261425",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.1)",
  },

  leftHeader: {
    height: isPhone ? 58 : 110,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  leftIcon: {
    color: "#fff",
    fontSize: isPhone ? 22 : 50,
    marginBottom: 4,
  },

  leftTitle: {
    color: "#fff",
    fontSize: isPhone ? 9 : 14,
  },

  categoryRow: {
    minHeight: isPhone ? 32 : 50,
    paddingHorizontal: isPhone ? 8 : 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  categoryActive: {
    backgroundColor: "rgba(255,224,79,0.12)",
  },

  categoryText: {
    color: "#f4f4f4",
    fontSize: isPhone ? 8 : 13,
    flex: 1,
    marginRight: 8,
  },

  categoryTextActive: {
    color: "#ffe04f",
    fontWeight: "900",
  },

  categoryCount: {
    color: "#f4f4f4",
    fontSize: isPhone ? 8 : 13,
  },

  rightPanel: {
    flex: 1,
    padding: isPhone ? 8 : 10,
  },

  totalLabel: {
    color: "#d9d9d9",
    textAlign: "right",
    fontSize: isPhone ? 10 : 18,
    marginBottom: 8,
  },

  rowWrap: {
    justifyContent: "space-between",
    marginBottom: isPhone ? 8 : 10,
  },

  card: {
    width: isPhone ? "31.5%" : "18.6%",
    marginBottom: isPhone ? 8 : 12,
  },

  poster: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: 8,
    backgroundColor: "#2a3550",
    marginBottom: 5,
  },

  cardTitle: {
    color: "#f0f0f0",
    fontSize: isPhone ? 8.5 : 12,
    fontWeight: "700",
    lineHeight: isPhone ? 11 : 16,
  },

  cardMeta: {
    color: "#c9d3df",
    fontSize: isPhone ? 7 : 10,
    marginTop: 2,
  },

  cardGroup: {
    color: "#9fb1c7",
    fontSize: isPhone ? 7 : 10,
    marginTop: 1,
  },
});
