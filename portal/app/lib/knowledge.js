
import fs from 'fs';
import path from 'path';

/**
 * Reads all files from the school's knowledge directory and returns them as a single context string.
 * @param {string} schoolKey - e.g. 'aviation', 'bronx_medical'
 * @returns {Promise<string>} - The combined content of all knowledge files.
 */
export async function getSchoolKnowledge(schoolKey) {
    try {
        const knowledgeDir = path.join(process.cwd(), 'data', 'knowledge', schoolKey);

        // Check if directory exists
        if (!fs.existsSync(knowledgeDir)) {
            console.warn(`Knowledge directory not found for: ${schoolKey}`);
            return '';
        }

        const files = fs.readdirSync(knowledgeDir);
        let context = '';

        for (const file of files) {
            if (file.endsWith('.md') || file.endsWith('.txt')) {
                const filePath = path.join(knowledgeDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                context += `\n\n--- DOCUMENT: ${file} ---\n${content}`;
            }
        }

        return context;
    } catch (error) {
        console.error('Error reading knowledge base:', error);
        return '';
    }
}
