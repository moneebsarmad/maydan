export type UserRole = "submitter" | "approver" | "viewer" | "admin";
export type EntityType = "club" | "house" | "department" | "athletics";
export type GradeLevel = "MS" | "HS" | "Both";
export type EventStatus =
  | "draft"
  | "pending"
  | "needs_revision"
  | "approved"
  | "cancelled";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type MarketingPriority = "standard" | "urgent";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string | null;
  entity_id: string | null;
  active: boolean | null;
  created_at: string | null;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  grade_level: GradeLevel | null;
  head_user_id: string | null;
  created_at: string | null;
}

export interface Facility {
  id: string;
  name: string;
  capacity: number | null;
  notes: string | null;
  active: boolean | null;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  facility_id: string | null;
  facility_notes: string | null;
  description: string | null;
  audience: string[] | null;
  grade_level: GradeLevel | null;
  expected_attendance: number | null;
  staffing_needs: string | null;
  marketing_needed: boolean | null;
  status: EventStatus | null;
  submitter_id: string | null;
  entity_id: string | null;
  current_step: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ApprovalStep {
  id: string;
  event_id: string | null;
  approver_id: string | null;
  step_number: number;
  status: ApprovalStatus | null;
  reason: string | null;
  suggested_date: string | null;
  suggested_start_time: string | null;
  actioned_at: string | null;
  created_at: string | null;
}

export interface MarketingRequest {
  id: string;
  event_id: string | null;
  type: string;
  details: string | null;
  target_audience: string | null;
  priority: MarketingPriority | null;
  file_url: string | null;
  created_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string | null;
  event_id: string | null;
  message: string;
  read: boolean | null;
  created_at: string | null;
}
