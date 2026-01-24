import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const prompt = (searchParams.get('prompt') || '');
        const model = searchParams.get('model') || 'flux';
        const width = searchParams.get('width') || '1024';
        const height = searchParams.get('height') || '1024';
        const seed = searchParams.get('seed') || '-1';
        const userApiKey = searchParams.get('apiKey');

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Use user's API key if provided, otherwise use server key
        const apiKey = userApiKey || process.env.NEXT_PUBLIC_POLLINATION_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API key not configured. Please provide your own Pollinations API key.' },
                { status: 400 }
            );
        }

        // Build params - only include essential ones to avoid 400 errors
        const params = new URLSearchParams({
            model: model,
            width: width,
            height: height,
            seed: seed,
            nologo: 'true',
            nofeed: 'true',
            // Add timestamp to prevent caching and ensure unique URLs for batch generation
            t: Date.now().toString()
        });

        const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params.toString()}`;

        console.log('Generating image with URL:', imageUrl);

        // Fetch image with Authorization header
        const imageResponse = await fetch(imageUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            signal: AbortSignal.timeout(120000) // 120 second timeout
        });

        if (!imageResponse.ok) {
            const errorText = await imageResponse.text().catch(() => 'No error details');
            console.error('Image generation failed:', {
                status: imageResponse.status,
                statusText: imageResponse.statusText,
                errorText: errorText
            });
            throw new Error(`Image generation failed with status: ${imageResponse.status}`);
        }

        // Convert image to buffer
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = imageResponse.headers.get('content-type') || 'image/png';

        // Generate unique ID and save to cache
        const imageId = crypto.randomUUID();
        const { saveImageToCache } = await import('@/lib/imageCache');
        saveImageToCache(imageId, buffer, contentType);

        const viewUrl = `/api/view?id=${imageId}`;

        console.log('Image generated and cached, id:', imageId, 'size:', arrayBuffer.byteLength, 'bytes');

        // Return URL to view api
        return NextResponse.json({
            url: viewUrl,
            prompt: prompt,
            model: model,
            width: width,
            height: height
        });
    } catch (error) {
        console.error('Image API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate image' },
            { status: 500 }
        );
    }
}
