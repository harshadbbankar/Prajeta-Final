import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useQuery } from "@tanstack/react-query";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/src/api";
import { ADMIN_ROLES, can, useAuth } from "@/src/auth";
import { SosBanner } from "@/src/components/SosBanner";
import { fmtDate, fmtTime, useConfig } from "@/src/hooks";
import { usesNativeTabs } from "@/src/navigation";
import { fonts, radius, space, useTheme } from "@/src/theme";
import { Bars, Btn, Card, CardTitle, Chip, ChipRow, ErrorView, IconBtn, Loader, Plate, Row, Stat, StatusBadge, Tag, Txt, money } from "@/src/ui";

export const PERIODS = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "7 days"],
  ["30d", "30 days"],
  ["month", "This month"],
  ["prev_month", "Last month"],
  ["quarter", "Quarter"],
  ["fy", "FY"],
  ["all", "All time"],
];

const QUEUE_TABS = [
  ["AWAITING_ASSIGNMENT,ASSIGNED,PAYMENT_PENDING,ACCEPTED,DRIVER_ARRIVED,IN_PROGRESS", "All bookings"],
  ["AWAITING_ASSIGNMENT", "Unassigned"],
  ["ACCEPTED,DRIVER_ARRIVED,IN_PROGRESS", "En route / active"],
  ["PAYMENT_PENDING", "Advance pending"],
];

export default function AdminDashboard() {
  const { user, ready } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cfg = useConfig();
  const [period, setPeriod] = useState("30d");
  const [city, setCity] = useState("");
  const [qtab, setQtab] = useState(0);
  const isAdmin = !!user && ADMIN_ROLES.includes(user.role);
  const q = useQuery({ queryKey: ["admin-dash", period, city], queryFn: () => api<any>(`/admin/dashboard?period=${period}&city_id=${city}`), enabled: isAdmin });
  const exc = useQuery({
    queryKey: ["admin-exceptions", city, qtab],
    queryFn: () => api<any[]>(`/admin/bookings?status=${QUEUE_TABS[qtab][0]}&city_id=${city}`),
    enabled: isAdmin && can(user!.role, "dispatch"),
  });
  const kyc = useQuery({ queryKey: ["admin-kyc"], queryFn: () => api<any[]>(`/admin/drivers?status=SUBMITTED`), enabled: isAdmin && can(user!.role, "drivers") });
  if (!ready) return <Loader />;
  if (!user || !isAdmin) return <Redirect href="/login" />;
  const d = q.data;
  const wide = width >= 1024;
  const cityName = (cfg.data?.cities ?? []).find((c) => c.id === city)?.name;
  const fulfil = d ? Math.round(d.completion_rate) : 0;
  const util = d && d.drivers_approved ? Math.round((d.drivers_available / d.drivers_approved) * 1000) / 10 : 0;
  const rows = exc.data ?? [];

  const queue = can(user.role, "dispatch") ? (
    <Card style={{ gap: 0, padding: 0, overflow: "hidden", flex: wide ? 1.6 : undefined, width: wide ? undefined : "100%" }} testID="exception-board">
      <View style={{ padding: space.lg, gap: space.md }}>
        <View>
          <Txt v="h2" style={{ fontFamily: fonts.bold }}>Live Dispatch Queue</Txt>
          <Txt v="caption">Real-time driver allocation & chauffeur manifests</Txt>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
          {QUEUE_TABS.map(([, l], i) => {
            const on = qtab === i;
            const red = i === 1;
            return (
              <Pressable key={l} testID={`queue-tab-${i}`} onPress={() => setQtab(i)} style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1, justifyContent: "center", borderColor: on ? colors.onSurface : red ? colors.errorBorder : colors.border, backgroundColor: on ? colors.tint : red ? colors.brandTertiary : colors.surface }}>
                <Txt v="bodyBold" style={{ fontSize: 13 }} color={red && !on ? colors.brandPrimary : colors.onSurface}>
                  {l}
                  {on ? ` · ${rows.length}` : ""}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {rows.slice(0, 8).map((b) => {
        const unassigned = b.status === "AWAITING_ASSIGNMENT";
        return (
          <Pressable key={b.id} testID={`exception-${b.ref}`} onPress={() => router.push(`/erp/booking/${b.id}` as any)} style={({ pressed }) => ({ paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: colors.border, borderLeftWidth: unassigned ? 4 : 0, borderLeftColor: colors.brandPrimary, gap: space.sm, backgroundColor: pressed ? colors.tint : unassigned ? colors.brandTertiary : colors.surface })}>
            <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
              <Row gap={6} style={{ flex: 1, flexWrap: "wrap" }}>
                <Txt v="bodyBold" style={{ fontFamily: fonts.bold }}>#{b.ref}</Txt>
                <StatusBadge status={b.status} />
                <Tag tone="tint" label={b.service_name} />
              </Row>
              <Txt v="num">{b.fare?.total ? money(b.fare.total) : "Quote"}</Txt>
            </Row>
            <Row style={{ alignItems: "flex-start" }} gap={space.md}>
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={6}>
                  <Ionicons name="person-outline" size={14} color={colors.onSurfaceSecondary} />
                  <Txt v="bodyBold" numberOfLines={1} style={{ flex: 1 }}>{b.customer_name ?? "Customer"}</Txt>
                </Row>
                <Row gap={6}>
                  <Ionicons name="car-outline" size={14} color={colors.muted} />
                  {b.vehicle?.reg_number ? <Plate reg={b.vehicle.reg_number} /> : null}
                  <Txt v="caption" numberOfLines={1} style={{ flex: 1 }}>{b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : b.vehicle_type} ({b.transmission})</Txt>
                </Row>
                <Txt v="caption" numberOfLines={1}>Pickup: {b.pickup} · {fmtDate(b.date)} {fmtTime(b.time)}</Txt>
              </View>
              {unassigned ? (
                <View style={{ alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                  <Tag tone="brand" label="No driver assigned" />
                  <Btn small variant="dark" icon="person-add-outline" title="Quick Assign" onPress={() => router.push(`/erp/booking/${b.id}` as any)} testID={`quick-assign-${b.ref}`} />
                </View>
              ) : b.driver_name ? (
                <View style={{ alignItems: "flex-end", maxWidth: "40%" }}>
                  <Txt v="bodyBold" numberOfLines={1}>{b.driver_name}</Txt>
                  <Txt v="caption" color={colors.successText}>Police verified</Txt>
                </View>
              ) : null}
            </Row>
          </Pressable>
        );
      })}
      {!rows.length ? <Txt v="caption" style={{ padding: space.lg, borderTopWidth: 1, borderTopColor: colors.border }}>Queue is clear.</Txt> : null}
      <Row style={{ justifyContent: "space-between", backgroundColor: colors.tint, paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Txt v="caption">Showing {Math.min(8, rows.length)} of {rows.length} bookings</Txt>
        <Pressable onPress={() => router.push("/admin/bookings")} testID="open-global-dispatch">
          <Txt v="bodyBold">Open global dispatch →</Txt>
        </Pressable>
      </Row>
    </Card>
  ) : null;

  const side = (
    <View style={{ gap: space.lg, flex: wide ? 1 : undefined }}>
      {can(user.role, "drivers") ? (
        <Card style={{ gap: space.md, padding: 0, overflow: "hidden" }} testID="kyc-queue-card">
          <Row style={{ backgroundColor: colors.cockpit, padding: space.lg, justifyContent: "space-between" }}>
            <Row gap={6} style={{ flex: 1 }}>
              <Ionicons name="shield-checkmark" size={18} color={colors.brandPrimary} />
              <Txt v="h3" color={colors.onSurfaceInverse} style={{ fontFamily: fonts.bold }}>Driver Vetting & KYC</Txt>
            </Row>
            <View testID="kpi-drivers-pending" style={{ borderWidth: 1, borderColor: colors.success, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Txt v="label" color={colors.success}>{d?.drivers_pending ?? 0} pending</Txt>
            </View>
          </Row>
          <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
            {(kyc.data ?? []).slice(0, 4).map((x) => (
              <Row key={x.user_id ?? x.id} gap={space.md} style={{ backgroundColor: colors.tint, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.md }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cockpit, alignItems: "center", justifyContent: "center" }}>
                  <Txt v="bodyBold" color={colors.onSurfaceInverse}>{(x.name ?? "D").split(" ").map((w: string) => w[0]).slice(0, 2).join("")}</Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt v="bodyBold">{x.name}</Txt>
                  <Txt v="caption" numberOfLines={1}>DL: {x.licence_number || "—"} · {x.experience_years ?? 0} yrs</Txt>
                </View>
                <Btn small variant="dark" title="Audit" onPress={() => router.push(`/erp/driver/${x.user_id}` as any)} testID={`kyc-audit-${x.user_id}`} />
              </Row>
            ))}
            {!(kyc.data ?? []).length ? <Txt v="caption">No applications waiting.</Txt> : null}
          </View>
          <View style={{ padding: space.lg, paddingTop: 0 }}>
            <Btn small variant="outline" title="Verify drivers" icon="shield-checkmark-outline" onPress={() => router.push("/admin/drivers")} testID="dash-drivers-link" />
          </View>
        </Card>
      ) : null}
      <Card style={{ gap: space.md }}>
        <CardTitle icon="bar-chart-outline" title="Bookings trend" right={<Txt v="caption">{d?.trend?.length ?? 0} days</Txt>} />
        {d?.trend?.length ? <Bars color={colors.cockpit} data={d.trend.slice(-20).map((t: any) => ({ label: t.date.slice(8), value: t.bookings }))} /> : <Txt v="caption">No data for this period</Txt>}
      </Card>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View style={{ paddingTop: insets.top + space.sm, paddingBottom: space.sm, paddingHorizontal: space.lg, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", alignItems: "center", gap: space.sm }}>
        <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="shield-checkmark" size={20} color={colors.onBrandPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="h3" style={{ fontFamily: fonts.extrabold }} color={colors.brandPrimary}>PRAJETA ERP</Txt>
          <View style={{ alignSelf: "flex-start", backgroundColor: colors.tint, borderRadius: 4, paddingHorizontal: 6 }}>
            <Txt v="label" style={{ fontSize: 9 }}>{cityName ?? "All cities"} · {user.role.replace("_", " ")}</Txt>
          </View>
        </View>
        {wide && d ? (
          <Row gap={space.md} style={{ backgroundColor: colors.tint, borderRadius: radius.pill, paddingHorizontal: space.md, minHeight: 40 }}>
            <Row gap={4}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }} />
              <Txt v="caption" style={{ color: colors.onSurface }}>Live operations</Txt>
            </Row>
            <Txt v="caption" style={{ color: colors.onSurface }}>
              <Txt v="bodyBold">{d.drivers_available}</Txt> drivers online
            </Txt>
            <Txt v="caption" style={{ color: colors.onSurface }}>
              <Txt v="bodyBold">{d.active_trips}</Txt> dispatches in progress
            </Txt>
          </Row>
        ) : null}
        {can(user.role, "dispatch") ? (
          <Pressable testID="emergency-dispatch-button" onPress={() => router.push("/erp/sos" as any)} style={{ minHeight: 40, borderRadius: radius.md, backgroundColor: colors.cockpit, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="radio-outline" size={16} color={colors.brandPrimary} />
            {width >= 400 ? <Txt v="caption" color={colors.onSurfaceInverse} style={{ fontFamily: fonts.bold }}>Emergency</Txt> : null}
          </Pressable>
        ) : null}
        {can(user.role, "dispatch") ? <IconBtn icon="add-circle-outline" bordered onPress={() => router.push("/admin/bookings")} testID="admin-manual-booking" /> : null}
        <IconBtn icon="notifications-outline" bordered onPress={() => router.push("/notifications")} testID="admin-notifications-button" />
      </View>
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ChipRow testID="dashboard-period-row">
          {PERIODS.map(([k, l]) => (
            <Chip key={k} label={l} selected={period === k} onPress={() => setPeriod(k)} testID={`period-${k}`} />
          ))}
        </ChipRow>
      </View>
      {q.isLoading ? (
        <Loader label="Loading metrics…" />
      ) : q.error ? (
        <ErrorView message={(q.error as any).message} onRetry={() => q.refetch()} />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { q.refetch(); exc.refetch(); kyc.refetch(); }} />}
          contentContainerStyle={{ paddingBottom: (usesNativeTabs ? insets.bottom : 0) + space.xl, gap: space.lg }}
        >
          <ChipRow>
            <Chip label="All cities" selected={!city} onPress={() => setCity("")} testID="dash-city-all" />
            {(cfg.data?.cities ?? []).map((c) => (
              <Chip key={c.id} label={c.name} selected={city === c.id} onPress={() => setCity(c.id)} testID={`dash-city-${c.id}`} />
            ))}
          </ChipRow>
          <View style={{ paddingHorizontal: space.lg, gap: space.lg, maxWidth: 1536, width: "100%", alignSelf: "center" }}>
            <SosBanner />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }} testID="executive-briefing-card">
              <Kpi testID="kpi-gbv" label="Gross booking value (GBV)" icon="cash-outline" wide={wide}>
                <Txt v="numLg">{money(d.gbv)}</Txt>
                <Row gap={6}>
                  <Tag tone="success" icon="trending-up" label={`${d.bookings} bookings`} />
                </Row>
                <Txt v="caption">Collected {money(d.collections)} · due {money(d.receivables)}</Txt>
              </Kpi>
              <Kpi testID="kpi-completed" label="Duty fulfilment rate" icon="checkmark-circle-outline" wide={wide}>
                <Row style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
                  <Txt v="numLg">
                    {d.completed}
                    <Txt v="caption"> / {d.bookings}</Txt>
                  </Txt>
                  <Txt v="num" color={colors.successText}>{fulfil}%</Txt>
                </Row>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.tint, overflow: "hidden" }}>
                  <View style={{ width: `${Math.min(100, fulfil)}%`, height: 6, backgroundColor: colors.success }} />
                </View>
                <Txt v="caption">{d.cancellation_rate}% cancelled</Txt>
              </Kpi>
              <Kpi testID="kpi-drivers-online" label="Fleet driver utilization" icon="speedometer-outline" wide={wide}>
                <Row gap={6}>
                  <Txt v="numLg">{util}%</Txt>
                  <Tag tone="outline" label={util >= 50 ? "Optimal" : "Low"} />
                </Row>
                <Txt v="caption">{d.drivers_available} of {d.drivers_approved} approved drivers on duty</Txt>
              </Kpi>
              <View testID="kpi-pending-assignment" style={{ flexBasis: wide ? "23%" : "46%", flexGrow: 1, backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.errorBorder, borderRadius: radius.lg, padding: space.md, gap: 6 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <Row gap={4} style={{ flex: 1 }}>
                    <Ionicons name="alert-circle-outline" size={14} color={colors.brandPrimary} />
                    <Txt v="label" color={colors.brandPrimary}>Dispatch alert</Txt>
                  </Row>
                  {d.pending_assignment ? (
                    <View style={{ backgroundColor: colors.brandPrimary, borderRadius: 4, paddingHorizontal: 6 }}>
                      <Txt v="label" style={{ fontSize: 9 }} color={colors.onBrandPrimary}>Urgent</Txt>
                    </View>
                  ) : null}
                </Row>
                <Txt v="h3" style={{ fontFamily: fonts.bold }}>{d.pending_assignment} Unassigned Bookings</Txt>
                <Txt v="caption" color={colors.brandPrimary}>{d.pending_payments} awaiting advance · {d.quotes_pending} quotes pending</Txt>
                {can(user.role, "dispatch") ? <Btn small variant="dark" icon="flash" title="Assign Priority Driver" onPress={() => setQtab(1)} testID="dash-dispatch-link" /> : null}
              </View>
            </View>

            <View style={{ flexDirection: wide ? "row" : "column", gap: space.lg, alignItems: wide ? "flex-start" : "stretch" }}>
              {queue}
              {side}
            </View>

            <Card style={{ gap: space.md }} testID="action-plan-card">
              <Row style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                <Row gap={6}>
                  <Ionicons name="trending-up" size={20} color={colors.onSurface} />
                  <Txt v="h3" style={{ fontFamily: fonts.bold }}>Executive Action Plan</Txt>
                </Row>
                <Tag tone="tint" label="Live recommendations" />
              </Row>
              <View style={{ flexDirection: wide ? "row" : "column", gap: space.md }}>
                <ActionCard
                  tone="brand"
                  kicker={d.pending_assignment ? "Demand spike identified" : "Dispatch healthy"}
                  title={d.pending_assignment ? `Assign ${d.pending_assignment} waiting booking(s) now` : "All confirmed bookings have drivers"}
                  body={`${d.drivers_available} drivers are on duty. Assigning quickly prevents cancellations and keeps your ${d.completion_rate}% fulfilment rate.`}
                  foot={`Pending GBV: ${money(d.receivables)}`}
                  cta="Open dispatch"
                  onPress={() => router.push("/admin/bookings")}
                  testID="action-dispatch"
                />
                <ActionCard
                  tone="warn"
                  kicker="Fleet skill gap warning"
                  title={d.drivers_pending ? `Approve ${d.drivers_pending} pending driver application(s)` : "No driver applications waiting"}
                  body={`${d.drivers_approved} approved of ${d.drivers_registered} registered drivers. ${d.licences_expired ?? 0} licence(s) expired.`}
                  foot={`${d.open_tickets} open support tickets`}
                  cta="Review drivers"
                  onPress={() => router.push("/admin/drivers")}
                  testID="action-drivers"
                  primary
                />
              </View>
              {can(user.role, "owner") ? <Btn small variant="outline" icon="document-text-outline" title="Executive P&L" onPress={() => router.push("/erp/owner")} testID="dash-owner-link" style={{ alignSelf: "flex-start" }} /> : null}
            </Card>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md }}>
              <Stat label="New bookings" value={String(d.new_bookings)} testID="kpi-new-bookings" />
              <Stat label="Cancelled" value={String(d.cancelled)} sub={`${d.cancellation_rate}%`} testID="kpi-cancelled" />
              <Stat label="Confirmed (live)" value={String(d.confirmed)} />
              <Stat label="Active trips" value={String(d.active_trips)} testID="kpi-active-trips" />
              <Stat label="Driver payouts" value={money(d.payouts)} />
              <Stat label="Open tickets" value={String(d.open_tickets)} testID="kpi-open-tickets" />
              <Stat label="Customers" value={String(d.customers_total)} />
              <Stat label="New enquiries" value={String(d.new_enquiries)} />
            </View>
            {d.licences_expired && can(user.role, "licences") ? <Btn small variant="soft" title={`${d.licences_expired} licence(s) expired`} icon="id-card" onPress={() => router.push("/erp/licences")} testID="dash-licences-link" style={{ alignSelf: "flex-start" }} /> : null}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Kpi({ label, icon, children, testID, wide }: { label: string; icon: string; children: React.ReactNode; testID?: string; wide?: boolean }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ flexBasis: wide ? "23%" : "46%", flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.md, gap: 6 }}>
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Txt v="label" style={{ flex: 1 }}>{label}</Txt>
        <Ionicons name={icon as any} size={16} color={colors.onSurface} />
      </Row>
      {children}
    </View>
  );
}

function ActionCard({ tone, kicker, title, body, foot, cta, onPress, testID, primary }: { tone: "brand" | "warn"; kicker: string; title: string; body: string; foot: string; cta: string; onPress: () => void; testID: string; primary?: boolean }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: space.md, gap: space.sm, backgroundColor: colors.surface }}>
      <Txt v="label" color={tone === "brand" ? colors.brandPrimary : colors.warningText}>{kicker}</Txt>
      <Txt v="h3" style={{ fontFamily: fonts.bold }}>{title}</Txt>
      <Txt v="caption">{body}</Txt>
      <Row style={{ justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space.sm, marginTop: 4 }}>
        <Txt v="caption" style={{ flex: 1 }}>{foot}</Txt>
        <Btn small variant={primary ? "primary" : "dark"} title={cta} onPress={onPress} testID={`${testID}-cta`} />
      </Row>
    </View>
  );
}
