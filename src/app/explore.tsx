import { Redirect } from "expo-router";

/** Legacy template route kept as a safe redirect for old development links. */
export default function ExploreRedirect() {
  return <Redirect href="/help" />;
}
