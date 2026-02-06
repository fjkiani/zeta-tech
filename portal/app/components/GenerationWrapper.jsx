'use client';

import React, { useState } from 'react';
import GenerationCard from './GenerationCard';
import { motion } from 'framer-motion';

/**
 * Wraps content in a "NotebookLM Generation" flow.
 * Initially shows the GenerationCard.
 * On click, simulates generation, then reveals children.
 */
export default function GenerationWrapper({
    children,
    title,
    subtitle,
    buttonLabel,
    loadingLabel
}) {
    const [unlocked, setUnlocked] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleUnlock = () => {
        setGenerating(true);
        // Fake generation delay
        setTimeout(() => {
            setGenerating(false);
            setUnlocked(true);
        }, 2500);
    };

    if (!unlocked) {
        return (
            <GenerationCard
                title={title}
                subtitle={subtitle}
                buttonLabel={buttonLabel}
                loading={generating}
                onClick={handleUnlock}
                loadingLabel={loadingLabel}
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {children}
        </motion.div>
    );
}
