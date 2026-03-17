import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from "react-native";

export default function SeriesScreen({
  session,
  onBack,
  onOpenSeriesDetails,
}) {
  // ✅ FILTRA SÓ SÉRIES
  const series = (session?.data?.series || []).filter(
    (item) =>
      item.type === "series" ||
      item.group?.toLowerCase().includes("serie")
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>VOLTAR</Text>
      </TouchableOpacity>

      <FlatList
        data={series}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onOpenSeriesDetails(item)}
          >
            <Image
              source={{ uri: item.logo }}
              style={styles.image}
            />
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#06111d", padding: 10 },

  back: {
    color: "#38d7ff",
    marginBottom: 10,
    fontWeight: "bold",
  },

  card: {
    flex: 1,
    margin: 5,
  },

  image: {
    width: "100%",
    height: 120,
    borderRadius: 8,
  },

  title: {
    color: "#fff",
    fontSize: 10,
    marginTop: 5,
  },
});
