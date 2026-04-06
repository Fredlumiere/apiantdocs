import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { DocEditor } from "@/components/doc-editor";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function EditDocPage({ params }: Props) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const { slug } = await params;
  const fullSlug = slug.join("/");

  return <DocEditor slug={fullSlug} />;
}
