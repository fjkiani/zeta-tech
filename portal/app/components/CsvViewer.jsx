'use client';

import { useState, useEffect } from 'react';

export default function CsvViewer({ url }) {
    const [data, setData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!url) return;
        setLoading(true);
        fetch(url)
            .then(res => res.text())
            .then(text => {
                const rows = text.split('\n').filter(r => r.trim());
                if (rows.length > 0) {
                    // Simple split by comma, handling potential quotes roughly or just standard split for now
                    const head = rows[0].split(',').map(h => h.trim());
                    const body = rows.slice(1).map(r => r.split(',').map(c => c.trim()));
                    setHeaders(head);
                    setData(body);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("CSV Load Error", err);
                setError("Failed to load data.");
                setLoading(false);
            });
    }, [url]);

    if (loading) return <div style={{ padding: 20, color: '#666' }}>Loading Data...</div>;
    if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

    return (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: '#f8fafc' }}>
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} style={{ borderBottom: i === data.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                            {row.map((cell, j) => (
                                <td key={j} style={{ padding: '12px 16px', color: '#334155' }}>
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
