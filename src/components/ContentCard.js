import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, IS_TV_LAYOUT } from "../utils/constants";

export default function ContentCard({ title, rating }) {
  return (
    <View style={styles.posterCard}>
      <View style={styles.posterImage}>
        <Text style={styles.posterRating}>{rating}</Text>
      </View>
      <Text numberOfLines={2} style={styles.posterTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  posterCard: {
    width: IS_TV_LAYOUT ? "23%" : "48%",
  },
  posterImage: {
    height: IS_TV_LAYOUT ? 230 : 180,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 8,
  },
  posterRating: {
    backgroundColor: COLORS.primary,
    color: "#00151d",
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  posterTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
  },
});
