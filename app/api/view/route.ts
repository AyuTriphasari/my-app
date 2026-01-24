import { NextRequest, NextResponse } from 'next/server';
import { getImageFromCache } from '@/lib/imageCache';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
        return new NextResponse('Missing ID', { status: 400 });
    }

    const imageEntry = getImageFromCache(id);

    if (!imageEntry) {
        return new NextResponse('Image not found or expired', { status: 404 });
    }

    return new NextResponse(new Blob([new Uint8Array(imageEntry.buffer)]), {
        headers: {
            'Content-Type': imageEntry.contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
