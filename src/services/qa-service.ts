import { Policy, PolicyEmbeddings, QuestionResult } from "../types";
import { findRelevantChapters } from "../lib/embeddings";
import { openai } from "@/lib/openai-client";

/**
 * Answer a question based on policy content
 */
export async function answerQuestion(
  question: string,
  policies: Policy[],
  policyEmbeddings: PolicyEmbeddings[]
): Promise<QuestionResult> {
  // Find relevant chapters for the question
  const relevantChapters = await findRelevantChapters(
    question,
    policyEmbeddings
  );

  // Extract content from the relevant chapters
  const relevantContent = relevantChapters
    .map((item) => {
      const policy = policies.find((p) => p.id === item.policyId);
      const policyName = policy?.name || item.policyId;
      const chapter = policy?.chapters[item.chapterTitle];

      if (!chapter) return "";

      return `POLICY: ${policyName}\nCHAPTER: ${item.chapterTitle}\n\n${chapter.content}`;
    })
    .join("\n\n---\n\n");

  // Generate an answer using the relevant content
  const answer = await generateAnswer(question, relevantContent);

  return {
    answer,
    relevantPolicies: [
      ...new Set(
        relevantChapters.map((item) => {
          const policy = policies.find((p) => p.id === item.policyId);
          return policy?.name || item.policyId;
        })
      ),
    ],
    relevantChapters: relevantChapters.map((item) => item.chapterTitle),
    confidence: relevantChapters[0]?.similarity || 0,
  };
}

/**
 * Generate an answer to a question based on relevant content
 */
async function generateAnswer(
  question: string,
  relevantContent: string
): Promise<string> {
  try {
    const content =
      relevantContent.length > 0
        ? relevantContent
        : "No relevant content found in the policies.";

    const prompt = `
You are an insurance policy assistant. Based on the policy information provided,
answer the following question as accurately as possible. If the information is not
available in the provided policy content, state that clearly.

POLICY INFORMATION:
${content}

QUESTION: ${question}

ANSWER:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use an appropriate model
      messages: [
        {
          role: "system",
          content:
            "You are an insurance policy assistant that provides accurate information based only on the policy content provided.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    return (
      response.choices[0]?.message?.content ||
      "Sorry, I couldn't generate an answer based on the policies."
    );
  } catch (error) {
    console.error("Error generating answer:", error);
    return "Sorry, there was an error generating an answer. Please try again.";
  }
}
