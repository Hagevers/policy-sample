// src/services/cacheService.ts
import fs from "fs/promises";
import path from "path";

interface CacheData {
  [key: string]: {
    embedding: number[];
    timestamp: number;
  };
}

export class EmbeddingCache {
  private cachePath: string;
  private cacheDir: string;
  private cache: CacheData = {};
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(cachePath: string = "cache/embedding-cache.json") {
    this.cacheDir = path.join(process.cwd(), "cache");
    this.cachePath = path.join(process.cwd(), cachePath);
  }

  async init() {
    try {
      // Ensure cache directory exists
      await this.ensureCacheDirectory();

      // Try to read existing cache file
      try {
        const data = await fs.readFile(this.cachePath, "utf-8");
        this.cache = JSON.parse(data);
        // Clean expired entries
        this.cleanExpiredEntries();
      } catch (error: unknown) {
        // `unknown` forces explicit type checking
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          // If file doesn't exist, create empty cache file
          await this.saveCache();
          console.log("Created new cache file");
        } else {
          // If there's a different error (e.g., invalid JSON), start with empty cache
          console.warn(
            "Error reading cache, starting with empty cache:",
            error
          );
          this.cache = {};
          await this.saveCache();
        }
      }
    } catch (error) {
      console.error("Failed to initialize cache:", error);
      // Continue with in-memory cache only
      this.cache = {};
    }
  }

  private async ensureCacheDirectory() {
    try {
      await fs.access(this.cacheDir);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log("Created cache directory");
    }
  }

  private async saveCache() {
    try {
      await this.ensureCacheDirectory();
      await fs.writeFile(this.cachePath, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error("Error saving cache:", error);
    }
  }

  private cleanExpiredEntries() {
    const now = Date.now();
    let hasChanges = false;

    for (const [key, value] of Object.entries(this.cache)) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        delete this.cache[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.saveCache();
    }
  }

  async get(key: string): Promise<number[] | null> {
    const entry = this.cache[key];
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      delete this.cache[key];
      this.saveCache();
      return null;
    }

    return entry.embedding;
  }

  async set(key: string, embedding: number[]) {
    this.cache[key] = {
      embedding,
      timestamp: Date.now(),
    };
    await this.saveCache();
  }

  generateKey(text: string): string {
    // Create a deterministic key from the text
    // Using a hash function to create a shorter key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${hash}`;
  }
}
