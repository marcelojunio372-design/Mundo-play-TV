import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.box}>
        <Text style={styles.title}>MUNDO PLAY TV</Text>
        <Text style={styles.text}>APP TESTE OK</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#12031f",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    padding: 24,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  text: {
    color: "#7ff7dd",
    fontSize: 18,
    fontWeight: "700",
  },
});
