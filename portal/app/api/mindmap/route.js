
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const school = searchParams.get('school') || 'general';

    // Basic mock data structure for MindMapViewer
    // In future, this could fetch from Hygraph or static curriculum files
    const data = {
        nodes: [
            { id: 'root', label: `${school.toUpperCase()} CURRICULUM`, parent: null },
            { id: 'w1', label: 'Week 1: Fundamentals', parent: 'root' },
            { id: 'w2', label: 'Week 2: Advanced Concepts', parent: 'root' },
            { id: 'w3', label: 'Week 3: Practical Application', parent: 'w1' },
            { id: 'w4', label: 'Week 4: Certification Prep', parent: 'w2' },
            { id: 'capstone', label: 'Final Capstone', parent: 'root' }
        ]
    };

    return NextResponse.json(data);
}
