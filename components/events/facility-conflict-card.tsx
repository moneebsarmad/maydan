interface FacilityConflictCardProps {
  notes: string;
  createdAt?: string | null;
}

export function FacilityConflictCard({
  notes,
  createdAt,
}: FacilityConflictCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-amber-300 bg-amber-50 p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.24em] text-amber-800">
        Facility conflict flagged
      </p>
      <p className="mt-3 text-base leading-7 text-amber-950">{notes}</p>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-amber-800/80">
        {createdAt
          ? `Flagged ${new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(createdAt))}`
          : "Flagged by Facilities Director"}
      </p>
    </div>
  );
}
