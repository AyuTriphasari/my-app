'use client';

import { useState, useEffect } from 'react';
import { getGallery, deleteImageFromGallery, clearGallery, GeneratedImage } from '@/lib/pollination';
import { useConfirm } from '@/app/components/ConfirmModal';
import Image from 'next/image';

export default function GalleryPage() {
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const confirm = useConfirm();

    useEffect(() => {
        loadGallery();
    }, []);

    const loadGallery = () => {
        setImages(getGallery());
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Image',
            message: 'Are you sure you want to delete this image?',
            confirmText: 'Delete',
            variant: 'danger'
        });
        if (confirmed) {
            deleteImageFromGallery(id);
            loadGallery();
            if (selectedImage?.id === id) {
                setSelectedImage(null);
            }
        }
    };

    const handleClearAll = async () => {
        const confirmed = await confirm({
            title: 'Clear Gallery',
            message: 'Are you sure you want to delete all images? This cannot be undone.',
            confirmText: 'Clear All',
            variant: 'danger'
        });
        if (confirmed) {
            clearGallery();
            loadGallery();
            setSelectedImage(null);
        }
    };

    const handleDownload = (image: GeneratedImage) => {
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `ZlkcyberAI-${image.id}.png`;
        link.click();
    };

    const filteredImages = images.filter(img =>
        img.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 mb-2">
                            Gallery
                        </h1>
                        <p className="text-sm text-zinc-400">
                            {images.length} {images.length === 1 ? 'creation' : 'creations'}
                        </p>
                    </div>
                    {images.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20 text-sm font-medium"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                {images.length > 0 && (
                    <div className="mb-8">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search prompts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl p-3 pl-10 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 placeholder-zinc-500"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                🔍
                            </span>
                        </div>
                    </div>
                )}

                {/* Gallery Grid */}
                {filteredImages.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <div className="text-5xl mb-4 text-zinc-700">🎨</div>
                        <h2 className="text-xl font-semibold text-zinc-200 mb-2">No Images Yet</h2>
                        <p className="text-zinc-500 mb-6">
                            {images.length === 0
                                ? 'Generate your first image to see it here!'
                                : 'No images match your search.'}
                        </p>
                        {images.length === 0 && (
                            <a
                                href="/generate"
                                className="inline-block px-6 py-2.5 bg-zinc-100 hover:bg-white text-black rounded-lg transition-colors font-medium text-sm"
                            >
                                Generate Image
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredImages.map((image) => (
                            <div
                                key={image.id}
                                className="group relative bg-zinc-900 rounded-xl border border-white/5 overflow-hidden hover:border-zinc-500/50 transition-all cursor-pointer"
                                onClick={() => setSelectedImage(image)}
                            >
                                {/* Force 3:4 aspect ratio */}
                                <div className="relative w-full" style={{ paddingBottom: '133.33%' }}>
                                    <Image
                                        src={image.url}
                                        alt={image.prompt}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        unoptimized
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <p className="text-zinc-200 text-xs line-clamp-2 mb-2 font-medium">
                                                {image.prompt}
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownload(image);
                                                    }}
                                                    className="flex-1 px-2 py-1.5 bg-zinc-100 hover:bg-white text-black rounded text-xs font-medium transition-colors"
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(image.id);
                                                    }}
                                                    className="px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition-colors"
                                                >
                                                    del
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Image Modal */}
                {selectedImage && (
                    <div
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-200"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div
                            className="bg-zinc-950 border border-white/5 rounded-none sm:rounded-2xl w-full h-full sm:max-w-6xl sm:w-auto sm:max-h-[90vh] sm:h-auto overflow-auto shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-zinc-950 flex-shrink-0">
                                <h3 className="text-lg sm:text-lg font-semibold text-zinc-100">
                                    Image Details
                                </h3>
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <div className="p-4 sm:p-6">
                                    <div className="rounded-none sm:rounded-xl overflow-hidden border-0 sm:border border-white/5 mb-4 sm:mb-6 bg-zinc-900">
                                        <Image
                                            src={selectedImage.url}
                                            alt={selectedImage.prompt}
                                            width={1024}
                                            height={1024}
                                            className="w-full h-auto"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="bg-zinc-900 p-4 sm:p-6 rounded-xl border border-white/5 mb-4">
                                        <p className="text-sm text-zinc-300">
                                            <strong className="text-zinc-100">Prompt:</strong> {selectedImage.prompt}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                        <button
                                            onClick={() => handleDownload(selectedImage)}
                                            className="flex-1 px-6 py-3 bg-zinc-100 hover:bg-white text-black rounded-xl transition-colors font-medium shadow-sm flex items-center justify-center gap-2 text-sm"
                                        >
                                            Download Image
                                        </button>
                                        <button
                                            onClick={() => handleDelete(selectedImage.id)}
                                            className="flex-1 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                                        >
                                            Delete Image
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
