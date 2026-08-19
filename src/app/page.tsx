import { redirect } from "next/navigation";

import { getCurrentSession } from "@/server/auth/session";

export default async function HomePage() {
  redirect((await getCurrentSession()) ? "/dashboard" : "/login");
}
