// Basic metadata for policies
export interface PolicyMetadata {
  issuer?: string;
  effectiveDate?: string;
  expirationDate?: string;
  policyNumber?: string;
  policyType?: string;
}

// Chapter structure in a policy
// export interface Chapter {
//   title: string;
//   content: string;
//   position: number;
//   pageNumbers?: [number, number]; // [start, end]
// }

export interface SubChapter {
  title: string;
  level: number;
  content: string;
  subChapters?: SubChapter[];
}

export interface Chapter {
  title: string;
  level: number;
  content?: string;
  subChapters?: SubChapter[];
}

// Complete policy structure
export interface Policy {
  id: string;
  name: string;
  issuer?: string;
  effectiveDate?: string;
  chapters: Chapter[];
  metadata?: PolicyMetadata;
}

// Structure for a section within a chapter
export interface Section {
  id: string;
  title: string;
  content: string;
  chapterTitle: string;
}

// Embedding comparison result
export interface ComparisonResult {
  similarity: number;
  matchingChapter: string;
}

// Structure for storing policy embeddings
export interface PolicyEmbeddings {
  policyId: string;
  chapterEmbeddings: Record<string, number[]>;
}

// Result from question answering
export interface QuestionResult {
  answer: string;
  relevantPolicies: string[];
  relevantChapters: string[];
  confidence: number;
}

// Relevant section with similarity score
export interface RelevantSection {
  section: Section;
  similarity: number;
}
