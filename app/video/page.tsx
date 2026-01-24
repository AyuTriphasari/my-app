'use client';

import { useState, useEffect, useRef } from 'react';
import { generateVideo, saveVideoToGallery, GeneratedImage, getVideoGallery, clearVideoGallery } from '@/lib/pollination';
import { useConfirm } from '@/app/components/ConfirmModal';

const API_KEY_STORAGE = 'pollination_api_key';

const EXAMPLE_PROMPTS = [
    "A cyberpunk robot dancing in the rain with neon lights reflection",
    "Time lapse of a blooming rose flower, 8k high quality",
    "Drone shot flying over a futuristic city at sunset",
    "Slow motion water splash with droplets suspended in air",
    "A cute cat chasing a laser pointer in a cozy living room",
    "Abstract liquid metal flowing and morphing shapes"
];

const ASPECT_RATIOS = [
    { label: "Square", width: 1024, height: 1024, icon: "⬜" },
    { label: "Portrait", width: 768, height: 1280, icon: "📱" },
    { label: "Landscape", width: 1280, height: 768, icon: "🖼️" },
    { label: "Wide", width: 1536, height: 768, icon: "🎬" }
];

export default function VideoPage() {
    const [prompt, setPrompt] = useState('');
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const [showAspectRatio, setShowAspectRatio] = useState(false);
    const [history, setHistory] = useState<GeneratedImage[]>([]);
    const [selectedHistoryVideo, setSelectedHistoryVideo] = useState<GeneratedImage | null>(null);
    const [viewVideo, setViewVideo] = useState<{ url: string; prompt: string } | null>(null);
    const [settings, setSettings] = useState({
        width: 1024,
        height: 1024,
        model: 'seedance-pro',
        duration: 3,
        aspectRatio: '16:9'
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
                setApiKey(savedKey);
            }
        }

        // Load history
        setHistory(getVideoGallery().slice(0, 10));
    }, []);

    // Persist API key whenever it changes
    useEffect(() => {
        if (apiKey) {
            localStorage.setItem(API_KEY_STORAGE, apiKey);
        }
    }, [apiKey]);

    const handleConnectPollinations = () => {
        const redirectUrl = window.location.href.split('#')[0];
        window.location.href = `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
    };

    const handleDisconnect = () => {
        setApiKey('');
        localStorage.removeItem(API_KEY_STORAGE);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setGeneratedVideo(null);

        try {
            const randomSeed = Math.floor(Math.random() * 2147483647);
            console.log('Generating video with seed:', randomSeed);

            const videoUrl = await generateVideo(prompt, {
                ...settings,
                seed: randomSeed,
                apiKey: apiKey || undefined,
                duration: settings.duration,
                aspectRatio: settings.aspectRatio
            });

            setGeneratedVideo(videoUrl);

            // Save to gallery
            const video: GeneratedImage = {
                id: Date.now().toString(),
                prompt: prompt,
                url: videoUrl,
                timestamp: Date.now()
            };
            saveVideoToGallery(video);
            setHistory([video, ...history.slice(0, 9)]);

            console.log('Successfully generated video');
        } catch (error) {
            console.error('Failed to generate video:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate video. Please try again.';
            alert(`Error: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = (url: string, promptText: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `zlk-video-${Date.now()}.mp4`;
        link.click();
    };

    const selectAspectRatio = (width: number, height: number) => {
        setSettings({ ...settings, width, height });
    };

    const useExamplePrompt = (example: string) => {
        setPrompt(example);
    };

    const loadHistoryVideo = (video: GeneratedImage) => {
        setSelectedHistoryVideo(video);
        setPrompt(video.prompt);
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-200 font-sans selection:bg-white/10">
            {/* History Sidebar */}
            <div className="hidden lg:flex w-72 border-r border-white/5 bg-black flex-col flex-shrink-0">
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-zinc-100">Recent Videos</h2>
                        </div>
                        {history.length > 0 && (
                            <button
                                onClick={async () => {
                                    const confirmed = await confirm({
                                        title: 'Clear History',
                                        message: 'Clear all video history? This cannot be undone.',
                                        confirmText: 'Clear All',
                                        variant: 'danger'
                                    });
                                    if (confirmed) {
                                        clearVideoGallery();
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
                    {history.map((vid) => (
                        <div
                            key={vid.id}
                            onClick={() => setViewVideo({ url: vid.url, prompt: vid.prompt })}
                            className="group relative cursor-pointer rounded-lg overflow-hidden border border-white/5 hover:border-zinc-500/50 transition-all opacity-80 hover:opacity-100 aspect-square"
                        >
                            <video src={vid.url} className="w-full aspect-square object-cover" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-2">
                                    <p className="text-xs text-white line-clamp-2">{vid.prompt}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-gray-400">🔍 View</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                loadHistoryVideo(vid);
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
                            No videos yet<br />Generate your first clip!
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
                            Video Generator
                        </h1>
                        <p className="text-xs text-zinc-500">Create stunning videos with AI</p>
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
                                    placeholder="Describe the video you want to generate..."
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

                            {/* Settings */}
                            <div className="bg-zinc-900 border border-white/5 rounded-xl p-5 space-y-6">
                                {/* Duration Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-sm font-medium text-zinc-300">Duration</label>
                                        <span className="text-xs text-zinc-400 font-mono bg-zinc-800 px-2 py-1 rounded">{settings.duration}s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="2"
                                        max="10"
                                        step="1"
                                        value={settings.duration}
                                        onChange={(e) => setSettings({ ...settings, duration: parseInt(e.target.value) })}
                                        className="w-full h-1.5 bg-black/50 rounded-lg appearance-none cursor-pointer accent-zinc-200"
                                    />
                                    <div className="flex justify-between text-[10px] text-zinc-600 mt-2">
                                        <span>2s</span>
                                        <span>10s</span>
                                    </div>
                                </div>

                                {/* Aspect Ratio Buttons */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-3">Aspect Ratio</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setSettings({ ...settings, aspectRatio: '16:9', width: 1280, height: 720 })}
                                            className={`p-3 rounded-lg border transition-all flex items-center justify-between group ${settings.aspectRatio === '16:9'
                                                ? 'bg-zinc-100 border-zinc-100 text-black'
                                                : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-zinc-800'
                                                }`}
                                        >
                                            <span className="text-xs font-medium">Landscape</span>
                                            <span className="text-[10px] opacity-70">16:9</span>
                                        </button>
                                        <button
                                            onClick={() => setSettings({ ...settings, aspectRatio: '9:16', width: 720, height: 1280 })}
                                            className={`p-3 rounded-lg border transition-all flex items-center justify-between group ${settings.aspectRatio === '9:16'
                                                ? 'bg-zinc-100 border-zinc-100 text-black'
                                                : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-zinc-800'
                                                }`}
                                        >
                                            <span className="text-xs font-medium">Portrait</span>
                                            <span className="text-[10px] opacity-70">9:16</span>
                                        </button>
                                    </div>
                                </div>
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
                                            <option value="seedance-pro">Seedance Pro</option>
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
                                        <span>Generate Video</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Right Column - Result Display */}
                        <div className="space-y-4 md:space-y-6">
                            {/* Result Display */}
                            <div className="bg-zinc-900 border border-white/5 rounded-xl p-6 min-h-[500px] flex flex-col">
                                {generatedVideo ? (
                                    <>
                                        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
                                            <h3 className="text-sm font-semibold text-zinc-200">Result</h3>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => handleDownload(generatedVideo, prompt)}
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
                                                        <p className="text-sm text-zinc-200 font-medium">Creating video...</p>
                                                    </div>
                                                </div>
                                            )}
                                            <video
                                                src={generatedVideo}
                                                controls
                                                autoPlay
                                                loop
                                                className="w-full h-full object-contain"
                                                onClick={() => setViewVideo({ url: generatedVideo, prompt: prompt })}
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
                                        <p className="text-zinc-500 text-sm">Validating prompt and allocating resources</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 text-2xl">
                                            🎬
                                        </div>
                                        <h3 className="text-zinc-200 font-medium mb-2">Ready to Direct</h3>
                                        <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-8">
                                            Enter a prompt and choose your settings to generate stunning AI videos.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Screen Video Modal */}
            {viewVideo && (
                <div
                    className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
                    onClick={() => setViewVideo(null)}
                >
                    <div className="absolute top-4 right-4 z-50 flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(viewVideo.url, viewVideo.prompt);
                            }}
                            className="bg-black/50 hover:bg-zinc-800 text-zinc-100 p-3 rounded-full backdrop-blur transition-all border border-white/10"
                            title="Download"
                        >
                            ⬇️
                        </button>
                        <button
                            onClick={() => setViewVideo(null)}
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
                        <video
                            src={viewVideo.url}
                            controls
                            autoPlay
                            loop
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
                        />

                        <div className="mt-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 max-w-2xl text-center">
                            <p className="text-zinc-200 text-sm sm:text-base font-medium line-clamp-2">{viewVideo.prompt}</p>
                            <div className="flex justify-center gap-4 mt-2">
                                <button
                                    onClick={() => {
                                        setPrompt(viewVideo.prompt);
                                        setViewVideo(null);
                                    }}
                                    className="text-xs text-zinc-400 hover:text-white hover:underline"
                                >
                                    Use This Prompt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
