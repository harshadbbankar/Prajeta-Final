import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router } from "expo-router";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { AddPhone } from "@/src/components/AddPhone";
import { ReferralCard } from "@/src/components/ReferralCard";
import { SosQuick } from "@/src/components/SosQuick";
import { TIME_SLOTS, fmtDate, fmtTime, nextDays, priceParts, useConfig } from "@/src/hooks";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, radius, space, useTheme } from "@/src/theme";
import { BrandLogo, Btn, Card, IconBtn, IconTile, Loader, Row, Sheet, StatusBadge, Tag, Txt } from "@/src/ui";

const HERO = require("../../assets/images/hero-chauffeur.jpg");
const PORTRAIT = require("../../assets/images/driver-portrait.jpg");
const CAT_TAGS: Record<string, string> = { hourly: "Popular", "full-day": "Full day", "pickup-drop": "One way", outstation: "Inter-city", night: "Safe return", monthly: "Staffing", permanent: "Staffing" };

export default function CustomerHome() {
  const { user, ready } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const cfg = useConfig();
  const [svc, setSvc] = useState("hourly");
  const [gear, setGear] = useState<"Manual" | "Automatic">("Manual");
  const [pickup, setPickup] = useState("");
  const [dayIdx, setDayIdx] = useState(0);
  const [time, setTime] = useState("");
  const [sheet, setSheet] = useState<"" | "date" | "time">("");
  const bookings = useQuery({ queryKey: ["my-bookings"], queryFn: () => api<any[]>("/bookings"), enabled: !!user });
  const notif = useQuery({ queryKey: ["notifications"], queryFn: () => api<any>("/notifications"), enabled: !!user });
  if (!ready) return <Loader />;
  if (!user || !["customer", "corporate"].includes(user.role)) return <Redirect href="/login" />;
  const all = bookings.data ?? [];
  const upcoming = all.filter((b) => !["COMPLETED", "CANCELLED"].includes(b.status)).slice(0, 3);
  const last = all.find((b) => b.status === "COMPLETED" && b.driver_name);
  const s = cfg.data?.settings ?? {};
  const cities = cfg.data?.cities ?? [];
  const homeCity = all[0]?.city_id ?? cities[0]?.id ?? "";
  const cityName = cities.find((c) => c.id === homeCity)?.name ?? "Your city";
  const days = nextDays(14);
  const now = new Date();
  const slots = TIME_SLOTS.filter((t) => dayIdx > 0 || Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) > now.getHours() * 60 + now.getMinutes() + 60);
  const effTime = slots.includes(time) ? time : slots.includes("10:00") ? "10:00" : (slots[0] ?? "10:00");
  const services = (cfg.data?.services ?? []).filter((x) => x.id !== "corporate");
  const cats = ["hourly", "outstation", "night", "monthly"].map((id) => services.find((x) => x.id === id)).filter(Boolean) as typeof services;
  const shown = [...cats, ...services.filter((x) => !cats.includes(x))];
  const sel = services.find((x) => x.id === svc);
  const bookHref = `/book/${svc}?city=${homeCity}&date=${days[dayIdx].iso}&time=${effTime}&trans=${gear}&pickup=${encodeURIComponent(pickup.trim())}`;
  const go = () => router.push((sel?.pricing_mode === "quote" ? `/book/${svc}` : bookHref) as any);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Brand bar */}
      <View style={{ paddingTop: insets.top + space.sm, paddingBottom: space.sm, paddingHorizontal: space.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <BrandLogo size={34} sub="Driver services" />
        </View>
        <Pressable testID="customer-greeting" onPress={() => router.push("/customer/profile")} style={{ flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 120, minHeight: 36, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.tint }}>
          <Ionicons name="navigate" size={12} color={colors.brandPrimary} />
          <Txt v="caption" numberOfLines={1} style={{ fontFamily: fonts.semibold, color: colors.onSurface, flexShrink: 1 }}>{cityName}</Txt>
        </Pressable>
        <SosQuick role="customer" />
        <IconBtn icon="notifications-outline" dot={!!notif.data?.unread} onPress={() => router.push("/notifications")} testID="notifications-button" />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={bookings.isRefetching} onRefresh={() => { bookings.refetch(); notif.refetch(); }} />}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: (usesNativeTabs ? insets.bottom : 0) + space.xl }}
      >
        <AddPhone />
        {/* Hero */}
        <View style={{ height: 190, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.cockpit }}>
          <Image source={HERO} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" />
          <LinearGradient colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.85)"]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ flex: 1, padding: space.lg, justifyContent: "space-between" }}>
            <Row gap={6} style={{ alignSelf: "flex-start", backgroundColor: "rgba(0,0,0,0.6)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Ionicons name="shield-checkmark-outline" size={12} color={colors.brandPrimary} />
              <Txt v="label" color={colors.onSurfaceInverse}>Police verified squad</Txt>
            </Row>
            <View style={{ gap: 4 }}>
              <Txt v="title" color={colors.onSurfaceInverse} style={{ fontSize: 26, lineHeight: 32 }}>Chauffeurs for Your Own Vehicle</Txt>
              <Txt v="caption" color={colors.surfaceTertiary}>Police-verified, uniform-clad professional drivers on demand or scheduled.</Txt>
            </View>
          </View>
        </View>

        {/* Service categories */}
        <Row style={{ justifyContent: "space-between" }}>
          <Txt v="h3" style={{ fontFamily: fonts.bold, letterSpacing: 0.5 }}>SERVICE CATEGORIES</Txt>
          <Pressable onPress={() => router.push(`/service/${svc}` as any)} testID="home-rate-card" hitSlop={8}>
            <Txt v="bodyBold" color={colors.brandPrimary}>Rate Card ›</Txt>
          </Pressable>
        </Row>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
          {shown.map((x) => {
            const on = svc === x.id;
            const pp = priceParts(x);
            return (
              <Pressable
                key={x.id}
                testID={`home-service-${x.id}`}
                onPress={() => setSvc(x.id)}
                style={({ pressed }) => ({ flexBasis: "46%", flexGrow: 1, minHeight: 150, backgroundColor: on ? colors.brandTertiary : colors.surface, borderRadius: radius.lg, borderWidth: on ? 2 : 1, borderColor: on ? colors.brandPrimary : colors.border, padding: space.md, gap: 4, opacity: pressed ? 0.85 : 1 })}
              >
                <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: on ? colors.surface : colors.tint, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={x.icon as any} size={20} color={colors.onSurface} />
                  </View>
                  <View style={{ backgroundColor: on ? colors.brandPrimary : colors.tint, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Txt v="label" style={{ fontSize: 9 }} color={on ? colors.onBrandPrimary : colors.onSurfaceSecondary}>{CAT_TAGS[x.id] ?? "Service"}</Txt>
                  </View>
                </Row>
                <View style={{ flex: 1 }} />
                <Txt v="h3" style={{ fontFamily: fonts.bold }} numberOfLines={2}>{x.name}</Txt>
                <Txt v="caption" numberOfLines={1}>{pp.amount === "Enquire" ? "Dedicated driver placement" : `${pp.amount} ${pp.unit}`}</Txt>
              </Pressable>
            );
          })}
        </View>

        {/* Book private chauffeur */}
        <Card style={{ gap: space.md }} testID="book-in-seconds-card">
          <Row style={{ justifyContent: "space-between", paddingBottom: space.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Row gap={space.sm}>
              <Ionicons name="car-sport-outline" size={22} color={colors.brandPrimary} />
              <Txt v="h3" style={{ fontFamily: fonts.bold }}>Book Private Chauffeur</Txt>
            </Row>
            <Txt v="label">Instant match</Txt>
          </Row>
          <Txt v="label" color={colors.onSurfaceSecondary}>Vehicle transmission</Txt>
          <Row gap={4} style={{ backgroundColor: colors.tint, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 4 }}>
            {(["Manual", "Automatic"] as const).map((g) => {
              const on = gear === g;
              return (
                <Pressable key={g} testID={`home-gear-${g}`} onPress={() => setGear(g)} style={{ flex: 1, minHeight: 44, borderRadius: radius.sm, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: on ? colors.cockpit : "transparent" }}>
                  <Ionicons name={g === "Manual" ? "cog-outline" : "speedometer-outline"} size={15} color={on ? colors.onSurfaceInverse : colors.onSurface} />
                  <Txt v="bodyBold" color={on ? colors.onSurfaceInverse : colors.onSurface}>{g === "Manual" ? "Manual (MT)" : "Automatic (AT)"}</Txt>
                </Pressable>
              );
            })}
          </Row>
          <Txt v="label" color={colors.onSurfaceSecondary}>Your car pickup address</Txt>
          <Row gap={space.sm} style={{ minHeight: 48, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, paddingHorizontal: space.md, backgroundColor: colors.tint }}>
            <Ionicons name="location" size={18} color={colors.brandPrimary} />
            <TextInput testID="home-pickup-input" value={pickup} onChangeText={setPickup} placeholder="House / building, street, area" placeholderTextColor={colors.muted} style={{ flex: 1, minHeight: 46, fontFamily: fonts.medium, fontSize: 15, color: colors.onSurface }} />
            <Ionicons name="locate-outline" size={18} color={colors.muted} />
          </Row>
          <Row style={{ alignItems: "flex-start" }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Txt v="label" color={colors.onSurfaceSecondary}>Date</Txt>
              <SelectBox icon="calendar-outline" value={dayIdx === 0 ? `Today, ${fmtDate(days[0].iso).replace(/ \d{4}$/, "")}` : days[dayIdx].label} onPress={() => setSheet("date")} testID="home-when-select" />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Txt v="label" color={colors.onSurfaceSecondary}>Reporting time</Txt>
              <SelectBox icon="time-outline" value={fmtTime(effTime)} onPress={() => setSheet("time")} testID="home-time-select" />
            </View>
          </Row>
          <Btn title={sel?.pricing_mode === "quote" ? "Request a Quote →" : "Check Driver Availability & Fare →"} testID="book-now-button" onPress={go} />
          <Pressable testID="schedule-later-button" onPress={() => router.push("/book/full-day")} style={{ alignSelf: "center", minHeight: 32, justifyContent: "center" }}>
            <Txt v="caption" style={{ textDecorationLine: "underline", color: colors.onSurface }}>Need a full-day driver instead?</Txt>
          </Pressable>
        </Card>

        {/* Driver nearby / rebook */}
        <Row style={{ justifyContent: "space-between" }}>
          <Row gap={6}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
            <Txt v="h3" style={{ fontFamily: fonts.bold, letterSpacing: 0.5 }}>{last ? "YOUR LAST CHAUFFEUR" : "ACTIVE DRIVER NEARBY"}</Txt>
          </Row>
          <Txt v="label">{last ? fmtDate(last.date) : "≈ 4 mins ETA"}</Txt>
        </Row>
        <Card testID="quick-rebook-card" style={{ flexDirection: "row", gap: space.md, alignItems: "center" }}>
          <View>
            <Image source={PORTRAIT} style={{ width: 64, height: 64, borderRadius: 32 }} contentFit="cover" />
            <View style={{ position: "absolute", right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.cockpit, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="shield-checkmark" size={12} color={colors.brandPrimary} />
            </View>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Txt v="h3" style={{ fontFamily: fonts.bold, flex: 1 }} numberOfLines={1}>{last ? last.driver_name : "Rajesh Sharma"}</Txt>
              {!last ? <Tag tone="warn" icon="star" label="4.96" /> : null}
            </Row>
            <Txt v="caption" numberOfLines={1}>{last ? `${last.service_name} · #${last.ref}` : "1,420+ trips · Mercedes & BMW certified"}</Txt>
            <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }} gap={6}>
              <Tag tone="tint" icon="shield-checkmark" label="Verified chauffeur" />
              {last ? (
                <Pressable testID="quick-rebook-button" onPress={() => router.push(`/book/${last.service_id}` as any)} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 32 }}>
                  <Ionicons name="refresh" size={14} color={colors.brandPrimary} />
                  <Txt v="bodyBold" color={colors.brandPrimary}>Rebook</Txt>
                </Pressable>
              ) : null}
            </Row>
          </View>
        </Card>
        {!last ? <Txt v="caption" style={{ marginTop: -space.sm }}>Illustrative profile — your assigned driver&apos;s real details appear after booking.</Txt> : null}

        <Row style={{ alignItems: "stretch" }} testID="home-trust-strip">
          {[
            ["shield-outline", "Police Check", "Verified record"],
            ["medkit-outline", "OTP Secured", "Start & handover PIN"],
            ["shirt-outline", "White Glove", "Formal uniformed"],
          ].map(([ic, t, d]) => (
            <View key={t} style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.md, alignItems: "center", gap: 4 }}>
              <Ionicons name={ic as any} size={20} color={colors.onSurface} />
              <Txt v="bodyBold" style={{ fontSize: 13 }} center>{t}</Txt>
              <Txt v="caption" style={{ fontSize: 11 }} center>{d}</Txt>
            </View>
          ))}
        </Row>

        {upcoming.length ? (
          <View style={{ gap: space.md }}>
            <Txt v="h3" style={{ fontFamily: fonts.bold, letterSpacing: 0.5 }}>UPCOMING TRIPS</Txt>
            {upcoming.map((b) => (
              <Card key={b.id} testID={`upcoming-booking-${b.ref}`} onPress={() => router.push(`/booking/${b.id}` as any)} style={{ flexDirection: "row", gap: space.md, alignItems: "center", padding: space.md }}>
                <View style={{ width: 64, borderRadius: radius.md, backgroundColor: colors.cockpit, paddingVertical: space.sm, alignItems: "center" }}>
                  <Txt v="label" style={{ fontSize: 9 }} color={colors.surfaceTertiary}>{new Date(b.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase()}</Txt>
                  <Txt v="num" color={colors.onSurfaceInverse}>{fmtTime(b.time).split(" ")[0]}</Txt>
                  <Txt v="label" style={{ fontSize: 9 }} color={colors.surfaceTertiary}>{fmtTime(b.time).split(" ")[1] ?? ""}</Txt>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt v="bodyBold" numberOfLines={1}>{b.service_name}</Txt>
                  <Txt v="caption" numberOfLines={1}>#{b.ref} · {fmtDate(b.date)}</Txt>
                  {b.status === "PAYMENT_PENDING" || b.status === "QUOTED" ? <Txt v="caption" color={colors.brandPrimary} style={{ fontFamily: fonts.bold }}>Pay advance to confirm →</Txt> : null}
                  <StatusBadge status={b.status} />
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        <ReferralCard compact />

        <Card style={{ gap: space.sm }}>
          <Row gap={space.md}>
            <IconTile icon="business-outline" />
            <View style={{ flex: 1 }}>
              <Txt v="h3" style={{ fontFamily: fonts.bold }}>Monthly, permanent or corporate?</Txt>
              <Txt v="caption">Tell us your requirement and get a custom quote.</Txt>
            </View>
          </Row>
          <Row style={{ flexWrap: "wrap" }}>
            <Btn small variant="outline" title="Monthly" testID="home-enquiry-monthly" onPress={() => router.push("/enquiry?type=monthly")} />
            <Btn small variant="outline" title="Permanent" testID="home-enquiry-permanent" onPress={() => router.push("/enquiry?type=permanent")} />
            <Btn small variant="dark" title="Corporate" testID="home-enquiry-corporate" onPress={() => router.push("/enquiry?type=corporate")} />
          </Row>
        </Card>

        <Btn title="Chat on WhatsApp" icon="logo-whatsapp" variant="success" testID="home-whatsapp-button" onPress={() => s.whatsapp_link && Linking.openURL(s.whatsapp_link)} />
      </ScrollView>

      <Sheet visible={sheet === "date"} onClose={() => setSheet("")} title="Pick a date" testID="home-date-sheet">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {days.map((d, i) => (
            <Btn key={d.iso} small variant={dayIdx === i ? "dark" : "outline"} title={i === 0 ? "Today" : d.label} onPress={() => { setDayIdx(i); setSheet(""); }} testID={`home-date-${d.iso}`} />
          ))}
        </View>
      </Sheet>
      <Sheet visible={sheet === "time"} onClose={() => setSheet("")} title="Reporting time" testID="home-time-sheet">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {slots.map((t) => (
            <Btn key={t} small variant={effTime === t ? "dark" : "outline"} title={fmtTime(t)} onPress={() => { setTime(t); setSheet(""); }} testID={`home-time-${t}`} />
          ))}
        </View>
      </Sheet>
    </View>
  );
}

function SelectBox({ icon, value, onPress, testID }: { icon: string; value: string; onPress: () => void; testID: string }) {
  const { colors } = useTheme();
  return (
    <Pressable testID={testID} onPress={onPress} style={{ minHeight: 48, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, paddingHorizontal: space.md, flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: colors.tint }}>
      <Ionicons name={icon as any} size={16} color={colors.onSurfaceSecondary} />
      <Txt v="bodyBold" numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>{value}</Txt>
    </Pressable>
  );
}
