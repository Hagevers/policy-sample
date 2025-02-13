import pdfParse from "pdf-parse";
import fs from "fs/promises";
import OpenAI from "openai";
import { EmbeddingCache } from "@/services/cacheService";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cache = new EmbeddingCache();

// Initialize cache when module loads
cache.init();

const MAX_CHUNK_LENGTH = 8000; // OpenAI allows larger chunks
const MIN_CHUNK_LENGTH = 100;

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}

export function createChunks(text: string): string[] {
  if (!text || typeof text !== "string") {
    console.warn("Invalid input text for chunking");
    return [];
  }

  try {
    const cleanedText = text.replace(/\s+/g, " ").trim();

    if (!cleanedText) {
      return [];
    }

    const sentences = cleanedText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if ((currentChunk + " " + sentence).length <= MAX_CHUNK_LENGTH) {
        currentChunk += (currentChunk ? " " : "") + sentence;
      } else {
        if (currentChunk.length >= MIN_CHUNK_LENGTH) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk && currentChunk.length >= MIN_CHUNK_LENGTH) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(
      (chunk) =>
        chunk &&
        typeof chunk === "string" &&
        chunk.trim().length >= MIN_CHUNK_LENGTH
    );
  } catch (error) {
    console.error("Error creating chunks:", error);
    return [];
  }
}

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

      const cacheKey = cache.generateKey(chunk);
      const cachedEmbedding = await cache.get(cacheKey);

      if (cachedEmbedding) {
        console.log("Using cached embedding");
        embeddings.push(cachedEmbedding);
        continue;
      }

      const cleanedChunk = chunk.trim();

      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: cleanedChunk,
        encoding_format: "float",
      });

      if (response.data[0].embedding) {
        await cache.set(cacheKey, response.data[0].embedding);
        embeddings.push(response.data[0].embedding);
      } else {
        console.error("Invalid embedding response format");
        embeddings.push([]);
      }
    } catch (error) {
      console.error("Failed to get embedding:", error);
      embeddings.push([]);
    }
  }

  return embeddings;
}

export async function semanticSearch(
  query: string,
  documents: { text: string; embedding: number[] }[]
): Promise<string[]> {
  if (!query || typeof query !== "string") {
    console.error("Invalid query");
    return [];
  }

  try {
    const cacheKey = cache.generateKey(query);
    let queryEmbedding = await cache.get(cacheKey);

    if (!queryEmbedding) {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query.trim(),
        encoding_format: "float",
      });

      if (!response.data[0].embedding) {
        throw new Error("Failed to get query embedding");
      }

      queryEmbedding = response.data[0].embedding;
      await cache.set(cacheKey, queryEmbedding);
    }

    const validDocuments = documents.filter(
      (doc) =>
        doc &&
        doc.embedding &&
        Array.isArray(doc.embedding) &&
        doc.embedding.length === queryEmbedding!.length
    );

    if (!validDocuments.length) {
      return [];
    }

    const similarities = validDocuments
      .map((doc) => ({
        text: doc.text,
        similarity: cosineSimilarity(queryEmbedding!, doc.embedding),
      }))
      .filter((item) => !isNaN(item.similarity) && item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, 5).map((s) => s.text);
  } catch (error) {
    console.error("Error in semantic search:", error);
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    !a.length ||
    !b.length ||
    a.length !== b.length
  ) {
    return 0;
  }

  try {
    const dotProduct = a.reduce((sum, _, i) => sum + a[i] * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  } catch (error) {
    console.error("Error calculating similarity:", error);
    return 0;
  }
}
