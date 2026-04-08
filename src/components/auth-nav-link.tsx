"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function AuthNavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const { user } = useAuth();
  if (!user) return null;
  return <Link href={href} className={className}>{children}</Link>;
}
