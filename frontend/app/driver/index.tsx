import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Redirect, router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { DriverAvatar, DriverPhotoCard } from "@/src/components/DriverPhotoCard";
import { LocationShare } from "@/src/components/LocationShare";
import { AddPhone } from "@/src/components/AddPhone";
import { useAuth } from "@/src/auth";
import { fmtDate, fmtTime, usePolling } from "@/src/hooks";
import { usesNativeTabs } from "@/src/navigation";
import { SosQuick } from "@/src/components/SosQuick";
import { fonts, radius, space, useTheme } from "@/src/theme";
import { Btn, Card, Empty, IconBtn, Loader, Row, SectionHead, StatusBadge, Tag, Txt, haptic, money, useToast } from "@/src/ui";

const COCKPIT = require("../../assets/images/cockpit.jpg");

export default function DriverHome() {
  const { user, ready } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const profile = useQuery({ queryKey: ["driver-profile"], queryFn: () => api<any>("/driver/profile"), enabled: !!user });
  const offers = useQuery({ queryKey: ["driver-offers"], queryFn: () => api<any[]>("/driver/offers"), enabled: !!user });
  const earn = useQuery({ queryKey: ["driver-earnings"], queryFn: () => api<any>("/driver/earnings"), enabled: !!user });
  const jobs = useQuery({ queryKey: ["driver-jobs"], queryFn: () => api<any[]>("/driver/jobs"), enabled: !!user });
  const [busyId, setBusyId] = useState("");
  const [toggling, setToggling] = useState(false);
  const refetchAll = useCallback(() => {
    offers.refetch();
    jobs.refetch();
  }, [offers, jobs]);
  usePolling(refetchAll, 15000, profile.data?.status === "APPROVED");

  if (!ready) return <Loader />;
  if (!user) return <Redirect href="/login?role=driver" />;
  if (profile.isLoading) return <Loader />;
  const p = profile.data;
  const approved = p?.status === "APPROVED";
  const licLeft = p?.licence_expiry ? Math.round((new Date(p.licence_expiry + "T00:00:00").getTime() - Date.now()) / 86400000) : null;
  const expDocs = (p?.documents ?? [])
    .filter((x: any) => ["identity", "police_verification", "address_proof"].includes(x.doc_type) && x.expiry)
    .map((x: any) => ({ ...x, left: Math.round((new Date(x.expiry + "T00:00:00").getTime() - Date.now()) / 86400000) }))
    .filter((x: any) => x.left <= 30);
  const active = (jobs.data ?? []).filter((j) => ["ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(j.status));

  const toggle = async () => {
    setToggling(true);
    haptic("heavy");
    try {
      await api("/driver/online", { body: { online: !p.online } });
      await profile.refetch();
      offers.refetch();
      toast(!p.online ? "You're online — offers will appear here" : "You're offline");
    } catch (e: any) {
      toast(e.message, "err");
    } finally {
      setToggling(false);
    }
  };
  const respond = async (id: string, action: "accept" | "decline") => {
    setBusyId(id + action);
    try {
      const r = await api<any>(`/driver/offers/${id}/${action}`, { body: {} });
      toast(action === "accept" ? "Job accepted!" : "Offer declined");
      refetchAll();
      if (action === "accept") router.push(`/trip/${r.id}` as any);
    } catch (e: any) {
      toast(e.message, "err");
      refetchAll();
    } finally {
      setBusyId("");
    }
  };

  const e = earn.data;
  const police = p?.police_verification ?? "NOT_STARTED";
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingTop: insets.top + space.sm, paddingBottom: space.sm, paddingHorizontal: space.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <DriverAvatar profile={p} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="h3" style={{ fontFamily: fonts.bold, fontSize: 15, lineHeight: 19 }} testID="driver-name" numberOfLines={2}>
            {p?.name || user.name || "Driver"}
          </Txt>
          <Row gap={6}>
            <Txt v="caption" numberOfLines={1} style={{ flexShrink: 0 }}>DRV-{(user.id ?? "").replace(/[^0-9a-z]/gi, "").slice(-4).toUpperCase()}</Txt>
            <View style={{ backgroundColor: colors.brandTertiary, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, flexShrink: 0 }}>
              <Txt v="label" numberOfLines={1} style={{ fontSize: 9 }} color={colors.brandPrimary}>{approved ? (p.badge === "gold" ? "Gold" : p.badge ? "Elite" : "Verified") : "Review"}</Txt>
            </View>
          </Row>
        </View>
        {approved ? (
          <Pressable testID="driver-online-toggle" disabled={toggling} onPress={toggle} style={{ minHeight: 44, borderRadius: radius.pill, backgroundColor: colors.cockpit, flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 10, paddingRight: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.online ? colors.success : colors.muted }} />
            <Txt v="label" color={colors.onSurfaceInverse} style={{ fontSize: 10 }}>{p.online ? "On duty" : "Off"}</Txt>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: p.online ? colors.success : colors.cockpitCard, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cockpitBorder }}>
              <Ionicons name="power" size={16} color={colors.onSurfaceInverse} />
            </View>
          </Pressable>
        ) : null}
        <IconBtn icon="notifications-outline" onPress={() => router.push("/notifications")} testID="driver-notifications-button" />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={offers.isRefetching} onRefresh={() => { profile.refetch(); refetchAll(); earn.refetch(); }} />}
        contentContainerStyle={{ padding: space.lg, gap: space.lg, paddingBottom: (usesNativeTabs ? insets.bottom : 0) + space.xl }}
      >
        {approved ? (
          <Card style={{ gap: space.md }} testID="shift-telemetry-card">
            <Row style={{ justifyContent: "space-between" }}>
              <Row gap={6}>
                <Ionicons name="analytics-outline" size={16} color={colors.onSurface} />
                <Txt v="label" color={colors.onSurface}>Today&apos;s shift telemetry</Txt>
              </Row>
              <Pressable onPress={() => router.push("/driver/earnings")} testID="instant-payout-link" hitSlop={8}>
                <Txt v="bodyBold" color={colors.brandPrimary} style={{ fontSize: 13 }}>Instant Payout</Txt>
              </Pressable>
            </Row>
            <Row gap={0} style={{ alignItems: "stretch" }}>
              {[
                ["Earnings", money(e?.periods?.today ?? 0), `${active.length} active`, "driver-today-earnings"],
                ["This week", money(e?.periods?.week ?? 0), "verified", "driver-week-earnings"],
                ["Trips", String(e?.items?.length ?? 0), "completed", "driver-trips-count"],
                ["Score", String(p?.rating ?? "New"), `${p?.review_count ?? 0} ratings`, "driver-score"],
              ].map(([l, v, sub, id], i) => (
                <View key={l} style={{ flex: 1, alignItems: "center", gap: 2, borderLeftWidth: i ? 1 : 0, borderLeftColor: colors.border, paddingHorizontal: 2 }}>
                  <Txt v="label" style={{ fontSize: 9 }}>{l}</Txt>
                  <Txt v="num" testID={id} numberOfLines={1} style={{ fontSize: 17 }}>{v}</Txt>
                  <Txt v="caption" style={{ fontSize: 10 }} color={i === 0 ? colors.successText : colors.muted} numberOfLines={1}>{sub}</Txt>
                </View>
              ))}
            </Row>
          </Card>
        ) : null}
        <AddPhone />
        {approved && licLeft !== null && licLeft <= 30 ? (
          <Card testID="licence-warning-card" style={{ gap: space.sm, borderColor: licLeft < 0 ? colors.error : colors.warning, borderWidth: 1.5 }}>
            <Txt v="h3" color={licLeft < 0 ? colors.error : colors.onSurface}>
              {licLeft < 0 ? "Licence expired — jobs paused" : `Licence expires in ${licLeft} day(s)`}
            </Txt>
            <Txt v="caption">
              {p.documents?.some((x: any) => x.doc_type === "licence_renewal")
                ? "Renewed licence received — our team is verifying it."
                : licLeft < 0
                  ? "Upload your renewed licence. You can go online once our team verifies it."
                  : "Upload your renewed licence early so your jobs are not interrupted."}
            </Txt>
            <Btn small title="Upload renewed licence" icon="cloud-upload" onPress={() => router.push("/driver-onboarding")} testID="licence-renew-button" />
          </Card>
        ) : null}
        {approved && expDocs.length ? (
          <Card testID="docs-warning-card" style={{ gap: space.sm, borderColor: expDocs.some((x: any) => x.left < 0) ? colors.error : colors.warning, borderWidth: 1.5 }}>
            <Txt v="h3">{p.docs_expired?.length ? "Documents expired — jobs paused" : "Documents expiring soon"}</Txt>
            {expDocs.map((x: any) => (
              <Txt key={x.id} v="caption" style={{ color: colors.onSurface }}>
                • {({ identity: "Identity proof", police_verification: "Police verification", address_proof: "Address proof" } as Record<string, string>)[x.doc_type]}: {x.left < 0 ? `expired ${-x.left} day(s) ago` : `expires in ${x.left} day(s)`}
              </Txt>
            ))}
            <Btn small title="Upload valid documents" icon="cloud-upload" onPress={() => router.push("/driver-onboarding")} testID="docs-renew-button" />
          </Card>
        ) : null}
        {!approved ? (
          <Card testID="verification-status-card" style={{ gap: space.sm }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Txt v="h3">Verification</Txt>
              <StatusBadge status={p?.status ?? "DRAFT"} testID="driver-verification-status" />
            </Row>
            <Txt v="body" color={colors.muted}>
              {p?.status === "DRAFT"
                ? "Complete your profile and upload your licence and ID to apply."
                : p?.status === "REJECTED"
                  ? `Not approved: ${p.rejection_reason ?? ""}. Update and resubmit.`
                  : p?.status === "SUSPENDED"
                    ? `Account suspended: ${p.status_reason ?? ""}`
                    : "Our verification team is reviewing your documents. You'll be notified once approved."}
            </Txt>
            {["DRAFT", "REJECTED"].includes(p?.status) ? <Btn title={p?.status === "DRAFT" ? "Complete onboarding" : "Update application"} icon="arrow-forward" testID="start-onboarding-button" onPress={() => router.push("/driver-onboarding")} /> : <Btn variant="outline" title="View application" testID="view-application-button" onPress={() => router.push("/driver-onboarding")} />}
          </Card>
        ) : null}

        {approved && p.online && !active.length ? <LocationShare presence /> : null}
        {approved ? <DriverPhotoCard compact /> : null}
        {approved && p.badge ? (
          <Card testID="driver-badge-card" style={{ gap: 4, borderColor: colors.warning, borderWidth: 1.5 }}>
            <Row>
              <Ionicons name={p.badge === "gold" ? "trophy" : "ribbon"} size={20} color={colors.warning} />
              <Txt v="h3">{p.badge === "gold" ? "Gold Star Driver" : "Top Rated"}</Txt>
            </Row>
            <Txt v="caption">Thanks for great service! You see new booking offers before other drivers and earn a bonus on every completed trip.</Txt>
          </Card>
        ) : null}
        {active.length ? (
          <Card style={{ gap: space.md }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Row gap={6}>
                <Ionicons name="calendar-outline" size={18} color={colors.onSurface} />
                <Txt v="h3" style={{ fontFamily: fonts.bold }}>Active & Upcoming</Txt>
              </Row>
              <Txt v="label">{active.length} assigned</Txt>
            </Row>
            {active.map((j) => (
              <Pressable key={j.id} testID={`active-job-${j.ref}`} onPress={() => router.push(`/trip/${j.id}` as any)} style={{ flexDirection: "row", gap: space.md, backgroundColor: colors.tint, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.sm, alignItems: "center" }}>
                <View style={{ width: 64, borderRadius: radius.md, backgroundColor: colors.cockpit, paddingVertical: space.sm, alignItems: "center" }}>
                  <Txt v="label" style={{ fontSize: 9 }} color={colors.surfaceTertiary}>{new Date(j.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase()}</Txt>
                  <Txt v="num" color={colors.onSurfaceInverse}>{fmtTime(j.time).split(" ")[0]}</Txt>
                  <Txt v="label" style={{ fontSize: 9 }} color={colors.surfaceTertiary}>{fmtTime(j.time).split(" ")[1]}</Txt>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt v="bodyBold" numberOfLines={1}>{j.service_name}</Txt>
                  <Txt v="caption" numberOfLines={1}>Pickup: {j.pickup_area || j.pickup}</Txt>
                  <StatusBadge status={j.status} />
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Txt v="num">{money(j.driver_payout)}</Txt>
                  <Txt v="label" style={{ fontSize: 9 }}>Est. payout</Txt>
                </View>
              </Pressable>
            ))}
          </Card>
        ) : null}

        {approved ? (
          <View style={{ gap: space.md }}>
            <SectionHead title="Booking offers" sub={p.online ? "Nearest verified drivers see new jobs first" : "Go on duty to receive jobs"} />
            {offers.isLoading ? (
              <Loader />
            ) : !(offers.data ?? []).length ? (
              <Empty icon="car-outline" title={p.online ? "No offers right now" : "You're offline"} body={p.online ? "New offers in your city will appear here." : "Go online to receive jobs."} />
            ) : (
              offers.data!.map((o) => {
                const mins = Math.max(0, Math.round((new Date(o.expires_at).getTime() - Date.now()) / 60000));
                const b = o.booking;
                const reportMins = Math.round((new Date(`${b.date}T${b.time}:00`).getTime() - Date.now()) / 60000);
                const protocols = [b.transmission === "Automatic" ? "Automatic transmission expert" : "Manual transmission", "Uniform mandatory", ...(b.notes ? [b.notes] : [])];
                return (
                  <View key={o.id} testID={`offer-${b.ref}`} style={{ backgroundColor: colors.cockpit, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cockpitBorder, overflow: "hidden" }}>
                    <Row style={{ justifyContent: "space-between", paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colors.cockpitBorder, backgroundColor: colors.cockpitCard }}>
                      <Row gap={6}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brandPrimary }} />
                        <Txt v="label" color={colors.onSurfaceInverse} style={{ fontSize: 12 }}>New duty offer</Txt>
                      </Row>
                      <Row gap={4} style={{ borderWidth: 1, borderColor: colors.brandPrimary, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Ionicons name="timer-outline" size={12} color={colors.brandPrimary} />
                        <Txt v="label" color={colors.brandPrimary}>{mins > 0 ? `${mins} min left` : "Expiring"}</Txt>
                      </Row>
                    </Row>
                    <View style={{ padding: space.lg, gap: space.md }}>
                      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1, gap: 6 }}>
                          <View style={{ alignSelf: "flex-start", borderWidth: 1, borderColor: colors.gold, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Txt v="label" style={{ fontSize: 9 }} color={colors.gold} testID={o.priority ? `offer-priority-${b.ref}` : undefined}>{o.priority ? "Priority · premium dispatch" : "Premium chauffeur dispatch"}</Txt>
                          </View>
                          <Txt v="title" color={colors.onSurfaceInverse} style={{ fontSize: 22, lineHeight: 28 }}>
                            {b.service_name} - {b.service_id === "outstation" ? `${b.days} Day(s)` : b.hours ? `${b.hours} Hours` : "Quote"}
                          </Txt>
                          <Txt v="caption" color={colors.surfaceTertiary}>{b.destination ? `To ${b.destination}` : "Flexible city itinerary"} · {b.city_id}</Txt>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Txt v="display" color={colors.onSurfaceInverse} testID={`offer-payout-${b.ref}`} style={{ fontSize: 28 }}>{money(o.payout)}</Txt>
                          <Txt v="caption" color={colors.success} style={{ fontFamily: fonts.semibold }}>Guaranteed payout</Txt>
                        </View>
                      </Row>
                      <View style={{ borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.cockpitBorder, backgroundColor: colors.cockpitCard }}>
                        <Image source={COCKPIT} style={{ width: "100%", height: 130 }} contentFit="cover" />
                        <View style={{ position: "absolute", left: 8, top: 100, backgroundColor: colors.cockpit, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Txt v="label" color={colors.onSurfaceInverse} style={{ fontSize: 10 }}>{b.transmission}</Txt>
                        </View>
                        <View style={{ padding: space.md, gap: 4 }}>
                          <Row style={{ justifyContent: "space-between" }}>
                            <Txt v="h3" color={colors.onSurfaceInverse} style={{ fontFamily: fonts.bold, flex: 1 }} numberOfLines={1}>{b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : `${b.vehicle_type} (client-owned)`}</Txt>
                            {b.vehicle?.reg_number ? (
                              <View style={{ borderWidth: 1, borderColor: colors.cockpitBorder, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                                <Txt v="label" color={colors.onSurfaceInverse}>{b.vehicle.reg_number}</Txt>
                              </View>
                            ) : null}
                          </Row>
                          <Txt v="caption" color={colors.surfaceTertiary}>Client-owned {b.vehicle_type?.toLowerCase()}. Key handover at pickup with trip-start OTP.</Txt>
                          <Row gap={4}>
                            <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                            <Txt v="caption" color={colors.surfaceTertiary}>Verified client vehicle</Txt>
                          </Row>
                        </View>
                      </View>
                      <View style={{ borderRadius: radius.md, borderWidth: 1, borderColor: colors.cockpitBorder, padding: space.md, gap: space.sm }}>
                        <Row gap={space.sm}>
                          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cockpitCard, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="location" size={18} color={colors.brandPrimary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Txt v="bodyBold" color={colors.onSurfaceInverse} numberOfLines={1}>{b.pickup_area || b.city_id}</Txt>
                            <Txt v="caption" color={colors.surfaceTertiary}>{fmtDate(b.date)}</Txt>
                          </View>
                          {o.distance_km != null ? (
                            <Txt v="caption" color={colors.success} testID={`offer-distance-${b.ref}`} style={{ fontFamily: fonts.semibold }}>
                              {o.distance_km} km away{o.rank && o.rank <= 3 ? " · nearest" : ""}
                            </Txt>
                          ) : null}
                        </Row>
                        <Row gap={6} style={{ borderWidth: 1, borderColor: colors.cockpitBorder, borderRadius: radius.sm, padding: space.sm }}>
                          <Ionicons name="time-outline" size={14} color={colors.warning} />
                          <Txt v="caption" color={colors.onSurfaceInverse} style={{ flex: 1 }}>Reporting time: <Txt v="caption" color={colors.onSurfaceInverse} style={{ fontFamily: fonts.bold }}>{fmtTime(b.time)} sharp</Txt></Txt>
                          {reportMins > 0 && reportMins < 600 ? (
                            <View style={{ backgroundColor: colors.brandTertiary, borderRadius: 4, paddingHorizontal: 6 }}>
                              <Txt v="label" color={colors.brandPrimary}>{reportMins >= 60 ? `${Math.floor(reportMins / 60)}h ${reportMins % 60}m` : `${reportMins} mins`} left</Txt>
                            </View>
                          ) : null}
                        </Row>
                      </View>
                      <Txt v="label" color={colors.surfaceTertiary}>Duty protocols & instructions</Txt>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                        {protocols.map((t) => (
                          <View key={t} style={{ borderWidth: 1, borderColor: colors.cockpitBorder, backgroundColor: colors.cockpitCard, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                            <Txt v="caption" color={colors.onSurfaceInverse}>{t}</Txt>
                          </View>
                        ))}
                      </View>
                      <Row>
                        <Btn style={{ flex: 1.6 }} icon="checkmark-circle-outline" title="ACCEPT DUTY" loading={busyId === o.id + "accept"} onPress={() => respond(o.id, "accept")} testID={`accept-offer-${b.ref}`} />
                        <Pressable testID={`decline-offer-${b.ref}`} disabled={busyId === o.id + "decline"} onPress={() => respond(o.id, "decline")} style={{ flex: 1, minHeight: 52, borderRadius: radius.md, backgroundColor: colors.cockpitCard, borderWidth: 1, borderColor: colors.cockpitBorder, alignItems: "center", justifyContent: "center" }}>
                          <Txt v="bodyBold" color={colors.onSurfaceInverse}>Decline</Txt>
                        </Pressable>
                      </Row>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : null}
        {approved ? (
          <Card style={{ gap: space.md }} testID="compliance-card">
            <Row style={{ justifyContent: "space-between" }}>
              <Row gap={6} style={{ flex: 1 }}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.onSurface} />
                <Txt v="h3" style={{ fontFamily: fonts.bold }}>Compliance & Credentials</Txt>
              </Row>
              <Tag tone={["CLEARED", "VERIFIED"].includes(police) && (licLeft ?? 1) >= 0 ? "success" : "warn"} label={["CLEARED", "VERIFIED"].includes(police) && (licLeft ?? 1) >= 0 ? "100% audited" : "Action needed"} />
            </Row>
            {[
              ["shield-outline", "Police clearance", ["CLEARED", "VERIFIED"].includes(police) ? "Verified" : police.replace("_", " ").toLowerCase(), ["CLEARED", "VERIFIED"].includes(police)],
              ["card-outline", "Driving licence", licLeft === null ? "Not on file" : licLeft < 0 ? "Expired" : `Valid till ${fmtDate(p.licence_expiry)}`, licLeft !== null && licLeft >= 0],
              ["star-outline", "Etiquette rating", `${p.rating ?? "New"} / 5.0 (${p.review_count ?? 0} ratings)`, (p.rating ?? 5) >= 4],
            ].map(([ic, t, d, ok]) => (
              <Row key={t as string} gap={space.md} style={{ backgroundColor: colors.tint, borderRadius: radius.md, padding: space.md }}>
                <View style={{ width: 34, height: 34, borderRadius: radius.sm, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={ic as any} size={18} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt v="bodyBold">{t as string}</Txt>
                  <Txt v="caption" style={{ textTransform: "capitalize" }}>{d as string}</Txt>
                </View>
                <Ionicons name={ok ? "checkmark-circle" : "alert-circle"} size={20} color={ok ? colors.success : colors.warning} />
              </Row>
            ))}
          </Card>
        ) : null}
        <Row gap={space.md} testID="dispatch-central-card" style={{ backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.errorBorder, borderRadius: radius.lg, padding: space.md }}>
          <Ionicons name="headset-outline" size={22} color={colors.brandPrimary} />
          <View style={{ flex: 1 }}>
            <Txt v="bodyBold">Prajeta 24/7 Dispatch Central</Txt>
            <Txt v="caption">Emergency? SOS alerts the safety team with your live trip.</Txt>
          </View>
          <SosQuick role="driver" />
        </Row>
      </ScrollView>
    </View>
  );
}
