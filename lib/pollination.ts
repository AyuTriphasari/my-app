import axios from 'axios';

const API_BASE_URL = '/api';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string | any[];
    feedback?: 'like' | 'dislike';
}

export interface GeneratedImage {
    id: string;
    prompt: string;
    url: string;
    timestamp: number;
}

export interface PremiumGenerateResponse {
    promptId: string | null;
    message: string;
}

export interface PremiumStatusResponse {
    status: 'pending' | 'completed';
    image?: string;
    filename?: string;
}

// Chat with AI - calls local API route
export async function sendChatMessage(messages: ChatMessage[], model: string = 'nova-fast', apiKey?: string): Promise<string> {
    try {
        const params: any = {
            model: model
        };

        // Add API key if provided
        if (apiKey) {
            params.apiKey = apiKey;
        }

        const response = await axios.post(`${API_BASE_URL}/chat`, {
            messages: messages,
            model: model
        }, {
            params,
            timeout: 45000 // 45 second timeout for chat
        });

        return response.data.response;
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw new Error('Failed to get AI response');
    }
}

// Generate image from text prompt - calls local API route
export async function generateImage(prompt: string, options?: {
    width?: number;
    height?: number;
    seed?: number;
    model?: string;
    apiKey?: string;
}): Promise<string> {
    try {
        const {
            width = 1024,
            height = 1024,
            seed = -1,
            model = 'flux',
            apiKey
        } = options || {};

        const params: any = {
            prompt: prompt,
            model: model,
            width: width,
            height: height,
            seed: seed
        };

        // Add API key if provided
        if (apiKey) {
            params.apiKey = apiKey;
        }

        const response = await axios.get(`${API_BASE_URL}/image`, {
            params,
            timeout: 75000 // 75 second timeout for image generation (longer for image)
        });

        return response.data.url;
    } catch (error) {
        console.error('Error generating image:', error);
        throw new Error('Failed to generate image');
    }
}

// Generate video from text prompt - calls local API route
export async function generateVideo(prompt: string, options?: {
    width?: number;
    height?: number;
    seed?: number;
    model?: string;
    apiKey?: string;
    duration?: number;
    aspectRatio?: string;
}): Promise<string> {
    try {
        const {
            width = 1024,
            height = 1024,
            seed = -1,
            model = 'seedance-pro',
            apiKey,
            duration,
            aspectRatio
        } = options || {};

        const params: any = {
            prompt: prompt,
            model: model,
            width: width,
            height: height,
            seed: seed
        };

        if (duration) params.duration = duration;
        if (aspectRatio) params.aspectRatio = aspectRatio;

        // Add API key if provided
        if (apiKey) {
            params.apiKey = apiKey;
        }

        const response = await axios.get(`${API_BASE_URL}/video`, {
            params,
            timeout: 120000 // 120 second timeout for video generation
        });

        return response.data.url;
    } catch (error) {
        console.error('Error generating video:', error);
        throw new Error('Failed to generate video');
    }
}

// Save generated video to local storage
export function saveVideoToGallery(video: GeneratedImage): void {
    try {
        const gallery = getVideoGallery();
        gallery.unshift(video);

        // Limit gallery to 20 most recent videos
        const limitedGallery = gallery.slice(0, 20);

        localStorage.setItem('pollination_video_gallery', JSON.stringify(limitedGallery));
    } catch (error) {
        console.error('Failed to save video to gallery:', error);
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            try {
                const gallery = getVideoGallery();
                const reducedGallery = gallery.slice(0, 10);
                localStorage.setItem('pollination_video_gallery', JSON.stringify(reducedGallery));
                reducedGallery.unshift(video);
                localStorage.setItem('pollination_video_gallery', JSON.stringify(reducedGallery.slice(0, 10)));
            } catch (retryError) {
                console.error('Failed to save video even after cleanup:', retryError);
                localStorage.removeItem('pollination_video_gallery');
            }
        }
    }
}

// Get all videos from gallery
export function getVideoGallery(): GeneratedImage[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('pollination_video_gallery');
    return stored ? JSON.parse(stored) : [];
}

// Delete video from gallery
export function deleteVideoFromGallery(id: string): void {
    const gallery = getVideoGallery();
    const filtered = gallery.filter(vid => vid.id !== id);
    localStorage.setItem('pollination_video_gallery', JSON.stringify(filtered));
}

// Clear video gallery
export function clearVideoGallery(): void {
    localStorage.removeItem('pollination_video_gallery');
}

// Available image editing models
export const IMAGE_EDIT_MODELS = [
    'klein',
    'klein-large',
    'gptimage',
    'seedream',
    'nanobanana',
] as const;

export type ImageEditModel = typeof IMAGE_EDIT_MODELS[number];

export interface EditImageResponse {
    url: string;
    model: string;
}

// Edit image using Pollinations API
export async function editImage(params: {
    prompt: string;
    imageUrl: string;
    model?: ImageEditModel;
    seed?: number;
    width?: number;
    height?: number;
    apiKey?: string;
}): Promise<EditImageResponse> {
    try {
        const response = await axios.post(`${API_BASE_URL}/edit`, {
            prompt: params.prompt,
            imageUrl: params.imageUrl,
            model: params.model || 'klein',
            seed: params.seed ?? -1,
            width: params.width ?? 1024,
            height: params.height ?? 1024,
            apiKey: params.apiKey,
        }, {
            timeout: 120000, // 2 minute timeout
        });

        return response.data as EditImageResponse;
    } catch (error) {
        console.error('Error editing image:', error);
        if (axios.isAxiosError(error) && error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Failed to edit image');
    }
}

// Upload image to R2 and get public URL
export async function uploadImageToR2(file: File): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_BASE_URL}/uploadR2`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60 second timeout
        });

        return response.data.url;
    } catch (error) {
        console.error('Error uploading image:', error);
        if (axios.isAxiosError(error) && error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error('Failed to upload image');
    }
}




// Save generated image to local storage
export function saveImageToGallery(image: GeneratedImage): void {
    try {
        const gallery = getGallery();
        gallery.unshift(image);

        // Limit gallery to 20 most recent images to prevent localStorage quota issues
        const limitedGallery = gallery.slice(0, 20);

        localStorage.setItem('pollination_gallery', JSON.stringify(limitedGallery));
    } catch (error) {
        console.error('Failed to save image to gallery:', error);
        // If quota exceeded, try to clear old images and save again
        if (error instanceof Error && error.name === 'QuotaExceededError') {
            try {
                const gallery = getGallery();
                // Keep only the 10 most recent images
                const reducedGallery = gallery.slice(0, 10);
                localStorage.setItem('pollination_gallery', JSON.stringify(reducedGallery));
                // Try to add the new image again
                reducedGallery.unshift(image);
                localStorage.setItem('pollination_gallery', JSON.stringify(reducedGallery.slice(0, 10)));
            } catch (retryError) {
                console.error('Failed to save even after cleanup:', retryError);
                // Last resort: clear gallery completely
                localStorage.removeItem('pollination_gallery');
            }
        }
    }
}


// Get all images from gallery
export function getGallery(): GeneratedImage[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem('pollination_gallery');
    return stored ? JSON.parse(stored) : [];
}

// Delete image from gallery
export function deleteImageFromGallery(id: string): void {
    const gallery = getGallery();
    const filtered = gallery.filter(img => img.id !== id);
    localStorage.setItem('pollination_gallery', JSON.stringify(filtered));
}

// Clear entire gallery
export function clearGallery(): void {
    localStorage.removeItem('pollination_gallery');
}
