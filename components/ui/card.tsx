import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
}

const paddingClasses = {
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
};

export const Card = ({
  className,
  padding = "md",
  ...props
}: CardProps) => (
  <div
    className={cn(
      "rounded-xl border border-border bg-white",
      paddingClasses[padding],
      className
    )}
    {...props}
  />
);
