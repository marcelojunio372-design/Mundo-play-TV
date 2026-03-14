-import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";

export default function LanguageScreen({ navigation }) {
  function pickLanguage(lang) {
    Alert.alert("Idioma", `${lang} selecionado.`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Idiomas</Text>

        <TouchableOpacity style={styles.item} onPress={() => pickLanguage("Português")}>
          <Text style={styles.itemText}>Português</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => pickLanguage("English")}>
          <Text style={styles.itemText}>English</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => pickLanguage("Español")}>
          <Text style={styles.itemText}>Español</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#12031f",
  },
  container: {
    flex: 1,
    padding: 18,
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 20,
  },
  item: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  itemText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  backBtn: {
    marginTop: 10,
    backgroundColor: "#18e7a1",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  backBtnText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 18,
  },
});
