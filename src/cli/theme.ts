export interface MentorStyle {
  label: string;
  color: string; // any Ink-supported colour
}

const STYLES: Record<string, MentorStyle> = {
  tutor: { label: "Tutor", color: "cyan" },
  architect: { label: "Architect", color: "magenta" },
  reviewer: { label: "Reviewer", color: "yellow" },
  "ai-coach": { label: "AI Coach", color: "green" },
  "peer-coach": { label: "Peer Coach", color: "blue" },
};

const FALLBACK: MentorStyle = { label: "Mentor", color: "white" };

export function mentorStyle(id: string): MentorStyle {
  return STYLES[id] ?? { ...FALLBACK, label: id };
}

export const BRAND_COLOR = "cyanBright";
export const STUDENT_COLOR = "gray";
export const ERROR_COLOR = "red";
