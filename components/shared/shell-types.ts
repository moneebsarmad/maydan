export type ShellRole = "submitter" | "approver" | "viewer" | "admin";

export interface ShellUser {
  id: string;
  name: string;
  email: string;
  role: ShellRole;
  active: boolean;
}
