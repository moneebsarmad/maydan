import { UserCircle2 } from "lucide-react";

interface UserAvatarProps {
  name: string;
  email: string;
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({ name, email }: UserAvatarProps) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-stone-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
        {initialsFromName(name) || <UserCircle2 className="h-5 w-5" />}
      </div>
      <div className="hidden text-left sm:block">
        <p className="text-sm font-semibold text-slate-950">{name}</p>
        <p className="text-xs text-stone-500">{email}</p>
      </div>
    </div>
  );
}
