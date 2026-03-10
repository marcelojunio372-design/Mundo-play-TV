import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = "MPT_LANGUAGE";

export default function SettingsScreen({ navigation }) {
  const [lang, setLang] = useState("pt");

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (saved) setLang(saved);
    })();
  }, []);

  async function changeLanguage(next) {
    await AsyncStorage.setItem(LANGUAGE_KEY, next);
    setLang(next);
    Alert.alert("OK", "Idioma salvo.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>

      <Text style={styles.sub}>Idiomas</Text>

      <TouchableOpacity style={styles.item} onPress={() => changeLanguage("pt")}>
        <Text style={styles.itemText}>Português {lang === "pt" ? "✓" : ""}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => changeLanguage("en")}>
        <Text style={styles.itemText}>English {lang === "en" ? "✓" : ""}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => changeLanguage("es")}>
        <Text style={styles.itemText}>Español {lang === "es" ? "✓" : ""}</Text>
      </TouchableOpacity>

      <Text style={styles.sub}>Opções</Text>

      <View style={styles.item}>
        <Text style={styles.itemText}>Modo TV Box</Text>
      </View>

      <View style={styles.item}>
        <Text style={styles.itemText}>Qualidade do player</Text>
      </View>

      <View style={styles.item}>
        <Text style={styles.itemText}>Sobre o Mundo Play TV</Text>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>VOLTAR</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#12001f",
    padding: 20,
  },

  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 18,
  },

  sub: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 8,
  },

  item: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  itemText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  backBtn: {
    marginTop: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  backBtnText: {
    color: "#111",
    fontSize: 14,
    fontWeight: "900",
  },
});
