'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpotlightOverlayProps {
    targetId: string | null;
    padding?: number;
}

export default function SpotlightOverlay({ targetId, padding = 8 }: SpotlightOverlayProps) {
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (!targetId) {
            setRect(null);
            return;
        }

        let resizeObserver: ResizeObserver | null = null;

        const updateRect = () => {
            let effectiveTargetId = targetId;

            const element = document.getElementById(effectiveTargetId);
            if (element) {
                const newRect = element.getBoundingClientRect();
                setRect(newRect);

                // If we don't have an observer yet, create one for this element
                if (!resizeObserver) {
                    resizeObserver = new ResizeObserver(() => {
                        setRect(element.getBoundingClientRect());
                    });
                    resizeObserver.observe(element);
                }
            }
        };

        updateRect();

        // Extra sync for the first 2 seconds to catch any late layout shifts/animations
        const syncInterval = setInterval(updateRect, 100);
        const syncTimeout = setTimeout(() => clearInterval(syncInterval), 2000);

        window.addEventListener('resize', updateRect);
        window.addEventListener('scroll', updateRect);

        return () => {
            clearInterval(syncInterval);
            clearTimeout(syncTimeout);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [targetId]);

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            <svg className="w-full h-full">
                <defs>
                    <linearGradient id="spotlight-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="50%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#A855F7" />
                        <animateTransform
                            attributeName="gradientTransform"
                            type="rotate"
                            from="0 0.5 0.5"
                            to="360 0.5 0.5"
                            dur="3s"
                            repeatCount="indefinite"
                        />
                    </linearGradient>
                    <mask id="spotlight-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <AnimatePresence>
                            {rect && (
                                <motion.rect
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        x: rect.left - padding,
                                        y: rect.top - padding,
                                        width: rect.width + padding * 2,
                                        height: rect.height + padding * 2,
                                        rx: 16,
                                        opacity: 1
                                    }}
                                    exit={{ opacity: 0 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    fill="black"
                                />
                            )}
                        </AnimatePresence>
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.82)"
                    mask="url(#spotlight-mask)"
                    className="backdrop-blur-[2px]"
                />

                {/* Animated Border */}
                <AnimatePresence>
                    {rect && (
                        <motion.rect
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                                x: rect.left - padding,
                                y: rect.top - padding,
                                width: rect.width + padding * 2,
                                height: rect.height + padding * 2,
                                rx: 16,
                                opacity: 1,
                                scale: 1
                            }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            fill="none"
                            stroke="url(#spotlight-gradient)"
                            strokeWidth="2.5"
                            className="drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                        />
                    )}
                </AnimatePresence>
            </svg>
        </div>
    );
}
