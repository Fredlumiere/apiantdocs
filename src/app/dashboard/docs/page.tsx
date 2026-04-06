import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { DocManager } from "@/components/doc-manager";

export default async function DashboardDocsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  return <DocManager />;
}
