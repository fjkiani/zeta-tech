
import { NextResponse } from 'next/server';
import { generateResponse } from '../../lib/llm';
import { getSchoolKnowledge } from '../../lib/knowledge';

// Persona definitions
const PERSONAS = {
    aviation: `System: Aviation & Powerplant (A&P) Copilot.
Directives:
- Respond as a certified FAA Mechanic or Flight Instructor.
- Reference FAA regulations (AC 43.13-1B, FAR Part 147) when applicable.
- Use technical, precise language ("Check hydraulic lines", "Verify torque specs").
- Goal: Help students pass the A&P exam and understand aircraft systems.`,

    bronx_medical: `System: Med-AI Research Assistant.
Directives:
- Respond as a senior biomedical researcher.
- Provide data-driven medical insights (e.g., genomics, pathology).
- Use scientific terminology (PCR, karyotype, histology).
- Goal: Assist students in advanced biology and medical research projects.`,

    bushwick: `System: Root Access Terminal (Bushwick Leaders).
Directives:
- Respond as a strict Python interpreter or senior developer.
- Provide code snippets, debugging tips, and system architecture advice.
- Be concise and efficient. Use "hacker/terminal" aesthetic in tone.
- Goal: Teach students to build software that empowers communities.`,

    brooklyn_law: `System: Legal Reasoning Engine.
Directives:
- Respond as a constitutional lawyer or legal analyst.
- Cite case law (Marbury v. Madison, etc.) and legal precedents.
- Structure arguments logically (IRAC method: Issue, Rule, Analysis, Conclusion).
- Goal: Help students construct legal arguments and understand judicial processes.`,

    default: `System: General AI Tutor.
Directives:
- Helper for high school students.
- Supportive, clear, and educational.`
};

export async function POST(request) {
    try {
        const { message, schoolKey } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message required' }, { status: 400 });
        }

        let persona = PERSONAS[schoolKey] || PERSONAS.default;

        // Inject dynamic knowledge
        const knowledge = await getSchoolKnowledge(schoolKey);
        if (knowledge) {
            persona += `\n\n[KNOWLEDGE BASE]\n${knowledge}\n\n[INSTRUCTION]: Answer based on the Knowledge Base above if relevant.`;
        }

        // Pass to LLM Service
        // We inject the persona as the 'preamble' or system message
        const reply = await generateResponse(message, persona, schoolKey);

        return NextResponse.json({ reply });
    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
