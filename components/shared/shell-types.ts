export type ShellRole = "staff" | "approver" | "viewer" | "admin";

export interface ShellUser {
  id: string;
  name: string;
  email: string;
  role: ShellRole;
  title: string | null;
  active: boolean;
}
