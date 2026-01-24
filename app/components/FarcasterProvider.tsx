'use client';

import { useEffect, useState, ReactNode } from 'react';


export default function FarcasterProvider({ children }: { children: ReactNode }) {
    const [isSDKLoaded, setIsSDKLoaded] = useState(false);

    useEffect(() => {
        const initSdk = async () => {
            try {
                // Dynamically import the SDK to ensure it only runs on the client
                const sdk = (await import('@farcaster/miniapp-sdk')).default;

                console.log('Farcaster SDK: Calling ready()');
                await sdk.actions.ready();
                console.log('Farcaster SDK: ready() called successfully');
                setIsSDKLoaded(true);
            } catch (error) {
                console.error('Farcaster SDK: Error initializing:', error);
            }
        };

        if (typeof window !== 'undefined' && !isSDKLoaded) {
            initSdk();
        }
    }, [isSDKLoaded]);

    return <>{children}</>;
}
