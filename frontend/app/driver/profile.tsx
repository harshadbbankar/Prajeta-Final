import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";

import { api } from "@/src/api";
import { DriverAvatar, DriverPhotoCard } from "@/src/components/DriverPhotoCard";
import { MyRatings } from "@/src/components/MyRatings";
import { space } from "@/src/theme";
import { Btn, Card, Row, StatusBadge, Txt } from "@/src/ui";
import { ProfileScreen } from "@/src/components/ProfileScreen";

export default function DriverProfile() {
  const q = useQuery({ queryKey: ["driver-profile"], queryFn: () => api<any>("/driver/profile") });
  return (
    <ProfileScreen
      avatar={<DriverAvatar profile={q.data} size={60} testID="profile-driver-avatar" />}
      extra={
        <>
        <MyRatings />
        <DriverPhotoCard />
        <Card style={{ gap: space.sm }}>
          <Row style={{ justifyContent: "space-between" }}>
            <Txt v="h3">Driver application</Txt>
            {q.data ? <StatusBadge status={q.data.status} /> : null}
          </Row>
          <Txt v="caption">Rating ★ {q.data?.rating ?? "—"} · {q.data?.experience_years ?? 0} yrs experience</Txt>
          <Row>
            <Btn small style={{ flex: 1 }} variant="outline" title="Documents & details" testID="driver-documents-button" onPress={() => router.push("/driver-onboarding")} />
            <Btn small style={{ flex: 1 }} variant="outline" title="Support" testID="driver-support-button" onPress={() => router.push("/support")} />
          </Row>
        </Card>
        </>
      }
    />
  );
}
