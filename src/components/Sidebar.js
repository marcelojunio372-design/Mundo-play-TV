import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { COLORS } from "../utils/constants";

export default function Sidebar({ title, items, selectedIndex, onSelect }) {
  return (
    <View style={styles.sidePanel}>
      <Text style={styles.sideTitle}>{title}</Text>
      <ScrollView>
        {items.map((item, index) => (
          <TouchableOpacity
            key={`${item.name}-${index}`}
            style={[styles.categoryItem, selectedIndex === index && styles.categoryItemActive]}
            onPress={() => onSelect(index)}
          >
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryCount}>{item.count}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidePanel: {
    width: 320,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 14,
  },
  sideTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  categoryItem: {
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  categoryItemActive: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  categoryName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    paddingRight: 8,
  },
  categoryCount: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
});
