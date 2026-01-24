
// Simple in-memory cache for storing image buffers temporarily.
// Ideally usage of Redis or file system storage is preferred for production.

type ImageCacheEntry = {
    buffer: Buffer;
    contentType: string;
    timestamp: number;
};

// Global cache object attached to globalThis to survive hot reloads in development
const globalForCache = globalThis as unknown as {
    imageCache: Map<string, ImageCacheEntry> | undefined;
};

export const imageCache = globalForCache.imageCache ?? new Map<string, ImageCacheEntry>();

if (process.env.NODE_ENV !== 'production') globalForCache.imageCache = imageCache;

export function saveImageToCache(id: string, buffer: Buffer, contentType: string = 'image/png') {
    // Cleanup old entries (older than 1 hour)
    const now = Date.now();
    for (const [key, val] of imageCache.entries()) {
        if (now - val.timestamp > 3600 * 1000) {
            imageCache.delete(key);
        }
    }

    imageCache.set(id, {
        buffer,
        contentType,
        timestamp: now
    });
}

export function getImageFromCache(id: string) {
    return imageCache.get(id);
}
