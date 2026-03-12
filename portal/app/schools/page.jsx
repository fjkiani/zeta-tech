import Link from 'next/link';

// Static Data - Matches schoolDriveMap
const SCHOOLS = [
  { id: 'aviation', name: 'Aviation High School', icon: '✈️', color: '#0ea5e9', desc: 'A&P Mechanics & Aerospace' },
  { id: 'bronx-medical', name: 'Bronx HS for Medical Science', icon: '🧬', color: '#10b981', desc: 'Pre-Med & Healthcare Tech' },
  { id: 'brooklyn-law', name: 'Brooklyn HS of Law & Tech', icon: '⚖️', color: '#8b5cf6', desc: 'Legal Studies & Computer Science' },
  { id: 'bushwick', name: 'Bushwick Leaders HS', icon: '🚀', color: '#f59e0b', desc: 'Academic Excellence & Leadership' }
];

export default function SchoolsDirectory() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>Sector Map</h1>
      <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '40px' }}>Select an academy sector to view specialized intelligence and missions.</p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '24px' 
      }}>
        {SCHOOLS.map(school => (
          <Link 
            href={`/schools/${school.id}`} 
            key={school.id}
            style={{
              display: 'block',
              textDecoration: 'none',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}
            className="school-card"
          >
            <style>{`
              .school-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.1);
                border-color: ${school.color};
              }
            `}</style>
            
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: `${school.color}15`, 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px',
              color: school.color
            }}>
              {school.icon}
            </div>
            
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{school.name}</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
              {school.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
