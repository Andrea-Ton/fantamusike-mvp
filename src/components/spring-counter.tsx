'use client';

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface SpringCounterProps {
    from: number;
    to: number;
    className?: string;
}

export default function SpringCounter({ from, to, className }: SpringCounterProps) {
    const spring = useSpring(from, { mass: 0.8, stiffness: 75, damping: 15 });
    const display = useTransform(spring, (current) => Math.round(current));

    useEffect(() => {
        spring.set(to);
    }, [spring, to]);

    return <motion.span className={className}>{display}</motion.span>;
}
