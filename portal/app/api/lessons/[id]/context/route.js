import fs from 'fs';
import path from 'path';
import { getLessonIntel } from '../../../../lib/intel';

const DATA_DIR = path.join(process.cwd(), 'data', 'lessons');
const NOTEBOOK_FILE = path.join(process.cwd(), 'data', 'lesson-notebooklm.json');

export async function GET(request, { params }) {
    const { id } = params;
    const dir = path.join(DATA_DIR, id);

    // 1. Read Manual Context
    let context = '';
    const contextPath = path.join(dir, 'context.md');
    if (fs.existsSync(contextPath)) {
        context = fs.readFileSync(contextPath, 'utf8');
    }

    // 2. Read Transcript
    let transcript = '';
    const transcriptPath = path.join(dir, 'transcription.md');
    if (fs.existsSync(transcriptPath)) {
        transcript = fs.readFileSync(transcriptPath, 'utf8');
    }

    // 3. Read NotebookLM Data
    let notebookData = null;
    if (fs.existsSync(NOTEBOOK_FILE)) {
        const fullData = JSON.parse(fs.readFileSync(NOTEBOOK_FILE, 'utf8'));
        notebookData = fullData[id] || null;
    }

    // 4. Parse Intel (Objectives/Takeaways)
    // We pass the ID, and getLessonIntel handles reading the files internally
    const intel = getLessonIntel(id);

    return Response.json({
        context,
        transcript,
        notebookData,
        intel
    });
}

export async function POST(request, { params }) {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'context'; // 'context' or 'transcript'

    // Determine content from body based on type
    const body = await request.json();
    const content = type === 'transcript' ? body.transcript : body.context;

    const dir = path.join(DATA_DIR, id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = type === 'transcript' ? 'transcription.md' : 'context.md';
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, content || '', 'utf8');

    return Response.json({ status: 'ok' });
}

export async function DELETE(request, { params }) {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'context';

    const filename = type === 'transcript' ? 'transcription.md' : 'context.md';
    const filePath = path.join(DATA_DIR, id, filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    return Response.json({ status: 'ok' });
}
