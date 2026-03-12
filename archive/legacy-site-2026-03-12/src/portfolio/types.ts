import type { LucideIcon } from 'lucide-react';

export type SectionId = 'home' | 'about' | 'experience' | 'projects' | 'writing' | 'contact';

export interface NavItem {
  id: SectionId;
  label: string;
}

export interface Metric {
  label: string;
  value: string;
  note: string;
}

export interface ExperienceCard {
  role: string;
  company: string;
  period: string;
  summary: string;
  bullets: string[];
}

export interface ProjectCard {
  title: string;
  role: string;
  outcome: string;
  summary: string;
  tags: string[];
  link?: string;
}

export interface WritingCard {
  title: string;
  date: string;
  summary: string;
  link?: string;
}
