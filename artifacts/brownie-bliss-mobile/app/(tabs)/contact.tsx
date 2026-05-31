import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const INFO_CARDS = [
  {
    icon: "map-pin" as const,
    title: "Visit Us",
    value: "Krishnagiri,\nTamil Nadu",
    onPress: undefined,
  },
  {
    icon: "phone" as const,
    title: "Call Us",
    value: "+91 8072596340",
    onPress: () => Linking.openURL("tel:+918072596340"),
  },
  {
    icon: "mail" as const,
    title: "Email",
    value: "gpriya26185@gmail.com",
    onPress: () => Linking.openURL("mailto:gpriya26185@gmail.com"),
  },
];

const HOURS = [
  { day: "Monday – Saturday", time: "9 AM – 9 PM" },
  { day: "Sunday", time: "10 AM – 7 PM" },
];

export default function ContactScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleSend = () => {
    if (!name.trim() || !message.trim()) {
      Alert.alert("Missing Info", "Please enter your name and message.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const waMsg = `Hello Brownie Bliss!\n\nName: ${name}\nEmail: ${email}\n\nMessage: ${message}`;
    Linking.openURL(
      `https://wa.me/918072596340?text=${encodeURIComponent(waMsg)}`
    );
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: colors.primary },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: colors.accent, fontFamily: "Inter_700Bold" },
          ]}
        >
          Contact
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label */}
        <Text
          style={[
            styles.sectionLabel,
            { color: colors.accent, fontFamily: "Inter_700Bold" },
          ]}
        >
          GET IN TOUCH
        </Text>

        {/* Title */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.primary, fontFamily: "Inter_700Bold" },
          ]}
        >
          Let's Make Life{" "}
          <Text style={{ color: colors.accent, fontStyle: "italic" }}>
            Sweeter Together
          </Text>
        </Text>

        {/* Description */}
        <Text
          style={[
            styles.desc,
            { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
          ]}
        >
          Whether you're planning a birthday celebration, craving rich homemade
          brownies, or simply want to surprise someone special — we'd love to
          bake happiness for you.
        </Text>

        {/* Contact info cards */}
        {INFO_CARDS.map((card) => (
          <Pressable
            key={card.title}
            onPress={card.onPress}
            style={({ pressed }) => [
              styles.infoCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed && card.onPress ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.infoIcon, { backgroundColor: colors.primary }]}>
              <Feather name={card.icon} size={20} color={colors.accent} />
            </View>
            <View style={styles.infoText}>
              <Text
                style={[
                  styles.infoTitle,
                  { color: colors.primary, fontFamily: "Inter_600SemiBold" },
                ]}
              >
                {card.title}
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
                ]}
              >
                {card.value}
              </Text>
            </View>
            {card.onPress && (
              <Feather
                name="chevron-right"
                size={18}
                color={colors.mutedForeground}
              />
            )}
          </Pressable>
        ))}

        {/* Baking hours card */}
        <View style={styles.hoursCard}>
          <Text
            style={[
              styles.hoursTitle,
              { color: colors.accent, fontFamily: "Inter_700Bold" },
            ]}
          >
            ⏰  Baking Hours
          </Text>
          {HOURS.map((row, i) => (
            <View
              key={row.day}
              style={[
                styles.hourRow,
                i < HOURS.length - 1 && styles.hourRowBorder,
              ]}
            >
              <Text
                style={[
                  styles.hourDay,
                  { color: "rgba(245,230,211,0.8)", fontFamily: "Inter_400Regular" },
                ]}
              >
                {row.day}
              </Text>
              <Text
                style={[
                  styles.hourTime,
                  { color: "#fff", fontFamily: "Inter_600SemiBold" },
                ]}
              >
                {row.time}
              </Text>
            </View>
          ))}
        </View>

        {/* Instagram gradient box */}
        <Pressable
          onPress={() =>
            Linking.openURL("https://instagram.com/brownie_bliss_")
          }
        >
          <LinearGradient
            colors={["#833ab4", "#fd1d1d", "#fcb045"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.instaBox}
          >
            <View style={styles.instaIcon}>
              <Feather name="instagram" size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.instaFollow,
                  { fontFamily: "Inter_400Regular" },
                ]}
              >
                Follow our baking journey
              </Text>
              <Text
                style={[
                  styles.instaHandle,
                  { fontFamily: "Inter_700Bold" },
                ]}
              >
                @brownie_bliss_
              </Text>
            </View>
            <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </Pressable>

        {/* Contact form */}
        <View style={styles.formBox}>
          <View style={styles.formTop}>
            <Text style={styles.formTopEmoji}>✨</Text>
            <Text
              style={[
                styles.formTitle,
                { color: colors.accent, fontFamily: "Inter_700Bold" },
              ]}
            >
              Send us a Message
            </Text>
          </View>

          <Text
            style={[
              styles.formDesc,
              { fontFamily: "Inter_400Regular" },
            ]}
          >
            Have a custom order, celebration idea or dessert request? We'd love
            to hear from you.
          </Text>

          <TextInput
            placeholder="Your Name"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={name}
            onChangeText={setName}
            style={[styles.input, { fontFamily: "Inter_400Regular" }]}
          />
          <TextInput
            placeholder="Your Email"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { fontFamily: "Inter_400Regular" }]}
          />
          <TextInput
            placeholder="Tell us about your order..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            style={[
              styles.textarea,
              { fontFamily: "Inter_400Regular" },
            ]}
          />

          <Pressable
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendBtn,
              { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text
              style={[
                styles.sendBtnText,
                { color: colors.primary, fontFamily: "Inter_700Bold" },
              ]}
            >
              SEND MESSAGE →
            </Text>
          </Pressable>
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22 },
  content: { padding: 20, gap: 20 },

  sectionLabel: {
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: -8,
  },
  sectionTitle: {
    fontSize: 30,
    lineHeight: 38,
  },
  desc: {
    fontSize: 16,
    lineHeight: 26,
    marginTop: -4,
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  infoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 15, marginBottom: 4 },
  infoValue: { fontSize: 13, lineHeight: 20 },

  hoursCard: {
    backgroundColor: "#1a0905",
    borderRadius: 20,
    padding: 24,
  },
  hoursTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  hourRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  hourDay: { fontSize: 14 },
  hourTime: { fontSize: 14 },

  instaBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 18,
  },
  instaIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  instaFollow: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginBottom: 4,
  },
  instaHandle: {
    color: "#fff",
    fontSize: 18,
  },

  formBox: {
    backgroundColor: "#2a120c",
    borderRadius: 24,
    padding: 28,
    gap: 16,
  },
  formTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  formTopEmoji: { fontSize: 24 },
  formTitle: { fontSize: 22 },
  formDesc: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 22,
    marginTop: -4,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 14,
  },
  textarea: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
  },
  sendBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  sendBtnText: {
    fontSize: 13,
    letterSpacing: 1.5,
  },
});
