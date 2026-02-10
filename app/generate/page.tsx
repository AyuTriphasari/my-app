'use client';

import { useState, useEffect } from 'react';
import { generateImage, saveImageToGallery, GeneratedImage, getGallery, clearGallery } from '@/lib/pollination';
import { useConfirm } from '@/app/components/ConfirmModal';



import Image from 'next/image';

const API_KEY_STORAGE = 'pollination_api_key';

const EXAMPLE_PROMPTS = [
    "A serene mountain landscape at sunset with vibrant purple and orange skies",
    "Futuristic cyberpunk city with neon lights and flying cars",
    "Magical forest with glowing mushrooms and fairy lights",
    "Abstract geometric art with bold colors and sharp angles",
    "Photorealistic portrait of a wise old wizard with a long beard",
    "Minimalist modern architecture with clean lines and glass"
];

const ASPECT_RATIOS = [
    { label: "Square", width: 1024, height: 1024, icon: "⬜" },
    { label: "Portrait", width: 768, height: 1024, icon: "📱" },
    { label: "Landscape", width: 1024, height: 768, icon: "🖼️" },
    { label: "Wide", width: 1536, height: 768, icon: "🎬" }
];

export default function GeneratePage() {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const [showAspectRatio, setShowAspectRatio] = useState(false);
    const [history, setHistory] = useState<GeneratedImage[]>([]);
    const [selectedHistoryImage, setSelectedHistoryImage] = useState<GeneratedImage | null>(null);
    const [viewImage, setViewImage] = useState<{ url: string; prompt: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState({
        width: 1024,
        height: 1024,
        model: 'imagen-4'
    });
    const confirm = useConfirm();

    // Load API key and history
    useEffect(() => {
        const fragment = window.location.hash.slice(1);
        const urlApiKey = new URLSearchParams(fragment).get('api_key');

        if (urlApiKey) {
            console.log('Saving API key from URL to localStorage');
            localStorage.setItem(API_KEY_STORAGE, urlApiKey);
            setApiKey(urlApiKey);
            window.history.replaceState(null, '', window.location.pathname);
        } else {
            const savedKey = localStorage.getItem(API_KEY_STORAGE);
            if (savedKey) {
                console.log('Loading API key from localStorage:', savedKey.substring(0, 10) + '...');
                setApiKey(savedKey);
            } else {
                console.log('No API key found in localStorage');
            }
        }

        // Load history
        setHistory(getGallery().slice(0, 10));
    }, []);

    // Persist API key whenever it changes
    useEffect(() => {
        if (apiKey) {
            console.log('Persisting API key to localStorage');
            localStorage.setItem(API_KEY_STORAGE, apiKey);
        }
    }, [apiKey]);

    const handleConnectPollinations = () => {
        const redirectUrl = window.location.href.split('#')[0];
        window.location.href = `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
    };

    const handleDisconnect = () => {
        console.log('Disconnecting API key');
        setApiKey('');
        localStorage.removeItem(API_KEY_STORAGE);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            const randomSeed = Math.floor(Math.random() * 1000000000);
            console.log('Generating image with seed:', randomSeed);

            const imageUrl = await generateImage(prompt, {
                width: settings.width,
                height: settings.height,
                model: settings.model,
                seed: randomSeed,
                apiKey: apiKey || undefined
            });

            setGeneratedImage(imageUrl);

            // Save to gallery
            const image: GeneratedImage = {
                id: Date.now().toString(),
                prompt: prompt,
                url: imageUrl,
                timestamp: Date.now()
            };
            saveImageToGallery(image);
            setHistory([image, ...history.slice(0, 9)]);

            console.log('Successfully generated image');
        } catch (error) {
            console.error('Failed to generate image:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate image. Please try again.';
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (url: string, promptText: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `zlk-${Date.now()}.png`;
        link.click();
    };

    const selectAspectRatio = (width: number, height: number) => {
        setSettings({ ...settings, width, height });
    };

    const useExamplePrompt = (example: string) => {
        setPrompt(example);
    };

    const loadHistoryImage = (image: GeneratedImage) => {
        setSelectedHistoryImage(image);
        setPrompt(image.prompt);
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-200 font-sans selection:bg-white/10">
            {/* History Sidebar */}
            <div className="hidden lg:flex w-72 border-r border-white/5 bg-black flex-col flex-shrink-0">
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-zinc-100">Recent Generations</h2>
                        </div>
                        {history.length > 0 && (
                            <button
                                onClick={async () => {
                                    const confirmed = await confirm({
                                        title: 'Clear History',
                                        message: 'Clear all history? This cannot be undone.',
                                        confirmText: 'Clear All',
                                        variant: 'danger'
                                    });
                                    if (confirmed) {
                                        clearGallery();
                                        setHistory([]);
                                    }
                                }}
                                className="text-xs text-red-400 hover:text-red-300 transition"
                                title="Clear history"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {history.map((img) => (
                        <div
                            key={img.id}
                            onClick={() => setViewImage({ url: img.url, prompt: img.prompt })}
                            className="group relative cursor-pointer rounded-lg overflow-hidden border border-white/5 hover:border-zinc-500/50 transition-all opacity-80 hover:opacity-100 aspect-square"
                        >
                            <Image
                                src={img.url}
                                alt={img.prompt}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-2">
                                    <p className="text-xs text-white line-clamp-2">{img.prompt}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-gray-400">🔍 View</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                loadHistoryImage(img);
                                            }}
                                            className="text-[10px] bg-blue-500/30 hover:bg-blue-500 px-2 py-0.5 rounded text-blue-200 hover:text-white transition-colors"
                                        >
                                            Use
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                            No history yet<br />Generate your first image!
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="min-h-16 h-auto border-b border-white/5 bg-zinc-950/50 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 z-20 shrink-0 gap-3">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-lg font-semibold text-zinc-100">
                            Image Generator
                        </h1>
                        <p className="text-xs text-zinc-500">Create stunning images with AI</p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-3 md:p-6">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {/* Left Column - Controls */}
                        <div className="space-y-4 md:space-y-6">
                            {/* Prompt Input */}
                            <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-zinc-200">
                                        Prompt
                                    </label>
                                    {prompt && (
                                        <button
                                            onClick={() => setPrompt('')}
                                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe the image you want to generate..."
                                    className="w-full bg-black/50 border border-white/5 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200 placeholder-zinc-500 resize-none min-h-[120px] text-sm"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                            handleGenerate();
                                        }
                                    }}
                                />
                                <div className="mt-2 flex justify-end">
                                    <span className="text-xs text-zinc-600">{prompt.length} chars</span>
                                </div>
                            </div>

                            {/* Example Prompts */}
                            <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setShowExamples(!showExamples)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                                >
                                    <h3 className="text-sm font-medium text-zinc-300">Examples</h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-zinc-500 transition-transform ${showExamples ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                                </button>
                                {showExamples && (
                                    <div className="px-4 pb-4 space-y-2">
                                        {EXAMPLE_PROMPTS.slice(0, 4).map((example, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => useExamplePrompt(example)}
                                                className="w-full text-left p-2.5 bg-black/30 hover:bg-black/50 border border-white/5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                                            >
                                                {example}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Settings */}
                            <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setShowAspectRatio(!showAspectRatio)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                                >
                                    <h3 className="text-sm font-medium text-zinc-300">Aspect Ratio</h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-zinc-500 transition-transform ${showAspectRatio ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                                </button>
                                {showAspectRatio && (
                                    <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                                        {ASPECT_RATIOS.map((ratio) => (
                                            <button
                                                key={ratio.label}
                                                onClick={() => selectAspectRatio(ratio.width, ratio.height)}
                                                className={`p-3 rounded-lg border transition-all flex items-center justify-between group ${settings.width === ratio.width && settings.height === ratio.height
                                                    ? 'bg-zinc-100 border-zinc-100 text-black'
                                                    : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-zinc-800'
                                                    }`}
                                            >
                                                <div className="text-xs font-medium">{ratio.label}</div>
                                                <div className={`text-[10px] ${settings.width === ratio.width && settings.height === ratio.height ? 'text-zinc-500' : 'text-zinc-600'}`}>{ratio.width}x{ratio.height}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Advanced Settings */}
                            <div className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
                                >
                                    <h3 className="text-sm font-medium text-zinc-300">Model</h3>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-zinc-500 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                                </button>
                                {showAdvanced && (
                                    <div className="px-4 pb-4">
                                        <select
                                            value={settings.model}
                                            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                                            className="w-full bg-black/30 border border-white/5 rounded-lg p-2.5 text-zinc-300 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
                                        >
                                            <option value="flux">Flux Schnell</option>
                                            <option value="zimage">Z-Image Turbo</option>
                                            <option value="turbo">SDXL Turbo</option>
                                            <option value="gptimage">GPT Image 1 Mini</option>
                                            <option value="klein">FLUX.2 Klein 4B</option>
                                            <option value="klein-large">FLUX.2 Klein 9B</option>
                                            <option value="imagen-4">imagen-4</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={!prompt.trim() || isGenerating}
                                className="w-full bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 text-black py-3.5 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" /></svg>
                                        <span>Generate Image</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Right Column - Result Display */}
                        <div className="space-y-4 md:space-y-6">
                            {/* Result Display */}
                            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 min-h-[500px] flex flex-col">
                                {generatedImage ? (
                                    <>
                                        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
                                            <h3 className="text-sm font-semibold text-zinc-200">Result</h3>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => handleDownload(generatedImage, prompt)}
                                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors border border-white/5"
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    onClick={handleGenerate}
                                                    disabled={isGenerating}
                                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors border border-white/5"
                                                >
                                                    Regenerate
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative flex-1 rounded-xl overflow-hidden border border-white/5 bg-black/50 group flex items-center justify-center">
                                            {isGenerating && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                                                    <div className="text-center p-4">
                                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mb-4"></div>
                                                        <p className="text-sm text-zinc-200 font-medium">Creating masterpiece...</p>
                                                    </div>
                                                </div>
                                            )}
                                            <Image
                                                src={generatedImage}
                                                alt={prompt}
                                                fill
                                                className="object-contain cursor-zoom-in"
                                                onClick={() => setViewImage({ url: generatedImage, prompt: prompt })}
                                                unoptimized
                                            />
                                        </div>
                                        <div className="mt-3 md:mt-4 p-3 md:p-4 bg-zinc-950/50 rounded-xl border border-white/5">
                                            <p className="text-xs md:text-sm text-zinc-400">
                                                <strong className="text-zinc-200">Prompt:</strong> {prompt}
                                            </p>
                                        </div>
                                    </>
                                ) : isGenerating ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-16 h-16 border-4 border-zinc-800 border-t-zinc-100 rounded-full animate-spin mb-6"></div>
                                        <h3 className="text-zinc-200 font-medium mb-2">Generating...</h3>
                                        <p className="text-zinc-500 text-sm">Validating prompt and allocating GPU</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 text-2xl">
                                            ✨
                                        </div>
                                        <h3 className="text-zinc-200 font-medium mb-2">Ready to Create</h3>
                                        <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-8">
                                            Enter a prompt and choose your settings to generate stunning AI images.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Screen Image Modal */}
            {
                viewImage && (
                    <div
                        className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
                        onClick={() => setViewImage(null)}
                    >
                        <div className="absolute top-4 right-4 z-50 flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(viewImage.url, viewImage.prompt);
                                }}
                                className="bg-black/50 hover:bg-zinc-800 text-zinc-100 p-3 rounded-full backdrop-blur transition-all border border-white/10"
                                title="Download"
                            >
                                ⬇️
                            </button>
                            <button
                                onClick={() => setViewImage(null)}
                                className="bg-black/50 hover:bg-zinc-800 text-zinc-100 p-3 rounded-full backdrop-blur transition-all border border-white/10"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div
                            className="relative w-full h-full flex flex-col items-center justify-center p-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-full flex-1 flex items-center justify-center min-h-0">
                                <Image
                                    src={viewImage.url}
                                    alt={viewImage.prompt}
                                    fill
                                    className="object-contain rounded-lg shadow-2xl border border-white/10"
                                    unoptimized
                                />
                            </div>

                            <div className="mt-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 max-w-2xl text-center shrink-0">
                                <p className="text-zinc-200 text-sm sm:text-base font-medium line-clamp-2">{viewImage.prompt}</p>
                                <div className="flex justify-center gap-4 mt-2">
                                    <button
                                        onClick={() => {
                                            setPrompt(viewImage.prompt);
                                            setViewImage(null);
                                        }}
                                        className="text-xs text-zinc-400 hover:text-white hover:underline"
                                    >
                                        Use This Prompt
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Error Modal */}
            {error && (
                <div
                    className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setError(null)}
                >
                    <div
                        className="relative max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Glowing background effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 rounded-2xl blur-lg opacity-30 animate-pulse"></div>

                        <div className="relative bg-zinc-900/90 backdrop-blur-sm rounded-2xl border border-red-500/20 p-8 shadow-2xl">
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
                                    <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></div>
                                    <div className="absolute -inset-3 rounded-full border border-red-500/30 animate-pulse"></div>
                                    <div className="absolute -inset-6 rounded-full border border-red-500/10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>

                                    {/* Icon container */}
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-red-900/50 to-orange-900/50 rounded-full flex items-center justify-center border border-red-500/30 shadow-lg shadow-red-500/20">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-center bg-gradient-to-r from-red-300 via-orange-300 to-red-300 bg-clip-text text-transparent mb-3">
                                Generation Failed
                            </h3>

                            {/* Error message */}
                            <div className="bg-black/40 rounded-xl border border-red-500/10 p-4 mb-6">
                                <p className="text-sm text-zinc-400 text-center leading-relaxed">
                                    {error}
                                </p>
                            </div>

                            {/* Animated dots */}
                            <div className="flex justify-center gap-1 mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500/50 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
                                        handleGenerate();
                                    }}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
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
                                💡 Tip: Try simplifying your prompt or check your connection
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
