"use client";

import { useState, useCallback, createContext, useContext, ReactNode } from "react";

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmProvider");
    }
    return context.confirm;
}

interface ConfirmProviderProps {
    children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setOptions(opts);
            setIsOpen(true);
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolvePromise?.(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolvePromise?.(false);
    };

    const variantStyles = {
        danger: {
            icon: "🗑️",
            confirmBg: "bg-red-500 hover:bg-red-600",
            border: "border-red-500/30",
            glow: "shadow-red-500/20",
        },
        warning: {
            icon: "⚠️",
            confirmBg: "bg-amber-500 hover:bg-amber-600",
            border: "border-amber-500/30",
            glow: "shadow-amber-500/20",
        },
        info: {
            icon: "ℹ️",
            confirmBg: "bg-blue-500 hover:bg-blue-600",
            border: "border-blue-500/30",
            glow: "shadow-blue-500/20",
        },
    };

    const variant = options?.variant || "danger";
    const styles = variantStyles[variant];

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Custom Confirm Modal */}
            {isOpen && options && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={handleCancel}
                >
                    <div
                        className={`bg-zinc-900 border ${styles.border} rounded-2xl p-6 max-w-sm w-full shadow-2xl ${styles.glow} animate-in zoom-in-95 duration-200`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className={`w-16 h-16 rounded-full bg-zinc-800 ${styles.border} border flex items-center justify-center text-3xl`}>
                                {styles.icon}
                            </div>
                        </div>

                        {/* Title */}
                        {options.title && (
                            <h3 className="text-xl font-bold text-white text-center mb-2">
                                {options.title}
                            </h3>
                        )}

                        {/* Message */}
                        <p className="text-gray-300 text-center mb-6 text-sm">
                            {options.message}
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all border border-zinc-700"
                            >
                                {options.cancelText || "Cancel"}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 px-4 py-3 ${styles.confirmBg} text-white rounded-xl font-medium transition-all`}
                            >
                                {options.confirmText || "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
