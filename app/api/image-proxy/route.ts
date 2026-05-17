import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return new Response('Missing url parameter', { status: 400 });
    }

    try {
        // Determine the referer based on the URL domain
        let referer = '';
        let origin = '';

        if (url.includes('sankakucomplex.com')) {
            referer = 'https://www.sankakucomplex.com/';
            origin = 'https://www.sankakucomplex.com';
        } else if (url.includes('rule34.xxx')) {
            referer = 'https://rule34.xxx/';
            origin = 'https://rule34.xxx';
        }

        const response = await fetch(url, {
            headers: {
                'Referer': referer,
                'Origin': origin,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
            return new Response(`Failed to fetch image: ${response.status}`, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const imageBuffer = await response.arrayBuffer();

        return new Response(imageBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error: any) {
        console.error('Image proxy error:', error.message);
        return new Response('Failed to proxy image', { status: 500 });
    }
}
