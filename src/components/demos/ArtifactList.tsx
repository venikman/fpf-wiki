import type { Artifact } from "@/lib/artifacts";

interface ArtifactListProps {
  artifacts: Artifact[];
}

export function ArtifactList({ artifacts }: ArtifactListProps) {
  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="not-content" style={{ textAlign: 'center', padding: '2rem', color: 'var(--sl-color-gray-4)' }}>
        No artifacts found for this part.
      </div>
    );
  }

  return (
    <div className="not-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {artifacts.map((artifact) => (
        <a 
          key={artifact.id} 
          href={`/artifacts/${artifact.patternId.toLowerCase().replace(".", "-")}/`}
          style={{
            display: 'block',
            textDecoration: 'none',
            padding: '1rem',
            border: '1px solid var(--sl-color-gray-3)',
            borderRadius: '0.5rem',
            background: 'var(--sl-color-bg)',
            transition: 'border-color 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--sl-color-accent)'}
          onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--sl-color-gray-3)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <code style={{ 
              fontSize: '0.875rem', 
              padding: '0.25rem 0.5rem', 
              background: 'var(--sl-color-gray-2)', 
              borderRadius: '0.25rem' 
            }}>
              {artifact.patternId}
            </code>
            {artifact.status && (
              <span style={{
                fontSize: '0.75rem',
                padding: '0.125rem 0.5rem',
                background: artifact.status === 'Stable' ? 'var(--sl-color-accent-low)' : 'var(--sl-color-gray-2)',
                color: artifact.status === 'Stable' ? 'var(--sl-color-accent-high)' : 'var(--sl-color-gray-5)',
                borderRadius: '9999px',
              }}>
                {artifact.status}
              </span>
            )}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--sl-color-black)' }}>
            {artifact.title}
          </h3>
          {artifact.techLabel && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', color: 'var(--sl-color-gray-5)' }}>
              {artifact.techLabel}
            </p>
          )}
        </a>
      ))}
    </div>
  );
}
