import { NextRequest, NextResponse } from 'next/server';

const GENERATE_URL = "https://zlkpro.tech/api/generate";

function proxyImg(url: string): string {
    return `https://imgproxy.zlkpro.tech/insecure/q:80/plain/${url}@webp`;
}

interface GenerateRequestBody {
    prompt?: string;
    negative?: string;
    steps?: number;
    cfg?: number;
    width?: number;
    height?: number;
    batch?: number;
    seed?: string;
    model?: string;
}

interface SSEData {
    type: string;
    taskId?: string;
    files?: string[];
}

const MODEL_MAP: Record<string, string> = {
    'anime-nsfw': 'new_waiIllustriousSDXL_v160.safetensors',
    'realism-nsfw': 'liyu网红写实realistic-NSFW-illustrious-SDXL.safetensors',
};

async function generate(promptText: string, width = 768, height = 1024, modelKey = 'anime-nsfw'): Promise<{ taskId: string | null; files: string[] }> {
    const checkpoint = MODEL_MAP[modelKey] || MODEL_MAP['anime-nsfw'];
    let numStep = 18
    if (modelKey === 'realism-nsfw') {
        numStep = 30
    }

    const response = await fetch(GENERATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt: `"embedding:Lazy_Embeddings/Positive/lazypos" ${promptText}`,
            negative: "greyscale, black_white, simple_background, censored, logo, blur, kid, young woman, loli, embedding:Lazy_Embeddings/Negative/lazyneg, low quality, blurry, artifacts, watermark, text, logo",
            steps: numStep,
            cfg: 4,
            width,
            height,
            batch: 1,
            seed: "random",
            model: checkpoint
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error details');
        throw new Error(`Generation API returned ${response.status}: ${errorText}`);
    }

    const text = await response.text();

    // Parse SSE response
    const lines = text.split('\n');
    let taskId: string | null = null;
    let files: string[] = [];

    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6); // Remove "data: " prefix
            try {
                const data: SSEData = JSON.parse(jsonStr);

                if (data.type === 'taskId') {
                    taskId = data.taskId ?? null;
                    console.log(`📋 Task ID: ${taskId}`);
                } else if (data.type === 'result') {
                    files = data.files ?? [];
                    console.log(`✅ Generation complete! ${files.length} image(s)`);
                }
            } catch {
                // Skip invalid JSON lines
            }
        }
    }

    return { taskId, files };
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as GenerateRequestBody;
        const prompt = body.prompt || "embedding:Lazy_Embeddings/Positive/lazypos";
        const width = body.width || 768;
        const height = body.height || 1024;
        const modelKey = body.model || 'anime-nsfw';

        console.log("🚀 Generating image...");

        const { taskId, files } = await generate(prompt, width, height, modelKey);

        const proxiedFiles = files.map((url) => proxyImg(url));

        return NextResponse.json({
            taskId,
            files: proxiedFiles,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error:', message);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}