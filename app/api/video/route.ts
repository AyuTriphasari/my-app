import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const prompt = (searchParams.get('prompt') || '');
        const model = searchParams.get('model') || 'seedance-pro';
        const width = searchParams.get('width') || '1024';
        const height = searchParams.get('height') || '1024';
        const seed = searchParams.get('seed') || '-1';
        const duration = searchParams.get('duration');
        const aspectRatio = searchParams.get('aspectRatio');
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
        const params: any = {
            model: model,
            width: width,
            height: height,
            seed: seed,
            nologo: 'true',
            nofeed: 'true',
            // Add timestamp to prevent caching and ensure unique URLs for batch generation
            t: Date.now().toString()
        };

        // Add optional parameters if present
        if (duration) params.duration = duration;
        if (aspectRatio) params.aspectRatio = aspectRatio;

        const urlParams = new URLSearchParams(params);

        // Construct video URL - assuming logic similar to image but for video
        // Based on user request info: https://enter.pollinations.ai/api/docs#tag/genpollinationsai/GET/image/{prompt}
        // User requested: planning to add video generate page using api prefrence above for video generation.
        // It says "instead gen image its gen video"
        // I'll assume the endpoint is https://gen.pollinations.ai/video/{prompt}

        let endpointBase = 'https://gen.pollinations.ai/image';

        const videoUrl = `${endpointBase}/${encodeURIComponent(prompt)}?${urlParams.toString()}`;

        console.log('Generating video with URL:', videoUrl);

        // For video, we might want to just return the URL if it's a redirect, or fetch it if we want to proxy/cache.
        // Images are cached in `image/route.ts`. Video might be large.
        // Lets try to fetch and cache if it's not too huge, but maybe just proxying the content is safer for now.
        // However, the image route fetches, buffers and caches.
        // Video files can be MBs. `ArrayBuffer` might kill memory if many users.
        // But for consistency with image route (which hides the API key/upstream logic), we should verify.
        // If we just return the URL, the client will see the upstream URL (and potentially API key if it was in params, but here it's in header?).
        // Wait, image route sends API key in header.

        const videoResponse = await fetch(videoUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            signal: AbortSignal.timeout(120000) // 120 second timeout
        });

        if (!videoResponse.ok) {
            const errorText = await videoResponse.text().catch(() => 'No error details');
            console.error('Video generation failed:', {
                status: videoResponse.status,
                statusText: videoResponse.statusText,
                errorText: errorText
            });
            throw new Error(`Video generation failed with status: ${videoResponse.status}`);
        }

        // Video might be a redirect or direct content.
        // If it's content, we can stream it or buffer it.
        const contentType = videoResponse.headers.get('content-type') || 'video/mp4';

        // Caching video might be heavy. Let's just return the URL if the response is a redirect?
        // But fetch follows redirects by default.
        // If we want to hide the API key, we must proxy the content OR get a signed URL if possible.
        // Pollinations usually returns the content directly or redirects to a CDN.
        // If we want to replicate the image logic:

        const arrayBuffer = await videoResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // CAUTION: Large videos could OOM.
        // Assuming short clips < 10MB.

        // Generate unique ID and save to cache
        const videoId = crypto.randomUUID();
        const { saveImageToCache } = await import('@/lib/imageCache'); // Reusing image cache for now, maybe rename later
        saveImageToCache(videoId, buffer, contentType);

        const viewUrl = `/api/view?id=${videoId}`;

        console.log('Video generated and cached, id:', videoId, 'size:', arrayBuffer.byteLength, 'bytes');

        return NextResponse.json({
            url: viewUrl,
            prompt: prompt,
            model: model,
            width: width,
            height: height
        });

    } catch (error) {
        console.error('Video API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate video' },
            { status: 500 }
        );
    }
}
