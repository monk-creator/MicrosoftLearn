export type LearnContentType = "Learning Path" | "Module" | "Course" | "Browse hub";

export interface LearnChunk {
  id: string;
  contentType: LearnContentType;
  /** Exact title as shown on Microsoft Learn */
  title: string;
  url: string;
  /** Duration string from catalog (e.g. "56 min", "1 Day") */
  duration: string;
  /** Short description — only facts aligned with catalog metadata */
  summary: string;
  keywords: string[];
  products: string[];
  roles: string[];
  level: string;
  nextIds: string[];
  /** Page name for "Source:" line */
  sourcePage: string;
}
