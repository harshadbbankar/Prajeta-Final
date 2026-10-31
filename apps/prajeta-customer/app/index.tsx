import { Redirect } from "expo-router";

import { APP_ROLES, useAuth } from "@/src/auth";
import { Loader } from "@/src/ui";

/** Prajeta Customer app entry: signed-in customers go home; other roles are signed out at login. */
export default function Index() {
  const { user, ready } = useAuth();
  if (!ready) return <Loader />;
  return <Redirect href={user && APP_ROLES.includes(user.role) ? "/customer" : "/login"} />;
}
