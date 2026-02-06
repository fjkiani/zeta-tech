const fs = require('fs');
const path = require('path');

/**
 * Extracts intelligence (Objectives, Takeaways) from the lesson's context file.
 */
export function getLessonIntel(lessonId) {
    // 1. Locate the context file (dynamic priority)
    const contextPath = path.join(process.cwd(), 'data', 'lessons', lessonId, 'context.md');
    const transcriptPath = path.join(process.cwd(), 'data', 'lessons', lessonId, 'transcription.md');
    const legacyPath = path.resolve(process.cwd(), '../Bushwick-HS/context/python-datatypes.md');

    let content = '';
    if (fs.existsSync(contextPath)) {
        content += fs.readFileSync(contextPath, 'utf8') + '\n\n';
    }
    if (fs.existsSync(transcriptPath)) {
        content += fs.readFileSync(transcriptPath, 'utf8') + '\n\n';
    }

    if (!content && lessonId === 'python-intro' && fs.existsSync(legacyPath)) {
        content = fs.readFileSync(legacyPath, 'utf8'); // Fallback for demo
    }

    if (!content) {
        return { objectives: [], takeaways: [] };
    }

    // 2. Parse Objectives
    // Looking for: "will be able to:" OR "Objectives:" OR "Target Audience"
    const objectives = [];
    const objRegex = /(will be able to:|Objectives:|Target Audience)([\s\S]*?)(##|\n\n\n)/i;
    const objMatch = content.match(objRegex);

    if (objMatch && objMatch[1]) {
        const lines = objMatch[1].split('\n');
        lines.forEach(line => {
            const clean = line.trim();
            if (clean.startsWith('-') || clean.startsWith('*')) {
                objectives.push(clean.replace(/^[-*]\s*/, ''));
            }
        });
    }

    // 3. Parse Takeaways
    // Looking for "Key Insight:", "Core Workflow:", or "Common Errors"
    const takeaways = [];

    // Strategy: Find specific keywords and grab the line or section
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('Key Insight:') || line.includes('Core Workflow:') || line.includes('Analogy:')) {
            takeaways.push(line.replace(/\*\*/g, '').trim());
        }
    });

    // Also grab "Common Errors" bullets if they exist
    const errorsRegex = /Common Errors([\s\S]*?)(##|$)/i;
    const errorsMatch = content.match(errorsRegex);
    if (errorsMatch && errorsMatch[1]) {
        const errorLines = errorsMatch[1].split('\n');
        errorLines.forEach(line => {
            const clean = line.trim();
            if (/^\d+\./.test(clean)) { // 1. Error...
                takeaways.push(clean);
            }
        });
    }

    return {
        objectives: objectives.length > 0 ? objectives : ['Explore lesson content'],
        takeaways: takeaways.length > 0 ? takeaways : ['Review lesson context tabs']
    };
}
