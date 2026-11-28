import { getLessonMapping, setLessonMapping, updateArtifact } from '../app/lib/sidecar.js';
import {
  createNotebook,
  addSource,
  generateArtifact,
  downloadArtifact,
  ensureAuth,
  getUsageSnapshot,
  NOTEBOOKLM_ACCOUNT_EMAIL,
} from '../app/lib/notebooklm.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARTIFACT_DIR = path.join(process.cwd(), 'public', 'artifacts');
const ALL_ASSETS = ['quiz', 'flashcards', 'slideDeck', 'audio', 'mindMap', 'dataTable'];
const targetAsset = process.argv[3];
const ASSETS = targetAsset ? [targetAsset] : ALL_ASSETS;

// Helper to determine source
function getSourceInfo(lessonId) {
    // Check for transcript
    // This is a simplified check, mirroring logic from llm-router/page.jsx
    // Ideally we inspect the actual file system
    return {
        type: 'composite',
        description: 'Lesson Transcript + Teacher Context'
    };
}

async function main() {
    const lessonId = process.argv[2];
    if (!lessonId) {
        console.error('Usage: node scripts/generate-all.js <lessonId>');
        process.exit(1);
    }

    console.log(`🚀 Starting Mass Generation for Lesson: ${lessonId}`);
    console.log(`🔐 NotebookLM account: ${NOTEBOOKLM_ACCOUNT_EMAIL}`);
    await ensureAuth({ refresh: true });
    console.log('📊 usage', await getUsageSnapshot());

    // Ensure mapping
    let mapping = getLessonMapping(lessonId);
    let notebookId = mapping?.notebookId;

    // We assume the notebook usually exists if we are in this flow, or the API creates it.
    // If not, we might fail or need to create it. 
    // For now, let's assume if it's missing, we need to defer to the API logic or replicate it.
    if (!notebookId) {
        console.error('❌ No Notebook ID found for this lesson. Please initialize via the Portal UI first (or run the setup script).');
        process.exit(1);
    }

    console.log(`📘 Using Notebook ID: ${notebookId}`);

    const provenance = getSourceInfo(lessonId);

    // Run sequentially to avoid rate limits or race conditions
    for (const type of ASSETS) {
        console.log(`\n⚙️  Generating ${type}...`);
        try {
            const result = await generateArtifact(notebookId, type, {
                context: { lessonId },
            });
            console.log(`✅ Generated ${type}. Downloading...`);

            const lessonDir = path.join(ARTIFACT_DIR, lessonId);
            let filename;
            if (type === 'slideDeck') filename = 'slides.pdf';
            else if (type === 'quiz') filename = 'quiz.json';
            else if (type === 'flashcards') filename = 'flashcards.json';
            else if (type === 'audio') filename = 'audio.mp3';
            else if (type === 'mindMap') filename = 'mindMap.json';
            else if (type === 'dataTable') filename = 'data.csv';

            const outputPath = path.join(lessonDir, filename);
            const downloaded = await downloadArtifact(notebookId, type, outputPath);

            const artifactUrl = `/artifacts/${lessonId}/${filename}`;
            updateArtifact(lessonId, type, {
                status: 'completed',
                localPath: outputPath,
                url: artifactUrl,
                bytes: downloaded.bytes,
                prompt: result.prompt,
                accountEmail: NOTEBOOKLM_ACCOUNT_EMAIL,
                generatedAt: new Date().toISOString(),
                provenance: provenance
            });
            console.log(`✨ Saved ${type} to ${artifactUrl} (${downloaded.bytes} bytes)`);

        } catch (err) {
            console.error(`❌ Failed to generate ${type}:`, err.message);
        }
    }

    console.log('\n🎉 Mass Generation Complete!');
}

main().catch(console.error);
