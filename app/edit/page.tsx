"use client";

import { useState } from "react";
import { editImage, uploadImageToR2, saveImageToGallery, IMAGE_EDIT_MODELS, ImageEditModel } from "@/lib/pollination";

type Status = "idle" | "uploading" | "generating" | "completed" | "error";

export default function EditPage() {
    const [prompt, setPrompt] = useState("");
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [model, setModel] = useState<ImageEditModel>("klein");
    const [seed, setSeed] = useState<number | "">("");
    const [width, setWidth] = useState(1024);
    const [height, setHeight] = useState(1024);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<Status>("idle");
    const [imageData, setImageData] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedImage(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            setUploadedImageUrl(""); // Clear cached URL when new file selected
            setError(null);

            // Read image dimensions and set as default size
            const img = new Image();
            img.onload = () => {
                // Use the actual image dimensions (capped at reasonable limits)
                const maxSize = 2048;
                let w = img.width;
                let h = img.height;

                // Scale down if too large while maintaining aspect ratio
                if (w > maxSize || h > maxSize) {
                    const scale = maxSize / Math.max(w, h);
                    w = Math.round(w * scale);
                    h = Math.round(h * scale);
                }

                // Ensure minimum size
                w = Math.max(512, w);
                h = Math.max(512, h);

                setWidth(w);
                setHeight(h);
            };
            img.src = objectUrl;
        }
    };

    const handleSubmit = async () => {
        if (!prompt.trim()) {
            setError("Please enter a prompt");
            return;
        }
        if (!uploadedImage) {
            setError("Please select an image first");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setImageData(null);
        setStatus("uploading");

        try {
            // Upload image to R2 if not already uploaded
            let imageUrl = uploadedImageUrl;
            if (!imageUrl) {
                imageUrl = await uploadImageToR2(uploadedImage);
                setUploadedImageUrl(imageUrl);
            }

            setStatus("generating");

            // Get API key from localStorage if available
            const apiKey = typeof window !== 'undefined'
                ? localStorage.getItem('pollinations_api_key') || undefined
                : undefined;

            // Generate edited image
            const response = await editImage({
                prompt: prompt.trim(),
                imageUrl: imageUrl,
                model: model,
                seed: seed === "" ? undefined : Number(seed),
                width: width,
                height: height,
                apiKey: apiKey,
            });

            setImageData(response.url);
            setStatus("completed");

            // Save to gallery
            try {
                saveImageToGallery({
                    id: Date.now().toString(),
                    prompt: prompt,
                    url: response.url,
                    timestamp: Date.now(),
                });
            } catch (err) {
                console.error("Failed to save image to gallery", err);
            }
        } catch (err) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Failed to edit image. Please try again.";
            setError(message);
            setStatus("error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black p-3 sm:p-6">
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent mb-2">
                        Image Editing
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-300">
                        Upload an image and transform it with AI.
                    </p>
                </div>

                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-yellow-400/20 shadow-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Image Upload Section */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2 text-yellow-200">Upload Image</label>
                        <div className="space-y-3">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="w-full bg-black/50 border border-yellow-400/30 rounded-lg p-3 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-600 file:text-black hover:file:bg-yellow-700"
                            />

                            {previewUrl && (
                                <div className="relative rounded-lg overflow-hidden border border-yellow-400/20 bg-black/40">
                                    <img src={previewUrl} alt="Preview" className="w-full max-h-96 object-contain" />
                                </div>
                            )}

                            {uploadedImageUrl && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                    <p className="text-xs text-green-300">✓ Image ready</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2 text-yellow-200">Model</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                                { value: 'klein', label: 'Klein 4B', icon: '✨' },
                                { value: 'klein-large', label: 'Klein 9B', icon: '💎' },
                                { value: 'gptimage', label: 'GPT Image', icon: '🤖' },
                                { value: 'seedream', label: 'Seedream', icon: '🌱' },
                            ].map((m) => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setModel(m.value as ImageEditModel)}
                                    className={`relative p-3 rounded-lg border transition-all text-left group overflow-hidden ${model === m.value
                                        ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-500/20'
                                        : 'bg-black/40 border-yellow-400/20 text-zinc-300 hover:bg-black/60 hover:border-yellow-400/40'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{m.icon}</span>
                                        <span className="text-xs font-medium">{m.label}</span>
                                        {model === m.value && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-auto flex-shrink-0"><path d="M20 6 9 17l-5-5" /></svg>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prompt */}
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold mb-2 text-yellow-200">Prompt</label>

                        {/* Style Presets */}
                        <div className="mb-3 flex flex-wrap gap-2">
                            <span className="text-xs text-gray-400 w-full sm:w-auto">Quick Styles:</span>
                            {[
                                { label: "🎨 Realistic", style: "photorealistic, ultra realistic, natural lighting, sharp focus, high detail" },
                                { label: "🎭 Anime", style: "anime style, manga art, clean lineart, vibrant colors, studio anime" },
                                { label: "✏️ Vector Art", style: "vector art, flat design, clean lines, minimal shading, illustration" },
                                { label: "🎬 Cinematic", style: "cinematic, dramatic lighting, film grain, depth of field, movie still" },
                                { label: "🎮 3D", style: "3D render, high quality, octane render, realistic lighting, global illumination" },
                                { label: "✍️ Sketch", style: "pencil sketch, hand drawn, line art, monochrome, artistic shading" },
                                { label: "🌈 Digital Painting", style: "digital painting, painterly style, soft brush strokes, concept art" },
                                { label: "🌃 Cyberpunk", style: "cyberpunk style, neon lights, futuristic city, high contrast, glowing colors" },
                                { label: "🖌️ Watercolor", style: "watercolor painting, soft colors, paper texture, artistic, light washes" },
                                { label: "🕹️ Pixel Art", style: "pixel art, 8-bit style, retro game art, low resolution, sharp pixels" },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => setPrompt(preset.style)}
                                    className="px-3 py-1.5 text-xs bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-200 rounded-lg transition-all"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe how you want to transform the image..."
                            className="w-full bg-black/50 border border-yellow-400/30 rounded-lg sm:rounded-xl p-3 sm:p-4 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white placeholder-gray-500 text-sm sm:text-base resize-none"
                            rows={4}
                            spellCheck={false}
                            autoComplete="off"
                            autoCorrect="off"
                        />
                    </div>

                    {/* Advanced Options Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between text-xs sm:text-sm font-semibold text-yellow-300 hover:text-yellow-200 transition p-3 bg-black/30 rounded-lg border border-yellow-400/20 hover:border-yellow-400/40"
                    >
                        <span>⚙️ Advanced Options</span>
                        <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {/* Advanced Options Section */}
                    {showAdvanced && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-4 bg-black/30 rounded-lg border border-yellow-400/20">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-yellow-200">Width</label>
                                <select
                                    value={width}
                                    onChange={(e) => setWidth(Number(e.target.value))}
                                    className="w-full bg-black/50 border border-yellow-400/30 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white text-xs sm:text-sm"
                                >
                                    <option value="512">512</option>
                                    <option value="768">768</option>
                                    <option value="1024">1024</option>
                                    <option value="1280">1280</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-yellow-200">Height</label>
                                <select
                                    value={height}
                                    onChange={(e) => setHeight(Number(e.target.value))}
                                    className="w-full bg-black/50 border border-yellow-400/30 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white text-xs sm:text-sm"
                                >
                                    <option value="512">512</option>
                                    <option value="768">768</option>
                                    <option value="1024">1024</option>
                                    <option value="1280">1280</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold mb-1.5 text-yellow-200">Seed (optional)</label>
                                <input
                                    type="number"
                                    value={seed}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSeed(value === "" ? "" : Number(value));
                                    }}
                                    placeholder="Random if empty"
                                    className="w-full bg-black/50 border border-yellow-400/30 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white text-xs sm:text-sm"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!prompt.trim() || !uploadedImage || isSubmitting}
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl hover:from-yellow-600 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all font-semibold text-sm sm:text-lg shadow-lg hover:shadow-yellow-500/40"
                    >
                        {status === "uploading" ? "Uploading Image..." : status === "generating" ? "Generating..." : "Transform Image"}
                    </button>
                </div>

                {(status === "uploading" || status === "generating") && (
                    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-yellow-400/30 p-8 shadow-lg flex flex-col items-center justify-center text-center">
                        <div className="relative mb-8">
                            {/* Outer spinning ring - Gold Theme */}
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 border-r-amber-500 border-b-orange-500 animate-spin blur-sm opacity-70"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-500 border-r-amber-500 border-b-orange-500 animate-spin"></div>

                            {/* Inner pulsing orb */}
                            <div className="relative w-32 h-32 rounded-full bg-black flex items-center justify-center border border-yellow-500/20 shadow-2xl shadow-yellow-500/20">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 animate-pulse"></div>
                                <span className="text-5xl animate-bounce">{status === "uploading" ? "☁️" : "⚡"}</span>
                            </div>
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent mb-4 animate-pulse">
                            {status === "uploading" ? "Uploading Image..." : "Transforming Image..."}
                        </h3>

                        <div className="bg-black/50 px-4 py-2 rounded-full border border-yellow-500/20 mb-6">
                            <p className="text-gray-400 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                Model: <span className="text-yellow-300 font-semibold">{model}</span>
                            </p>
                        </div>

                        {/* Loading Steps */}
                        <div className="w-full max-w-md space-y-3">
                            <div className="bg-black/50 rounded-full h-1.5 w-full overflow-hidden border border-yellow-500/10">
                                <div className="h-full bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 animate-[loading_2s_ease-in-out_infinite] w-[50%]"></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 px-1">
                                <span className={status === "uploading" ? "text-yellow-400" : ""}>Uploading</span>
                                <span className={status === "generating" ? "text-yellow-400" : ""}>Processing</span>
                                <span>Complete</span>
                            </div>
                        </div>

                        <style jsx>{`
                            @keyframes loading {
                                0% { transform: translateX(-150%); }
                                50% { transform: translateX(0%); }
                                100% { transform: translateX(150%); }
                            }
                        `}</style>
                    </div>
                )}

                {status === "error" && (
                    <div className="bg-red-950/30 backdrop-blur-sm rounded-xl border border-red-500/30 p-8 shadow-lg flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h3 className="text-2xl font-bold text-red-200 mb-2">Transformation Failed</h3>
                        <p className="text-red-300/70 mb-8 max-w-md text-sm">{error || "An unexpected error occurred while transforming the image. Please try again."}</p>
                        <button
                            onClick={handleSubmit}
                            className="group relative px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-200 rounded-full border border-red-500/30 transition-all hover:pr-9 hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]"
                        >
                            Try Again
                            <span className="absolute right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">↻</span>
                        </button>
                    </div>
                )}

                {imageData && (
                    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-yellow-400/30 p-4 sm:p-6 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-white">Result</h3>
                                <p className="text-xs text-gray-400">Transformed with {model}</p>
                            </div>
                            <button
                                onClick={() => {
                                    const link = document.createElement("a");
                                    link.href = imageData;
                                    link.download = `edited-${Date.now()}.png`;
                                    link.click();
                                }}
                                className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-yellow-500/20 border border-yellow-400/40 text-yellow-100 hover:bg-yellow-500/30 transition shadow-lg shadow-yellow-500/10"
                            >
                                Download
                            </button>
                        </div>
                        <div className="relative rounded-lg overflow-hidden border border-yellow-400/20 bg-black/40 group">
                            <img
                                src={imageData}
                                alt="Edited result"
                                className="w-full cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
                                onClick={() => setViewImage(imageData)}
                            />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Full Screen Image Modal */}
            {viewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setViewImage(null)}
                >
                    <div className="absolute top-4 right-4 z-50 flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement("a");
                                link.href = viewImage;
                                link.download = `edited-${Date.now()}.png`;
                                link.click();
                            }}
                            className="bg-zinc-800/80 hover:bg-yellow-600 text-white p-3 rounded-full backdrop-blur transition-all border border-yellow-500/30"
                            title="Download"
                        >
                            ⬇️
                        </button>
                        <button
                            onClick={() => setViewImage(null)}
                            className="bg-zinc-800/80 hover:bg-red-600 text-white p-3 rounded-full backdrop-blur transition-all border border-yellow-500/30"
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>

                    <div
                        className="relative w-full h-full flex flex-col items-center justify-center p-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={viewImage}
                            alt="Full screen preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-yellow-500/20"
                        />

                        <div className="mt-4 bg-zinc-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-yellow-500/20 max-w-2xl text-center">
                            <p className="text-yellow-100 text-sm sm:text-base font-medium line-clamp-2">{prompt}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {error && status === "error" && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setError(null)}
                >
                    <div
                        className="relative max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glowing background effect - Gold theme */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-orange-500 to-amber-600 rounded-2xl blur-lg opacity-30 animate-pulse"></div>

                        <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-8 shadow-2xl">
                            {/* Close button */}
                            <button
                                onClick={() => setError(null)}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>

                            {/* Animated icon */}
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    {/* Pulsing rings */}
                                    <div className="absolute inset-0 rounded-full bg-yellow-500/20 animate-ping"></div>
                                    <div className="absolute -inset-3 rounded-full border border-yellow-500/30 animate-pulse"></div>
                                    <div className="absolute -inset-6 rounded-full border border-yellow-500/10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>

                                    {/* Icon container */}
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-900/50 to-orange-900/50 rounded-full flex items-center justify-center border border-yellow-500/30 shadow-lg shadow-yellow-500/20">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-center bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-300 bg-clip-text text-transparent mb-3">
                                Transformation Failed
                            </h3>

                            {/* Error message */}
                            <div className="bg-black/40 rounded-xl border border-yellow-500/10 p-4 mb-6">
                                <p className="text-sm text-zinc-400 text-center leading-relaxed">
                                    {error}
                                </p>
                            </div>

                            {/* Animated dots */}
                            <div className="flex justify-center gap-1 mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setError(null)}
                                    className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium text-sm transition-all border border-white/5"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => {
                                        setError(null);
                                        handleSubmit();
                                    }}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                        <path d="M16 16h5v5" />
                                    </svg>
                                    Try Again
                                </button>
                            </div>

                            {/* Tips */}
                            <p className="text-[10px] text-zinc-600 text-center mt-4">
                                💡 Tip: Try a different prompt or use another image
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
