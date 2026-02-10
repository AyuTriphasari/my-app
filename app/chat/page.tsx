'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { sendChatMessage, ChatMessage } from '@/lib/pollination';
import { useConfirm } from '@/app/components/ConfirmModal';
import { AssistantMessage } from '@/app/components/AssistantMessage';

const getMessageText = (content: string | any[] | undefined) => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content.find(c => c.type === 'text')?.text || '';
    }
    return '';
};

const CONVERSATIONS_STORAGE_KEY = 'zlk_conversations';
const CURRENT_CONVERSATION_KEY = 'zlk_current_conversation';
const API_KEY_STORAGE = 'pollination_api_key';

interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    model: string;
    timestamp: number;
}

const SUGGESTED_PROMPTS = [
    "Explain quantum computing like I'm 5",
    "Write a Python script to analyze data",
    "Help me plan a trip to Japan",
    "Create a workout routine for beginners",
    "Explain the latest AI developments",
    "Write a creative short story"
];

export default function ChatPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
    const [editedContent, setEditedContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const confirm = useConfirm();

    const currentConversation = conversations.find(c => c.id === currentConversationId);

    // Load data from localStorage on mount
    useEffect(() => {
        try {
            const savedConversations = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
            const savedCurrentId = localStorage.getItem(CURRENT_CONVERSATION_KEY);
            const savedApiKey = localStorage.getItem(API_KEY_STORAGE);

            if (savedConversations) {
                const parsed = JSON.parse(savedConversations);
                setConversations(parsed);
                if (savedCurrentId && parsed.find((c: Conversation) => c.id === savedCurrentId)) {
                    setCurrentConversationId(savedCurrentId);
                } else if (parsed.length > 0) {
                    setCurrentConversationId(parsed[0].id);
                }
            }

            if (savedApiKey) {
                setApiKey(savedApiKey);
            }

            // Check for API key in URL fragment
            const hash = window.location.hash;
            if (hash.includes('api_key=')) {
                const apiKeyMatch = hash.match(/api_key=([^&]+)/);
                if (apiKeyMatch) {
                    const key = apiKeyMatch[1];
                    setApiKey(key);
                    localStorage.setItem(API_KEY_STORAGE, key);
                    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
        setIsLoaded(true);
    }, []);

    // Save conversations to localStorage
    useEffect(() => {
        if (isLoaded && conversations.length > 0) {
            try {
                localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
            } catch (error) {
                console.error('Failed to save conversations:', error);
            }
        }
    }, [conversations, isLoaded]);

    // Save current conversation ID
    useEffect(() => {
        if (isLoaded && currentConversationId) {
            try {
                localStorage.setItem(CURRENT_CONVERSATION_KEY, currentConversationId);
            } catch (error) {
                console.error('Failed to save current conversation:', error);
            }
        }
    }, [currentConversationId, isLoaded]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + K: New chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                handleNewChat();
            }
            // Ctrl/Cmd + Shift + L: Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                setIsSidebarOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Auto-close sidebar on mobile
        if (window.innerWidth < 640) {
            setIsSidebarOpen(false);
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentConversation?.messages]);

    const generateTitle = (firstMessage: string): string => {
        const words = firstMessage.split(' ').slice(0, 6).join(' ');
        return words.length > 40 ? words.substring(0, 40) + '...' : words;
    };

    const handleNewChat = (): Conversation => {
        const newConversation: Conversation = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [
                {
                    role: "assistant",
                    content: "Tell me what you need—I’ll help you figure it out."
                }
            ],
            model: currentConversation?.model || 'openai',
            timestamp: Date.now()
        };
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversationId(newConversation.id);
        return newConversation;
    };

    const handleDeleteConversation = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Conversation',
            message: 'Delete this conversation?',
            confirmText: 'Delete',
            variant: 'danger'
        });
        if (confirmed) {
            const newConversations = conversations.filter(c => c.id !== id);
            setConversations(newConversations);
            if (currentConversationId === id) {
                setCurrentConversationId(newConversations[0]?.id || null);
            }
        }
    };

    const handleRenameConversation = (id: string, newTitle: string) => {
        setConversations(prev => prev.map(c =>
            c.id === id ? { ...c, title: newTitle } : c
        ));
        setRenamingConversationId(null);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setSelectedFile(null);
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                    setSelectedFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setSelectedImage(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                }
                return;
            }
        }
    };

    const handleSend = async (messageContent?: string, targetConversationOrId?: string | Conversation) => {
        const contentText = messageContent || input;
        if ((!contentText.trim() && !selectedImage) || isLoading) return;

        let targetId: string;
        let targetConversation: Conversation | undefined;

        if (typeof targetConversationOrId === 'object') {
            targetConversation = targetConversationOrId;
            targetId = targetConversation.id;
        } else {
            targetId = (targetConversationOrId || currentConversationId) as string;
            if (!targetId) return;
            targetConversation = conversations.find(c => c.id === targetId);
        }

        if (!targetConversation) {
            console.error('No conversation found');
            return;
        }

        // Capture current state immediately
        const currentSelectedImage = selectedImage;
        const currentSelectedFile = selectedFile;
        let finalContent: string | any[] = contentText;

        // Optimistic UI update with local base64 image
        if (currentSelectedImage && !messageContent) {
            finalContent = [
                { type: "text", text: contentText },
                { type: "image_url", image_url: { url: currentSelectedImage } }
            ];
        }

        const userMessage: ChatMessage = { role: 'user', content: finalContent };
        const updatedMessages = [...targetConversation.messages, userMessage];

        // 1. Immediate UI update
        setConversations(prev => prev.map(c =>
            c.id === targetId
                ? { ...c, messages: updatedMessages, timestamp: Date.now() }
                : c
        ));

        // Auto-generate title from first user message
        if (targetConversation.title === 'New Chat' && targetConversation.messages.length === 1) {
            const title = generateTitle(contentText);
            setConversations(prev => prev.map(c =>
                c.id === targetId ? { ...c, title } : c
            ));
        }

        // Clear input and show loading state immediately
        setInput('');
        setSelectedImage(null);
        setSelectedFile(null);
        setIsLoading(true);

        // Add empty assistant message for streaming
        const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
        setConversations(prev => prev.map(c =>
            c.id === targetId
                ? { ...c, messages: [...updatedMessages, assistantMessage], timestamp: Date.now() }
                : c
        ));

        // 2. Perform upload in background
        let uploadedImageUrl = currentSelectedImage;
        if (currentSelectedFile) {
            try {
                const formData = new FormData();
                formData.append("file", currentSelectedFile);

                const uploadRes = await fetch("/api/uploadR2", {
                    method: "POST",
                    body: formData
                });

                if (uploadRes.ok) {
                    const { url } = await uploadRes.json();
                    uploadedImageUrl = url;

                    // Update the conversation state with the real R2 URL for persistence
                    // We need to find the user message we just added and update its content URL
                    setConversations(prev => prev.map(c => {
                        if (c.id === targetId) {
                            const msgs = [...c.messages];
                            // The user message is at index: msgs.length - 2 (since we added assistant message last)
                            const userMsgIndex = msgs.length - 2;
                            if (userMsgIndex >= 0 && msgs[userMsgIndex].role === 'user') {
                                const newContent = [
                                    { type: "text", text: contentText },
                                    { type: "image_url", image_url: { url: uploadedImageUrl } }
                                ];
                                msgs[userMsgIndex] = { ...msgs[userMsgIndex], content: newContent };
                            }
                            return { ...c, messages: msgs };
                        }
                        return c;
                    }));
                }
            } catch (error) {
                console.error("Error uploading image:", error);
            }
        }

        // Prepare content for API call using the URL we have (uploaded or fallback)
        let apiContent: string | any[] = contentText;
        if (uploadedImageUrl && !messageContent) {
            apiContent = [
                { type: "text", text: contentText },
                { type: "image_url", image_url: { url: uploadedImageUrl } }
            ];
        }

        // Use the updated messages list with the correct URL for the API call
        const apiMessages = [...targetConversation.messages, { role: 'user', content: apiContent }];

        try {
            // Build URL with params
            const params = new URLSearchParams({
                model: targetConversation.model,
            });
            if (apiKey) {
                params.append('apiKey', apiKey);
            }

            const response = await fetch(`/api/chat?${params.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: apiMessages,
                    model: targetConversation.model,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let accumulatedContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            break;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                accumulatedContent += parsed.content;

                                // Update message with accumulated content
                                setConversations(prev => prev.map(c =>
                                    c.id === targetId
                                        ? {
                                            ...c,
                                            messages: [
                                                ...updatedMessages,
                                                { role: 'assistant', content: accumulatedContent }
                                            ],
                                            timestamp: Date.now()
                                        }
                                        : c
                                ));
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            // Final update to ensure message is saved
            if (accumulatedContent) {
                setConversations(prev => prev.map(c =>
                    c.id === targetId
                        ? {
                            ...c,
                            messages: [
                                ...updatedMessages,
                                { role: 'assistant', content: accumulatedContent }
                            ],
                            timestamp: Date.now()
                        }
                        : c
                ));
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            };
            setConversations(prev => prev.map(c =>
                c.id === targetId
                    ? { ...c, messages: [...updatedMessages, errorMessage], timestamp: Date.now() }
                    : c
            ));
        } finally {
            setIsLoading(false);
            // Refocus textarea after generation is done or failed
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 10);
        }
    };

    const handleRegenerateResponse = async (messageIndex: number) => {
        if (!currentConversation || isLoading) return;

        const messagesUpToPoint = currentConversation.messages.slice(0, messageIndex);
        setConversations(prev => prev.map(c =>
            c.id === currentConversationId
                ? { ...c, messages: messagesUpToPoint }
                : c
        ));
        setIsLoading(true);

        try {
            const response = await sendChatMessage(messagesUpToPoint, currentConversation.model, apiKey);
            setConversations(prev => prev.map(c =>
                c.id === currentConversationId
                    ? { ...c, messages: [...messagesUpToPoint, { role: 'assistant', content: response }] }
                    : c
            ));
        } catch (error) {
            console.error('Failed to regenerate:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditMessage = (index: number) => {
        setEditingMessageIndex(index);
        setEditedContent(getMessageText(currentConversation?.messages[index].content) || '');
    };

    const handleSaveEdit = async () => {
        if (!currentConversation || editingMessageIndex === null) return;

        const updatedMessages = currentConversation.messages.slice(0, editingMessageIndex);
        updatedMessages.push({ role: 'user', content: editedContent });

        setConversations(prev => prev.map(c =>
            c.id === currentConversationId
                ? { ...c, messages: updatedMessages }
                : c
        ));
        setEditingMessageIndex(null);
        setIsLoading(true);

        try {
            const response = await sendChatMessage(updatedMessages, currentConversation.model, apiKey);
            setConversations(prev => prev.map(c =>
                c.id === currentConversationId
                    ? { ...c, messages: [...updatedMessages, { role: 'assistant', content: response }] }
                    : c
            ));
        } catch (error) {
            console.error('Failed to send edited message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = (index: number, feedback: 'like' | 'dislike') => {
        if (!currentConversationId) return;
        setConversations(prev => prev.map(c => {
            if (c.id === currentConversationId) {
                const newMessages = [...c.messages];
                newMessages[index] = {
                    ...newMessages[index],
                    feedback: newMessages[index].feedback === feedback ? undefined : feedback
                };
                return { ...c, messages: newMessages };
            }
            return c;
        }));
    };

    const handleExportConversation = () => {
        if (!currentConversation) return;

        const markdown = `# ${currentConversation.title}\n\n` +
            currentConversation.messages.map(m =>
                `**${m.role === 'user' ? 'You' : 'Assistant'}:**\n\n${getMessageText(m.content)}\n\n---\n`
            ).join('\n');

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentConversation.title}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleConnectPollinations = () => {
        const redirectUrl = window.location.href.split('#')[0];
        window.location.href = `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
    };

    const handleDisconnect = () => {
        setApiKey('');
        localStorage.removeItem(API_KEY_STORAGE);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.messages.some(m => getMessageText(m.content).toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-zinc-950 text-zinc-200 font-sans selection:bg-blue-500/30 relative overflow-hidden">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 sm:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`${isSidebarOpen ? 'w-[260px] translate-x-0' : 'w-0 -translate-x-full sm:translate-x-0 sm:w-0'} absolute sm:relative z-40 h-full bg-black flex-shrink-0 transition-all duration-300 flex flex-col overflow-hidden`}>

                {/* New Chat & Search Group */}
                <div className="p-3 pb-0 space-y-2">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-lg text-sm transition-colors border border-white/5 text-left group"
                    >
                        <div className="p-1 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        </div>
                        <span className="font-medium">New Chat</span>
                    </button>

                    {/* Search */}
                    <div className="relative group">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3 text-zinc-500 group-focus-within:text-zinc-300"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-transparent hover:bg-zinc-900/50 focus:bg-zinc-900 rounded-lg text-zinc-300 text-sm placeholder-zinc-500 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
                    <div className="text-xs font-medium text-zinc-500 px-2 py-2">History</div>
                    {filteredConversations.map(conv => (
                        <div
                            key={conv.id}
                            className={`group relative p-2.5 rounded-lg cursor-pointer transition-all ${currentConversationId === conv.id
                                ? 'bg-zinc-800/80 text-white'
                                : 'hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                                }`}
                            onClick={() => setCurrentConversationId(conv.id)}
                        >
                            {renamingConversationId === conv.id ? (
                                <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onBlur={() => handleRenameConversation(conv.id, renameValue)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleRenameConversation(conv.id, renameValue)}
                                    className="w-full px-1 py-0.5 bg-zinc-950 border border-blue-500/50 rounded text-white text-sm focus:outline-none"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-70"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                    <div className="text-sm truncate flex-1">{conv.title}</div>
                                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center bg-zinc-900 shadow-xl pl-1 gap-1 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setRenamingConversationId(conv.id);
                                                setRenameValue(conv.title);
                                            }}
                                            className="p-1 hover:text-white"
                                            title="Rename"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteConversation(conv.id);
                                            }}
                                            className="p-1 hover:text-red-400"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Sidebar Footer */}
                <div className="p-3 border-t border-white/5 space-y-2">
                    {!apiKey ? (
                        <button
                            onClick={handleConnectPollinations}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                        >
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">⚡</div>
                            Connect API key
                        </button>
                    ) : (
                        <div className="space-y-1">
                            <div className="px-3 py-1.5 text-xs text-zinc-500 font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Personal API Active
                            </div>
                            <button
                                onClick={handleDisconnect}
                                className="w-full text-left px-3 py-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg text-xs transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative">
                {/* Chat Header */}
                <div className="h-14 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-lg transition-all"
                            title="Toggle Sidebar (Ctrl+Shift+L)"
                        >
                            {isSidebarOpen ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M9 3v18" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M3 9h18" /></svg>
                            )}
                        </button>
                        <h1 className="text-sm font-medium text-zinc-200 truncate max-w-[200px] sm:max-w-md">
                            {currentConversation?.title || 'New Conversation'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentConversation && (
                            <>
                                <select
                                    value={currentConversation.model}
                                    onChange={(e) => setConversations(prev => prev.map(c =>
                                        c.id === currentConversationId ? { ...c, model: e.target.value } : c
                                    ))}
                                    className="px-3 py-1.5 bg-zinc-800 border border-white/5 rounded-md text-zinc-300 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-600 cursor-pointer hover:bg-zinc-700 transition-colors"
                                    disabled={isLoading}
                                >
                                    <option value="perplexity-fast">Perplexity Fast</option>
                                    <option value="nomnom">Gemini 3 nomnom</option>
                                    <option value="nova-fast">Nova Micro</option>
                                    <option value="mistral">Mistral</option>
                                    <option value="openai">GPT-5</option>
                                    <option value="gemini-search">Gemini 3</option>
                                    <option value="openai">GPT-5 Mini</option>
                                    <option value="deepseek">DeepSeek</option>
                                    <option value="claude">Claude</option>
                                    <option value="glm">GLM-4.7</option>
                                    <option value="openai-large">GPT-5.2</option>
                                </select>
                                <button
                                    onClick={handleExportConversation}
                                    className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-md transition-all"
                                    title="Export Conversation"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-0">
                    {!currentConversation ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto px-6">
                            <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-blue-900/20 mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                </div>
                                <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">
                                    Welcome to ZLK CYBER AI
                                </h2>
                                <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
                                    Experience advanced AI models with a clean, focused interface designed for productivity.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            const newConv = handleNewChat();
                                            // Pass the full object to avoid stale state issues
                                            setTimeout(() => handleSend(prompt, newConv), 10);
                                        }}
                                        className="p-4 bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 hover:border-blue-500/30 rounded-xl text-left transition-all group"
                                    >
                                        <div className="text-sm text-zinc-300 group-hover:text-blue-200 transition-colors">{prompt}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto py-6 space-y-8">
                            {currentConversation.messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group mb-6`}
                                >
                                    {message.role === 'assistant' ? (
                                        <div className="flex gap-4 w-full max-w-3xl">

                                            <div className="flex-1 min-w-0">
                                                <AssistantMessage
                                                    content={getMessageText(message.content)}
                                                    isLatest={index === currentConversation.messages.length - 1}
                                                    isLoading={!message.content && isLoading}
                                                />

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-2 transition-opacity">
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(getMessageText(message.content))}
                                                        className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                                                        title="Copy"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleFeedback(index, 'like')}
                                                        className={`p-1 transition-colors ${message.feedback === 'like' ? 'text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                        title="Like"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleFeedback(index, 'dislike')}
                                                        className={`p-1 transition-colors ${message.feedback === 'dislike' ? 'text-red-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                        title="Dislike"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" /></svg>
                                                    </button>
                                                    {index === currentConversation.messages.length - 1 && (
                                                        <button
                                                            onClick={() => handleRegenerateResponse(index)}
                                                            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                                                            title="Regenerate"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl px-5 py-3 bg-zinc-800 text-zinc-100">
                                            {editingMessageIndex === index ? (
                                                <div className="space-y-3 min-w-[300px]">
                                                    <textarea
                                                        value={editedContent}
                                                        onChange={(e) => setEditedContent(e.target.value)}
                                                        className="w-full p-2 bg-zinc-900/50 border border-white/10 rounded text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                                                        rows={3}
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => setEditingMessageIndex(null)}
                                                            className="px-2 py-1 text-xs text-zinc-400 hover:text-white"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {Array.isArray(message.content) ? (
                                                        <div className="space-y-2">
                                                            {/* Sort: images first, then text */}
                                                            {[...message.content]
                                                                .sort((a, b) => (a.type === 'image_url' ? -1 : 1))
                                                                .map((part: any, i: number) => {
                                                                    if (part.type === 'image_url') {
                                                                        return <img key={i} src={part.image_url.url} alt="Uploaded" className="max-w-full rounded-lg max-h-[300px]" />;
                                                                    }
                                                                    if (part.type === 'text') {
                                                                        return <p key={i} className="whitespace-pre-wrap leading-relaxed">{part.text}</p>;
                                                                    }
                                                                    return null;
                                                                })}
                                                        </div>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                                    )}
                                                    <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 absolute -left-10 sm:-left-8 top-2">
                                                        <button
                                                            onClick={() => handleEditMessage(index)}
                                                            className="p-1 text-zinc-500 hover:text-zinc-300"
                                                            title="Edit"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                {currentConversation && (
                    <div className="p-4 bg-zinc-950/80 backdrop-blur-md border-t border-white/5 pb-6">
                        <div className="max-w-3xl mx-auto relative group">
                            {selectedImage && (
                                <div className="absolute bottom-full left-0 mb-2 p-2 bg-zinc-900 border border-white/10 rounded-xl shadow-xl flex items-start gap-2 max-w-[200px] sm:max-w-xs">
                                    <img src={selectedImage} alt="Preview" className="w-20 h-20 object-cover rounded-lg bg-black" />
                                    <div className="flex-1 min-w-0">
                                    </div>
                                    <button
                                        onClick={handleRemoveImage}
                                        className="p-1 text-zinc-500 hover:text-white bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                accept="image/*"
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-3 bottom-3 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors z-10"
                                title="Upload Image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                            </button>

                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                onPaste={handlePaste}
                                placeholder="Message ZLKcyber AI..."
                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl pl-12 pr-14 py-4 focus:outline-none focus:ring-1 focus:ring-zinc-700/50 focus:border-zinc-700 transition-all text-zinc-200 placeholder-zinc-500 resize-none max-h-[200px] shadow-sm"
                                rows={1}
                                style={{ minHeight: '56px' }}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={(isLoading || (!input.trim() && !selectedImage))}
                                className="absolute right-2.5 bottom-2.5 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:shadow-none"
                            >
                                {isLoading ? (
                                    <span className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                                )}
                            </button>
                        </div>
                        <div className="max-w-3xl mx-auto mt-2 text-center">
                            <p className="text-[10px] text-zinc-600">
                                AI can make mistakes. Please verify important information.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
