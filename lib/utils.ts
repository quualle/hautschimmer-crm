import { type ClassValue, clsx } from "clsx";

/** Merge Tailwind classes with conflict resolution */
export const cn = (...inputs: ClassValue[]): string => clsx(inputs);

/** Format a date for German locale */
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/** Format a time for German locale */
export const formatTime = (date: Date | string): string => {
  return new Date(date).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
