"use client";

import { useState, useEffect, useRef, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// @ts-ignore
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// @ts-ignore
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface AssistantMessageProps {
    content: string;
    isLatest?: boolean;
    isLoading?: boolean;
}

// Markdown components config
const markdownComponents = {
    p: ({ children }: any) => <p className="mb-4 last:mb-0">{children}</p>,
    code: ({ children }: any) => (
        <code className="font-mono text-[13px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-200">
            {children}
        </code>
    ),
    pre: ({ children }: any) => {
        const codeElement = children?.props;
        const codeContent = codeElement?.children || "";
        const className = codeElement?.className || "";
        const match = /language-(\w+)/.exec(className);
        const lang = match ? match[1] : "code";

        return (
            <div className="relative group/code my-6 rounded-xl overflow-hidden border border-white/5 bg-[#0d0d0d] shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/5 text-zinc-400">
                    <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">{lang}</span>
                    <button
                        onClick={() => navigator.clipboard.writeText(String(codeContent))}
                        className="text-[11px] font-medium hover:text-white transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                        Copy code
                    </button>
                </div>
                <div className="p-4 sm:p-5 overflow-x-auto selection:bg-blue-500/30">
                    <SyntaxHighlighter
                        language={lang === "code" ? "text" : lang}
                        style={atomDark}
                        customStyle={{
                            margin: 0,
                            padding: 0,
                            backgroundColor: "transparent",
                            fontSize: "13.5px",
                            lineHeight: "1.7",
                        }}
                    >
                        {String(codeContent).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                </div>
            </div>
        );
    },
    ul: ({ children }: any) => <ul className="list-disc list-outside ml-5 mb-5 space-y-2">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-outside ml-5 mb-5 space-y-2">{children}</ol>,
    h1: ({ children }: any) => {
        const text = Array.isArray(children) ? children[0] : children;
        if (typeof text === 'string') {
            const match = text.match(/^(\d+)[\.:\s]+(.*)$/);
            if (match) {
                return (
                    <h1 className="flex items-center gap-3 text-2xl font-bold mb-6 text-zinc-100 mt-10">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-900/30">{match[1]}</span>
                        <span>{match[2]}</span>
                    </h1>
                );
            }
        }
        return <h1 className="text-2xl font-bold mb-6 text-zinc-100 mt-10 tracking-tight">{children}</h1>;
    },
    h2: ({ children }: any) => {
        const text = Array.isArray(children) ? children[0] : children;
        if (typeof text === 'string') {
            const match = text.match(/^(\d+)[\.:\s]+(.*)$/);
            if (match) {
                return (
                    <h2 className="flex items-center gap-3 text-xl font-bold mb-5 text-zinc-100 mt-8">
                        <span className="flex-shrink-0 w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-[13px] font-bold shadow-lg shadow-blue-900/30">{match[1]}</span>
                        <span>{match[2]}</span>
                    </h2>
                );
            }
        }
        return <h2 className="text-xl font-bold mb-5 text-zinc-100 mt-8 tracking-tight">{children}</h2>;
    },
    h3: ({ children }: any) => <h3 className="text-lg font-bold mb-4 text-zinc-100 mt-6 tracking-tight">{children}</h3>,
    blockquote: ({ children }: any) => <blockquote className="border-l-2 border-indigo-500/50 pl-4 italic text-zinc-400 my-4">{children}</blockquote>,
    table: ({ children }: any) => <div className="overflow-x-auto my-6 rounded-lg border border-white/5"><table className="w-full text-left border-collapse text-sm">{children}</table></div>,
    thead: ({ children }: any) => <thead className="bg-white/5 text-zinc-200">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="divide-y divide-white/5">{children}</tbody>,
    tr: ({ children }: any) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
    th: ({ children }: any) => <th className="p-4 font-semibold border-b border-white/10 uppercase text-xs tracking-wider text-zinc-400">{children}</th>,
    td: ({ children }: any) => <td className="p-4 text-zinc-300 align-top">{children}</td>,
    a: ({ href, children }: any) => {
        // Check if the URL points to an image
        const isImageUrl = href && /\.(jpg|jpeg|png|gif|webp|bmp|svg|avif)(\?.*)?$/i.test(href);
        if (isImageUrl) {
            return (
                <div className="my-3">
                    <a href={href} target="_blank" rel="noopener noreferrer" className="block group/img">
                        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 max-w-sm">
                            <img
                                src={href}
                                alt={typeof children === 'string' ? children : 'Image'}
                                className="w-full h-auto object-cover rounded-xl transition-transform duration-300 group-hover/img:scale-105"
                                loading="lazy"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = `<div class="flex items-center gap-2 p-4 text-zinc-500 text-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>Failed to load</div>`;
                                }}
                            />
                        </div>
                        <div className="text-xs text-zinc-500 mt-1.5 truncate max-w-sm hover:text-blue-400 transition-colors">{typeof children === 'string' ? children : href}</div>
                    </a>
                </div>
            );
        }
        return (
            <a href={href} className="text-blue-400 hover:text-blue-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>
        );
    },
    img: ({ src, alt }: any) => (
        <div className="my-3">
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 max-w-sm">
                <img
                    src={src}
                    alt={alt || 'Image'}
                    className="w-full h-auto object-cover rounded-xl"
                    loading="lazy"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="flex items-center gap-2 p-4 text-zinc-500 text-sm">Failed to load image</div>`;
                    }}
                />
            </div>
            {alt && alt !== 'Image' && <div className="text-xs text-zinc-500 mt-1.5">{alt}</div>}
        </div>
    ),
};

// Typing animation component - simpler approach
function TypingContent({ content, isLatest }: { content: string; isLatest: boolean }) {
    const [displayedLength, setDisplayedLength] = useState(content.length);
    const prevContentLengthRef = useRef(0);

    useEffect(() => {
        // If not the latest message, always show full content
        if (!isLatest) {
            setDisplayedLength(content.length);
            prevContentLengthRef.current = content.length;
            return;
        }

        // For latest message during streaming, animate gradually
        // Start from where we left off (or content length if content shrunk/changed)
        const startFrom = Math.min(displayedLength, content.length);

        if (startFrom >= content.length) {
            // Already showing all content
            prevContentLengthRef.current = content.length;
            return;
        }

        // Animate from current position to full content
        let currentPos = startFrom;
        const timer = setInterval(() => {
            currentPos += 3 + Math.floor(Math.random() * 3); // 3-5 chars per tick
            if (currentPos >= content.length) {
                setDisplayedLength(content.length);
                clearInterval(timer);
            } else {
                setDisplayedLength(currentPos);
            }
        }, 15);

        return () => clearInterval(timer);
    }, [content, isLatest, displayedLength]);

    const displayedContent = content.slice(0, displayedLength);
    const isTyping = isLatest && displayedLength < content.length;

    return (
        <>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
            >
                {displayedContent}
            </ReactMarkdown>
            {isTyping && (
                <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse rounded-sm" />
            )}
        </>
    );
}

export const AssistantMessage = memo(function AssistantMessage({
    content,
    isLatest = false,
    isLoading = false
}: AssistantMessageProps) {
    // Loading state - show bouncing dots
    if (!content && isLoading) {
        return (
            <div className="flex items-center gap-2 text-zinc-400">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm">Thinking...</span>
            </div>
        );
    }

    // No content - return nothing
    if (!content) {
        return null;
    }

    // Render content with typing animation for latest message
    return (
        <div className="text-zinc-300/90 leading-7">
            <TypingContent content={content} isLatest={isLatest} />
        </div>
    );
});
