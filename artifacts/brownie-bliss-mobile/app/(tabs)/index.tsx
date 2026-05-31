import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import { fetchProducts, Product } from "@/lib/api";

const CATEGORIES = ["All", "Cakes", "Brownies", "Desserts", "Cookies", "Birthday"];

function ProductCard({ product }: { product: Product }) {
  const colors = useColors();
  const { addItem, items } = useCart();
  const inCart = items.find((i) => i._id === product._id);

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(product);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: product.img }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={[styles.cardCategory, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {product.category}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={[styles.cardPrice, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            ₹{product.price}
          </Text>
          <Pressable
            onPress={handleAdd}
            style={[
              styles.addBtn,
              { backgroundColor: inCart ? colors.accent : colors.primary },
            ]}
          >
            <Feather name={inCart ? "check" : "plus"} size={18} color="#FFF9F2" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { count } = useCart();
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const filtered = activeCategory === "All"
    ? products.slice(0, 8)
    : products
        .filter((p) =>
          activeCategory === "Birthday"
            ? p.type === "birthday"
            : p.category?.toLowerCase() === activeCategory.toLowerCase()
        )
        .slice(0, 8);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.primary }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
            Brownie Bliss
          </Text>
          <Text style={[styles.headerSub, { color: "#F4E4BC", fontFamily: "Inter_400Regular" }]}>
            Homemade Treats
          </Text>
        </View>
        <Pressable onPress={() => router.push("/cart")} style={styles.cartBtn}>
          <Feather name="shopping-bag" size={24} color="#F4E4BC" />
          {count > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.badgeText, { fontFamily: "Inter_700Bold" }]}>{count}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={[styles.heroTagline, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
            FRESHLY BAKED EVERY DAY
          </Text>
          <Text style={[styles.heroTitle, { color: "#FFF9F2", fontFamily: "Inter_700Bold" }]}>
            Happiness in{"\n"}Every Bite
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/menu")}
            style={[styles.heroBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.heroBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              Explore Menu
            </Text>
          </Pressable>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.chip,
                {
                  backgroundColor: activeCategory === cat ? colors.primary : colors.secondary,
                  borderColor: activeCategory === cat ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: activeCategory === cat ? "#FFF9F2" : colors.foreground,
                    fontFamily: activeCategory === cat ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Products */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            {activeCategory === "All" ? "Featured Treats" : activeCategory}
          </Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                No items in this category
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <ProductCard product={item} />}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={{ height: Platform.OS === "web" ? 100 : 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 22 },
  headerSub: { fontSize: 12, marginTop: 1 },
  cartBtn: { padding: 4, position: "relative" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, color: "#4A2C0A" },
  scrollContent: { paddingBottom: 20 },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  heroTagline: { fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  heroTitle: { fontSize: 36, lineHeight: 44, marginBottom: 24 },
  heroBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  heroBtnText: { fontSize: 15 },
  chips: { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14 },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, marginBottom: 16 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardImage: { width: "100%", height: 130 },
  cardBody: { padding: 12 },
  cardName: { fontSize: 14, lineHeight: 20, marginBottom: 2 },
  cardCategory: { fontSize: 11, textTransform: "capitalize", marginBottom: 8 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardPrice: { fontSize: 16 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: { alignItems: "center", paddingTop: 48, gap: 12 },
  emptyText: { fontSize: 15 },
});
