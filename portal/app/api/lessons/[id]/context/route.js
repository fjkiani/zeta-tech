import fs from 'fs';
import path from 'path';

export async function POST(request, { params }) {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'context'; // 'context' or 'transcript'

    // Determine content from body based on type
    const body = await request.json();
    const content = type === 'transcript' ? body.transcript : body.context;

    const dir = path.join(process.cwd(), 'data', 'lessons', id);
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
    const filePath = path.join(process.cwd(), 'data', 'lessons', id, filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    return Response.json({ status: 'ok' });
}
