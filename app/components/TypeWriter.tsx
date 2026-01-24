"use client";

import { useState, useEffect, useRef } from "react";

interface TypeWriterProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
    isStreaming?: boolean;
    children: (displayedText: string, isTyping: boolean) => React.ReactNode;
}

export function TypeWriter({
    text,
    speed = 15,
    onComplete,
    isStreaming = false,
    children
}: TypeWriterProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const lastTextRef = useRef(text);
    const displayedLengthRef = useRef(0);

    useEffect(() => {
        // If streaming, just show all text as it comes
        if (isStreaming) {
            setDisplayedText(text);
            setIsTyping(true);
            return;
        }

        // If text changed substantially (new message), reset
        if (text !== lastTextRef.current && displayedLengthRef.current >= lastTextRef.current.length) {
            setDisplayedText("");
            displayedLengthRef.current = 0;
        }
        lastTextRef.current = text;

        if (displayedLengthRef.current >= text.length) {
            setIsTyping(false);
            onComplete?.();
            return;
        }

        setIsTyping(true);

        const timer = setInterval(() => {
            if (displayedLengthRef.current < text.length) {
                // Add multiple characters per tick for faster typing
                const charsToAdd = Math.min(3, text.length - displayedLengthRef.current);
                displayedLengthRef.current += charsToAdd;
                setDisplayedText(text.slice(0, displayedLengthRef.current));
            } else {
                clearInterval(timer);
                setIsTyping(false);
                onComplete?.();
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed, onComplete, isStreaming]);

    return <>{children(displayedText, isTyping)}</>;
}

// Simpler hook-based approach for use in components
export function useTypeWriter(text: string, options?: { speed?: number; enabled?: boolean }) {
    const { speed = 15, enabled = true } = options || {};
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const indexRef = useRef(0);
    const prevTextRef = useRef("");

    useEffect(() => {
        if (!enabled) {
            setDisplayedText(text);
            setIsComplete(true);
            return;
        }

        // Text grew (streaming) - animate only new characters
        if (text.startsWith(prevTextRef.current) && text.length > prevTextRef.current.length) {
            // Continue from where we left off
        } else if (text !== prevTextRef.current) {
            // Text completely changed - reset
            indexRef.current = 0;
            setDisplayedText("");
            setIsComplete(false);
        }
        prevTextRef.current = text;

        if (indexRef.current >= text.length) {
            setIsComplete(true);
            return;
        }

        const timer = setInterval(() => {
            if (indexRef.current < text.length) {
                // Type 2-4 characters at a time for natural feel
                const charsToAdd = Math.min(2 + Math.floor(Math.random() * 2), text.length - indexRef.current);
                indexRef.current += charsToAdd;
                setDisplayedText(text.slice(0, indexRef.current));
            } else {
                clearInterval(timer);
                setIsComplete(true);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed, enabled]);

    return { displayedText, isComplete, isTyping: !isComplete && displayedText.length < text.length };
}
