export type EventStatus =
  | "draft"
  | "pending"
  | "needs_revision"
  | "approved"
  | "cancelled";

export interface DemoEvent {
  id: string;
  name: string;
  entity: string;
  entityType: string;
  facility: string;
  date: string;
  startTime: string;
  endTime: string;
  status: EventStatus;
  gradeLevel: "MS" | "HS" | "Both";
  audience: string[];
  expectedAttendance: number;
  description: string;
  staffingNeeds: string;
  marketingNeeded: boolean;
  notes: string;
  rejectionReason?: string;
  marketingRequest?: {
    type: string;
    details: string;
    targetAudience: string;
    priority: "standard" | "urgent";
  };
  approvalChain: Array<{
    step: number;
    label: string;
    status: "approved" | "pending" | "rejected";
  }>;
}

export const summaryCards = [
  {
    title: "My Pending Events",
    value: "4",
    detail: "2 awaiting Step 1, 2 awaiting final approval",
  },
  {
    title: "Awaiting My Approval",
    value: "3",
    detail: "House and athletics requests surfaced today",
  },
  {
    title: "Approved This Month",
    value: "12",
    detail: "Approved events now visible on the internal calendar",
  },
];

export const recentActivity = [
  "STEM Expo submitted by Science Department for March 18.",
  "House assembly moved to Step 2 after mentor approval.",
  "Facilities Director copied on the Athletics showcase request.",
  "Marketing request added for Spring Qur'an Showcase collateral.",
];

export const demoEvents: DemoEvent[] = [
  {
    id: "event-1",
    name: "Spring Qur'an Showcase",
    entity: "Qur'an Department",
    entityType: "HS Department",
    facility: "Auditorium",
    date: "2026-03-18",
    startTime: "18:00",
    endTime: "20:00",
    status: "pending",
    gradeLevel: "HS",
    audience: ["Students", "Parents"],
    expectedAttendance: 220,
    description:
      "An evening program celebrating memorization milestones and recitation.",
    staffingNeeds: "Stage setup, ushering, audio support",
    marketingNeeded: true,
    notes: "Principal requested final run-of-show one week in advance.",
    marketingRequest: {
      type: "Slide Deck",
      details: "Design an assembly slide and parent reminder graphic.",
      targetAudience: "Parents",
      priority: "standard",
    },
    approvalChain: [
      {
        step: 1,
        label: "Department Head",
        status: "approved",
      },
      {
        step: 2,
        label: "HS Principal",
        status: "pending",
      },
    ],
  },
  {
    id: "event-2",
    name: "House of Khadijah Service Day",
    entity: "League of Stars",
    entityType: "House",
    facility: "Main Field",
    date: "2026-03-22",
    startTime: "09:00",
    endTime: "12:00",
    status: "needs_revision",
    gradeLevel: "Both",
    audience: ["Students", "Staff"],
    expectedAttendance: 140,
    description:
      "Outdoor service challenge with grade-based rotations and mentor check-ins.",
    staffingNeeds: "Field supervision, hydration station, cleanup",
    marketingNeeded: false,
    notes: "Re-submit after adjusting the schedule around dismissal traffic.",
    rejectionReason: "Please avoid the 11:30 overlap with transportation flow.",
    approvalChain: [
      {
        step: 1,
        label: "House Mentor",
        status: "rejected",
      },
      {
        step: 2,
        label: "Tarbiyah Director",
        status: "pending",
      },
      {
        step: 3,
        label: "HS Principal",
        status: "pending",
      },
    ],
  },
  {
    id: "event-3",
    name: "Varsity Athletics Showcase",
    entity: "Athletics",
    entityType: "Athletics",
    facility: "Gym",
    date: "2026-03-27",
    startTime: "16:30",
    endTime: "18:00",
    status: "approved",
    gradeLevel: "HS",
    audience: ["Students", "Parents", "External"],
    expectedAttendance: 300,
    description:
      "Showcase event for spring athletics teams with family attendance.",
    staffingNeeds: "Scoreboard, seating setup, security walkthrough",
    marketingNeeded: true,
    notes: "Approved and ready for calendar publication.",
    marketingRequest: {
      type: "Video",
      details: "Capture a short highlight reel for school channels.",
      targetAudience: "Mixed",
      priority: "urgent",
    },
    approvalChain: [
      {
        step: 1,
        label: "Coach",
        status: "approved",
      },
      {
        step: 2,
        label: "Athletic Director",
        status: "approved",
      },
      {
        step: 3,
        label: "HS Principal",
        status: "approved",
      },
    ],
  },
];

export const calendarEvents = [
  {
    date: 5,
    title: "Science Lab Night",
    facility: "Library",
  },
  {
    date: 12,
    title: "MS Math Bee",
    facility: "MPH",
  },
  {
    date: 18,
    title: "Qur'an Showcase",
    facility: "Auditorium",
  },
  {
    date: 27,
    title: "Athletics Showcase",
    facility: "Gym",
  },
];

export const approvalQueue = [
  {
    id: "approval-1",
    eventId: "event-1",
    eventName: "Spring Qur'an Showcase",
    submitter: "Amina Yusuf",
    entity: "Qur'an Department",
    date: "Mar 18, 2026",
  },
  {
    id: "approval-2",
    eventId: "event-3",
    eventName: "Varsity Athletics Showcase",
    submitter: "Coach Kareem",
    entity: "Athletics",
    date: "Mar 27, 2026",
  },
];

export const adminUsers = [
  {
    name: "Moneeb Sarmad",
    email: "moneeb@bhaprep.org",
    role: "admin",
    entity: "System",
    status: "Active",
  },
  {
    name: "Amina Yusuf",
    email: "amina@bhaprep.org",
    role: "submitter",
    entity: "Qur'an Department",
    status: "Active",
  },
  {
    name: "Coach Kareem",
    email: "kareem@bhaprep.org",
    role: "approver",
    entity: "Athletics",
    status: "Active",
  },
];

export const adminEntities = [
  {
    name: "HOSA",
    type: "Club",
    head: "Sr. Adviser",
  },
  {
    name: "House of Khadijah",
    type: "House",
    head: "House Mentor",
  },
  {
    name: "Qur'an Department",
    type: "Department",
    head: "Department Head",
  },
];

export const adminFacilities = [
  {
    name: "Auditorium",
    capacity: 350,
    status: "Active",
  },
  {
    name: "Gym",
    capacity: 280,
    status: "Active",
  },
  {
    name: "Conference Room",
    capacity: 18,
    status: "Active",
  },
];
