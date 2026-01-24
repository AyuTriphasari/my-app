import { NextRequest, NextResponse } from 'next/server';

// Available image editing models
const VALID_MODELS = [
    'klein',
    'klein-large',
    'gptimage',
    'seedream',
    'nanobanana',
];

interface EditRequestBody {
    prompt: string;
    imageUrl: string;
    model?: string;
    seed?: number;
    width?: number;
    height?: number;
    apiKey?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as EditRequestBody;
        const {
            prompt,
            imageUrl,
            model = 'klein',
            seed = Math.floor(Math.random() * 10000000000),
            width = 1024,
            height = 1024,
        } = body;

        if (!prompt?.trim()) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        if (!imageUrl?.trim()) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        if (!VALID_MODELS.includes(model)) {
            return NextResponse.json(
                { error: `Invalid model. Valid options: ${VALID_MODELS.join(', ')}` },
                { status: 400 }
            );
        }

        // Build the Pollinations API URL
        const encodedPrompt = encodeURIComponent(prompt.trim());
        const params = new URLSearchParams({
            model,
            image: imageUrl,
            width: width.toString(),
            height: height.toString(),
            seed: seed.toString(),
        });

        const pollinationsUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?${params.toString()}`;

        // Build headers with optional API key (from request or fallback to env)
        const apiKey = body.apiKey || process.env.NEXT_PUBLIC_POLLINATION_API_KEY;
        const headers: Record<string, string> = {
            'Accept': 'image/*',
        };
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        // Fetch the generated image from Pollinations
        console.log('Editing image with URL:', pollinationsUrl);
        const response = await fetch(pollinationsUrl, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(120000), // 2 minute timeout for generation
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('Pollinations API error:', response.status, errorText);
            throw new Error(`Image editing failed: ${response.status}`);
        }

        // Convert image to buffer and cache it
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'image/png';

        // Generate unique ID and save to cache
        const imageId = crypto.randomUUID();
        const { saveImageToCache } = await import('@/lib/imageCache');
        saveImageToCache(imageId, buffer, contentType);

        const viewUrl = `/api/view?id=${imageId}`;
        console.log('Image edited and cached, id:', imageId, 'size:', arrayBuffer.byteLength, 'bytes');

        // Return URL to view api
        return NextResponse.json({
            url: viewUrl,
            model,
        });
    } catch (error: unknown) {
        console.error('Edit image error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to edit image', detail: message },
            { status: 500 }
        );
    }
}

// GET endpoint to list available models
export async function GET() {
    return NextResponse.json({
        models: VALID_MODELS,
        description: 'Available models for image editing with Pollinations API',
    });
}
