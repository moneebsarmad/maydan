"use client";

import { createContext, useContext } from "react";
import type { ShellUser } from "@/components/shared/shell-types";

const AuthContext = createContext<ShellUser | null>(null);

export function AuthProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: ShellUser;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useCurrentUser() {
  const user = useContext(AuthContext);

  if (!user) {
    throw new Error("useCurrentUser must be used within an AuthProvider.");
  }

  return user;
}
