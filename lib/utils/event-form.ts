import { z } from "zod";

export const marketingTypes = [
  "Social Media",
  "Flyer",
  "Video",
  "Slide Deck",
  "Other",
] as const;

export const audienceOptions = [
  "Students",
  "Staff",
  "Parents",
  "External",
  "Mixed",
] as const;

export const gradeLevelOptions = ["MS", "HS", "Both"] as const;

const optionalTrimmedString = z.preprocess((value) => {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}, z.string().optional());

const optionalPositiveInteger = z.preprocess((value) => {
  const normalizedValue = String(value ?? "").trim();

  if (!normalizedValue) {
    return undefined;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : value;
}, z.number().int().positive().optional());

export const eventFormSchema = z
  .object({
    name: z.string().trim().min(1, "Event name is required."),
    date: z.string().min(1, "Date is required."),
    startTime: z.string().min(1, "Start time is required."),
    endTime: z.string().min(1, "End time is required."),
    facilityId: z.string().min(1, "Facility is required."),
    facilityNotes: optionalTrimmedString,
    description: z.string().trim().min(1, "Description is required."),
    audience: z.array(z.string()).min(1, "Select at least one audience."),
    gradeLevel: z.enum(gradeLevelOptions, {
      required_error: "Grade level is required.",
    }),
    expectedAttendance: optionalPositiveInteger,
    staffingNeeds: optionalTrimmedString,
    marketingNeeded: z.boolean(),
    marketingType: z.enum(marketingTypes).optional(),
    marketingDetails: optionalTrimmedString,
    marketingAudience: optionalTrimmedString,
    marketingPriority: z.enum(["standard", "urgent"]).optional(),
  })
  .superRefine((values, ctx) => {
    if (!isLaterTime(values.startTime, values.endTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be later than start time.",
        path: ["endTime"],
      });
    }

    if (values.marketingNeeded) {
      if (!values.marketingType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a marketing type.",
          path: ["marketingType"],
        });
      }

      if (!values.marketingDetails) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Request details are required when marketing is needed.",
          path: ["marketingDetails"],
        });
      }
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;

function isLaterTime(startTime: string, endTime: string) {
  return endTime > startTime;
}
