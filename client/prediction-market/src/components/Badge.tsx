interface Props {
  children: React.ReactNode;
  variant?: "green" | "red" | "yellow" | "blue" | "muted";
  className?: string;
}

const variants = {
  green: "bg-success/10 text-success",
  red: "bg-danger/10 text-danger",
  yellow: "bg-warning/10 text-warning",
  blue: "bg-info/10 text-info",
  muted: "bg-text-muted/10 text-text-muted",
};

export default function Badge({ children, variant = "muted", className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold font-mono tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
