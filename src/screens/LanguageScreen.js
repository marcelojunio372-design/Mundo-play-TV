import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS } from "../utils/constants";
import { getLanguage, setLanguage } from "../utils/storage";
import { t } from "../utils/helpers";

export default function LanguageScreen({ onBack, onLogout }) {
  const [lang, setLang] = useState("pt");

  useEffect(() => {
    async function load() {
      const saved = await getLanguage();
      setLang(saved);
    }
    load();
  }, []);

  async function choose(next) {
    await setLanguage(next);
    setLang(next);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerBtn}>{t(lang, "back")}</Text>
        </TouchableOpacity>

        <Text style={styles.brand}>{t(lang, "languages")}</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>{t(lang, "logout")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.centeredScreen}>
        <View style={styles.infoCard}>
          <Text style={styles.contentTitle}>{t(lang, "chooseLanguage")}</Text>

          <TouchableOpacity style={[styles.langBtn, lang === "pt" && styles.langBtnActive]} onPress={() => choose("pt")}>
            <Text style={styles.infoLine}>Português</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.langBtn, lang === "en" && styles.langBtnActive]} onPress={() => choose("en")}>
            <Text style={styles.infoLine}>English</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.langBtn, lang === "es" && styles.langBtnActive]} onPress={() => choose("es")}>
            <Text style={styles.infoLine}>Español</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.panel,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBtn: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },
  brand: { color: COLORS.text, fontSize: 22, fontWeight: "800" },
  logoutBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoutText: { color: COLORS.primary, fontWeight: "800" },
  centeredScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  infoCard: {
    width: "100%",
    maxWidth: 700,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 20,
  },
  contentTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },
  langBtn: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panel2,
    marginBottom: 12,
  },
  langBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  infoLine: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
});
