"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { saveDraft, submitEvent } from "@/app/(dashboard)/events/actions";
import { AppToast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import {
  audienceOptions,
  eventFormSchema,
  gradeLevelOptions,
  marketingTypes,
  type EventFormValues,
} from "@/lib/utils/event-form";

interface EventSubmissionFormProps {
  entityName: string;
  facilities: Array<{
    id: string;
    name: string;
  }>;
}

interface ToastState {
  title: string;
  description: string;
  variant: "success" | "error" | "info";
}

export function EventSubmissionForm({
  entityName,
  facilities,
}: EventSubmissionFormProps) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"submit" | "draft" | null>(
    null,
  );
  const [marketingFile, setMarketingFile] = useState<File | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      audience: [],
      facilityId: "",
      marketingNeeded: false,
      marketingPriority: "standard",
      gradeLevel: "HS",
    },
  });

  const marketingNeeded = watch("marketingNeeded");
  const selectedFacility = watch("facilityId");
  const selectedAudience = watch("audience") ?? [];
  const classroomFacilityId =
    facilities.find((facility) => facility.name === "Classroom")?.id ?? null;

  const runAction = (
    action: "submit" | "draft",
    values: EventFormValues,
  ) => {
    setPendingAction(action);
    setToast(null);

    startTransition(async () => {
      const result =
        action === "submit" ? await submitEvent(values) : await saveDraft(values);

      if (!result.success) {
        setToast({
          variant: "error",
          title: action === "submit" ? "Submission failed" : "Draft save failed",
          description: result.error,
        });
        setPendingAction(null);
        return;
      }

      let destination = `/events/${result.eventId}`;

      if (values.marketingNeeded && marketingFile) {
        try {
          await uploadMarketingFile({
            supabase,
            eventId: result.eventId,
            file: marketingFile,
          });
        } catch {
          destination = `/events/${result.eventId}?upload=failed`;
        }
      }

      setToast({
        variant: "success",
        title: action === "submit" ? "Event submitted" : "Draft saved",
        description:
          action === "submit"
            ? "The event was routed to the first approver successfully."
            : "The event was saved as a draft without entering the approval chain.",
      });
      router.push(destination);
    });
  };

  return (
    <div className="space-y-6">
      {toast ? (
        <AppToast
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
        />
      ) : null}

      <form
        className="space-y-8 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit((values) => runAction("submit", values))}
      >
        <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
            Submitting entity
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{entityName}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Event name</Label>
            <Input id="name" placeholder="Enter the event name" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register("date")} />
            <FieldError message={errors.date?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
              <FieldError message={errors.startTime?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End time</Label>
              <Input id="endTime" type="time" {...register("endTime")} />
              <FieldError message={errors.endTime?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facilityId">Facility</Label>
            <select
              id="facilityId"
              className="flex h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
              {...register("facilityId")}
            >
              <option value="">Select a facility</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.facilityId?.message} />
          </div>

          {selectedFacility === classroomFacilityId ? (
            <div className="space-y-2">
              <Label htmlFor="facilityNotes">Classroom notes</Label>
              <Input
                id="facilityNotes"
                placeholder="Specify room number"
                {...register("facilityNotes")}
              />
              <FieldError message={errors.facilityNotes?.message} />
            </div>
          ) : null}

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the event, objective, and flow"
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label>Target audience</Label>
            <div className="flex flex-wrap gap-3">
              {audienceOptions.map((option) => {
                const checked = selectedAudience.includes(option);

                return (
                  <label
                    className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-sm text-stone-700"
                    key={option}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      className="h-4 w-4 rounded border-stone-300"
                      onChange={(event) => {
                        const nextValues = event.target.checked
                          ? [...selectedAudience, option]
                          : selectedAudience.filter((value) => value !== option);

                        setValue("audience", nextValues, {
                          shouldValidate: true,
                        });
                      }}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
            <FieldError message={errors.audience?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradeLevel">Grade level</Label>
            <select
              id="gradeLevel"
              className="flex h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
              {...register("gradeLevel")}
            >
              {gradeLevelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FieldError message={errors.gradeLevel?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedAttendance">Expected attendance</Label>
            <Input
              id="expectedAttendance"
              type="number"
              min={1}
              placeholder="Estimated number"
              {...register("expectedAttendance")}
            />
            <FieldError message={errors.expectedAttendance?.message} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="staffingNeeds">Staffing needs</Label>
            <Textarea
              id="staffingNeeds"
              placeholder="Describe support requested from facilities or staff"
              {...register("staffingNeeds")}
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label>Marketing needed?</Label>
            <div className="flex gap-3">
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  marketingNeeded
                    ? "bg-slate-950 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
                type="button"
                onClick={() =>
                  setValue("marketingNeeded", true, { shouldValidate: true })
                }
              >
                Yes
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  !marketingNeeded
                    ? "bg-slate-950 text-white"
                    : "bg-stone-100 text-stone-600"
                }`}
                type="button"
                onClick={() =>
                  setValue("marketingNeeded", false, { shouldValidate: true })
                }
              >
                No
              </button>
            </div>
          </div>
        </div>

        {marketingNeeded ? (
          <div className="rounded-[1.75rem] border border-sky-200 bg-sky-50/70 p-5">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="marketingType">Marketing type</Label>
                <select
                  id="marketingType"
                  className="flex h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                  {...register("marketingType")}
                >
                  <option value="">Select marketing type</option>
                  {marketingTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.marketingType?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketingAudience">Marketing audience</Label>
                <Input
                  id="marketingAudience"
                  placeholder="Parents, students, or mixed audience"
                  {...register("marketingAudience")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="marketingDetails">Request details</Label>
                <Textarea
                  id="marketingDetails"
                  placeholder="Explain what PR staff should create"
                  {...register("marketingDetails")}
                />
                <FieldError message={errors.marketingDetails?.message} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketingPriority">Priority</Label>
                <select
                  id="marketingPriority"
                  className="flex h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-950"
                  {...register("marketingPriority")}
                >
                  <option value="standard">Standard</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketingFile">File upload</Label>
                <Input
                  id="marketingFile"
                  type="file"
                  onChange={(event) =>
                    setMarketingFile(event.target.files?.[0] ?? null)
                  }
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={handleSubmit((values) => runAction("draft", values))}
          >
            {pendingAction === "draft" ? "Saving draft..." : "Save draft"}
          </Button>
          <Button type="submit" disabled={isPending}>
            {pendingAction === "submit" ? "Submitting..." : "Submit event"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-rose-700">{message}</p>;
}

async function uploadMarketingFile({
  supabase,
  eventId,
  file,
}: {
  supabase: ReturnType<typeof createBrowserClient>;
  eventId: string;
  file: File;
}) {
  const sanitizedFileName = file.name.replaceAll(/\s+/g, "-");
  const filePath = `${eventId}/${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from("marketing-uploads")
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: updateError } = await supabase
    .from("marketing_requests")
    .update({ file_url: filePath })
    .eq("event_id", eventId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
