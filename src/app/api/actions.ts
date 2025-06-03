"use server";

// import { answerQuestion } from "@/services/qa-service";
// import { processPolicyFiles } from "@/services/policy-service";
import { processAndCompareAllPolicies } from "@/services/detailed-comparison-service";

// export async function askQuestion(question: string): Promise<string> {
//   // Process policy files
//   const { policies, embeddings } = await processPolicyFiles();

//   if (policies.length === 0) {
//     return "No policies found. Please upload insurance policy PDFs first.";
//   }

//   console.log(`Found ${policies.length} policies, generating answer...`);

//   // Answer the question
//   const result = await answerQuestion(question, policies, embeddings);

//   // Include reference information with the answer
//   const policyReferences =
//     result.relevantPolicies.length > 0
//       ? `\n\nReferences: ${result.relevantPolicies.join(", ")}`
//       : "";

//   return result.answer + policyReferences;
// }

export async function handlePolicyComparison(): Promise<string> {
  const comparisons = await processAndCompareAllPolicies();

  return comparisons;
}
