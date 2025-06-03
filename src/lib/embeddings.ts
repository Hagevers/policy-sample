import { Chapter, PolicyEmbeddings } from "../types";
import { EmbeddingCache } from "@/services/cacheService";
import { openai } from "./openai-client";

/**
 * Generate embeddings for an array of text chunks
 */

const cache = new EmbeddingCache();

// Initialize cache when module loads
cache.init();

export async function getEmbeddings(chunks: string[]): Promise<number[][]> {
  if (!Array.isArray(chunks)) {
    console.error("Invalid chunks input: not an array");
    return [];
  }

  const embeddings: number[][] = [];

  for (const chunk of chunks) {
    try {
      if (!chunk || typeof chunk !== "string" || !chunk.trim()) {
        console.log("Skipping invalid chunk");
        embeddings.push([]);
        continue;
      }

      const cleanedChunk = chunk.trim();
      console.log(`Processing chunk of length ${cleanedChunk.length}`);

      // Always break into smaller chunks to be safe
      const subChunks = breakTextIntoChunks(cleanedChunk);

      // For multiple chunks, we need to get embeddings for each and then average them
      const subEmbeddings: number[][] = [];

      for (const subChunk of subChunks) {
        console.log(`Processing sub-chunk of length ${subChunk.length}`);

        const cacheKey = cache.generateKey(subChunk);
        const cachedEmbedding = await cache.get(cacheKey);

        if (cachedEmbedding) {
          console.log("Using cached embedding for sub-chunk");
          subEmbeddings.push(cachedEmbedding);
        } else {
          try {
            console.log(
              `Getting embedding for sub-chunk: ${subChunk.substring(
                0,
                100
              )}...`
            );
            const response = await openai.embeddings.create({
              model: "text-embedding-3-small",
              input: subChunk,
              encoding_format: "float",
            });

            if (response.data[0].embedding) {
              await cache.set(cacheKey, response.data[0].embedding);
              subEmbeddings.push(response.data[0].embedding);
            } else {
              console.error("Invalid embedding response format for sub-chunk");
            }
          } catch (error) {
            console.error(`Error getting embedding for sub-chunk: ${error}`);
            // If we still get token errors, try to break into even smaller chunks
            if (subChunk.length > 1000) {
              console.log("Trying with smaller chunks");
              const smallerChunks = breakTextIntoChunks(subChunk, 1000);
              for (const smallChunk of smallerChunks) {
                try {
                  const smallResponse = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: smallChunk,
                    encoding_format: "float",
                  });
                  if (smallResponse.data[0].embedding) {
                    await cache.set(
                      cache.generateKey(smallChunk),
                      smallResponse.data[0].embedding
                    );
                    subEmbeddings.push(smallResponse.data[0].embedding);
                  }
                } catch (smallError) {
                  console.error(
                    `Still failed with smaller chunk: ${smallError}`
                  );
                }
              }
            }
          }
        }
      }

      // Average the embeddings from sub-chunks
      if (subEmbeddings.length > 0) {
        const avgEmbedding = averageEmbeddings(subEmbeddings);
        embeddings.push(avgEmbedding);
      } else {
        console.error("Failed to get any embeddings for sub-chunks");
        embeddings.push([]);
      }
    } catch (error) {
      console.error("Failed to get embedding:", error);
      embeddings.push([]);
    }
  }

  return embeddings;
}

// Helper function to average multiple embeddings
function averageEmbeddings(embeddings: number[][]): number[] {
  if (!embeddings.length) return [];

  const dimension = embeddings[0].length;
  const result = new Array(dimension).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimension; i++) {
      result[i] += embedding[i] / embeddings.length;
    }
  }

  // Normalize the result to unit length
  const magnitude = Math.sqrt(result.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return result;
  return result.map((val) => val / magnitude);
}

/**
 * Extract content from chapters to prepare for embedding
 */
function chaptersToChunks(chapters: Record<string, Chapter>): {
  chunks: string[];
  titles: string[];
} {
  const chunks: string[] = [];
  const titles: string[] = [];

  for (const [title, chapter] of Object.entries(chapters)) {
    chunks.push(chapter.content);
    titles.push(title);
  }

  return { chunks, titles };
}

/**
 * Generate embeddings for all chapters in a policy
 */
export async function getChapterEmbeddings(
  policyId: string,
  chapters: Record<string, Chapter>
): Promise<PolicyEmbeddings> {
  const { chunks, titles } = chaptersToChunks(chapters);
  const embeddingResults = await getEmbeddings(chunks);

  const chapterEmbeddings: Record<string, number[]> = {};

  embeddingResults.forEach((embedding, index) => {
    const title = titles[index];
    chapterEmbeddings[title] = embedding;
  });

  return {
    policyId,
    chapterEmbeddings,
  };
}
/**
 * Calculate cosine similarity between two embedding vectors
 */
export function calculateCosineSimilarity(
  vec1: number[],
  vec2: number[]
): number {
  if (!vec1 || !vec2 || vec1.length === 0 || vec2.length === 0) {
    return 0;
  }

  const length = Math.min(vec1.length, vec2.length);
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < length; i++) {
    dotProduct += vec1[i] * vec2[i];
    magnitude1 += vec1[i] * vec1[i];
    magnitude2 += vec2[i] * vec2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Find the most relevant chapters for a question
 */
export async function findRelevantChapters(
  question: string,
  policyEmbeddings: PolicyEmbeddings[],
  topK: number = 3
): Promise<
  Array<{ policyId: string; chapterTitle: string; similarity: number }>
> {
  // Get embedding for the question
  const questionEmbeddings = await getEmbeddings([question]);

  if (!questionEmbeddings[0] || questionEmbeddings[0].length === 0) {
    console.error("Failed to get embedding for question");
    return [];
  }

  const questionEmbedding = questionEmbeddings[0];
  const allChapterSimilarities: Array<{
    policyId: string;
    chapterTitle: string;
    similarity: number;
  }> = [];

  // Calculate similarity with all chapters across policies
  for (const policyEmbedding of policyEmbeddings) {
    for (const [chapterTitle, chapterEmbedding] of Object.entries(
      policyEmbedding.chapterEmbeddings
    )) {
      const similarity = calculateCosineSimilarity(
        questionEmbedding,
        chapterEmbedding
      );

      allChapterSimilarities.push({
        policyId: policyEmbedding.policyId,
        chapterTitle,
        similarity,
      });
    }
  }

  // Sort by similarity (highest first) and take top K
  return allChapterSimilarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}
// Add this function at the top of your file
function breakTextIntoChunks(text: string, maxTokens: number = 2500): string[] {
  if (!text) return [];

  // More conservative estimate for Hebrew and other non-Latin scripts
  // Using 3 characters per token to be safe
  const avgCharsPerToken = 3;
  const maxChars = maxTokens * avgCharsPerToken;

  // If text is already small enough, return it as is
  if (text.length <= maxChars) {
    return [text];
  }

  // For debugging - log original size
  console.log(
    `Breaking text of ${text.length} characters (est. ${Math.round(
      text.length / avgCharsPerToken
    )} tokens) into chunks of max ${maxChars} characters`
  );

  const chunks: string[] = [];

  // Hard chunking by character count
  for (let i = 0; i < text.length; i += maxChars) {
    const chunk = text.slice(i, i + maxChars);
    chunks.push(chunk);
  }

  console.log(`Created ${chunks.length} chunks`);

  return chunks;
}
