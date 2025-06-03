import { Policy, PolicyEmbeddings } from "../types";
import { findRelevantChapters } from "../lib/embeddings";

/**
 * Interface for question results
 */
export interface QuestionSearchResult {
  question: string;
  relevantChapters: Array<{
    policyId: string;
    policyName: string;
    chapterTitle: string;
    chapterContent: string;
    similarity: number;
  }>;
}

/**
 * Process a question and find relevant chapters in policies
 */
export async function processQuestion(
  question: string,
  policies: Policy[],
  policyEmbeddings: PolicyEmbeddings[],
  topK: number = 3
): Promise<QuestionSearchResult> {
  // Find relevant chapters using embeddings
  const relevantChapters = await findRelevantChapters(
    question,
    policyEmbeddings,
    topK
  );

  // Enrich the results with full content and policy names
  const enrichedResults = relevantChapters.map((result) => {
    const policy = policies.find((p) => p.id === result.policyId);
    const chapter = policy?.chapters[result.chapterTitle];

    return {
      policyId: result.policyId,
      policyName: policy?.name || result.policyId,
      chapterTitle: result.chapterTitle,
      chapterContent: chapter?.content || "",
      similarity: result.similarity,
    };
  });

  return {
    question,
    relevantChapters: enrichedResults,
  };
}

/**
 * Common insurance policy questions to test the system
 */
export const commonPolicyQuestions = [
  // Coverage questions
  "What is covered under this policy?",
  "What are the exclusions in this policy?",
  "Does this policy cover pre-existing conditions?",
  "What is the coverage for hospitalization?",
  "Are surgical procedures covered?",
  "What is the coverage for emergency care?",
  "Does this policy cover prescription medications?",
  "What is the coverage for specialist consultations?",
  "Is ambulance service covered?",
  "What medical devices are covered?",

  // Limits and deductibles
  "What is the maximum coverage amount?",
  "What is the deductible for this policy?",
  "What is the co-payment structure?",
  "Is there an out-of-pocket maximum?",
  "What are the coverage limitations?",

  // Claims and processes
  "How do I file a claim?",
  "What documentation is required for claims?",
  "What is the process for pre-authorization?",
  "How long does it take to process claims?",
  "What is the appeals process for denied claims?",

  // Policy terms
  "What is the policy period?",
  "How can I renew my policy?",
  "Can the policy be canceled? Under what conditions?",
  "What happens if I miss a premium payment?",
  "How are premium increases determined?",

  // Hebrew versions
  "מה מכוסה במסגרת פוליסה זו?",
  "מהם החריגים בפוליסה זו?",
  "האם הפוליסה מכסה מצבים רפואיים קודמים?",
  "מהו הכיסוי עבור אשפוז?",
  "האם הליכים כירורגיים מכוסים?",
  "מהו הכיסוי לטיפול חירום?",
  "האם הפוליסה מכסה תרופות מרשם?",
  "מהו הכיסוי להתייעצויות עם מומחים?",
  "האם שירותי אמבולנס מכוסים?",
  "אילו מכשירים רפואיים מכוסים?",
];

/**
 * Test a policy with common questions and return most relevant chapters
 */
export async function testPolicyWithQuestions(
  policy: Policy,
  policyEmbeddings: PolicyEmbeddings,
  questionsToTest: string[] = commonPolicyQuestions.slice(0, 10)
): Promise<
  Record<string, Array<{ chapterTitle: string; similarity: number }>>
> {
  const results: Record<
    string,
    Array<{ chapterTitle: string; similarity: number }>
  > = {};

  // Test each question and collect results
  for (const question of questionsToTest) {
    const relevantChapters = await findRelevantChapters(
      question,
      [policyEmbeddings],
      3
    );

    results[question] = relevantChapters.map((item) => ({
      chapterTitle: item.chapterTitle,
      similarity: item.similarity,
    }));
  }

  return results;
}
