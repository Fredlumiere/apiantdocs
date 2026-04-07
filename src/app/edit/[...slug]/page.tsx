"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { DocEditor } from "@/components/doc-editor";

export default function EditDocPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [ready, setReady] = useState(false);

  const slugParts = params.slug as string[];
  const fullSlug = slugParts?.join("/") || "";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?next=/edit/${fullSlug}`);
      return;
    }
    setReady(true);
  }, [user, authLoading, router, fullSlug]);

  if (authLoading || !ready) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        color: "var(--text-tertiary)",
      }}>
        Loading...
      </div>
    );
  }

  return <DocEditor slug={fullSlug} />;
}
