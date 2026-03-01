export function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm font-medium text-rose-700">{message}</p>;
}
