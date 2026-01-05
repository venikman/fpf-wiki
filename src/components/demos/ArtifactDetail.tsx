import type { Artifact } from "@/lib/artifacts";
import { getBacklinks, partNames } from "@/lib/artifacts";

interface ArtifactDetailProps {
  artifact: Artifact;
}

function Section({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--sl-color-black)' }}>
        {title}
      </h3>
      <div style={{ whiteSpace: 'pre-wrap', color: 'var(--sl-color-gray-6)' }}>
        {content}
      </div>
    </div>
  );
}

export function ArtifactDetail({ artifact }: ArtifactDetailProps) {
  if (!artifact) {
    return (
      <div className="not-content" style={{ textAlign: 'center', padding: '2rem', color: 'var(--sl-color-gray-4)' }}>
        Artifact not found.
      </div>
    );
  }

  const backlinks = getBacklinks(artifact.patternId);

  return (
    <div className="not-content">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <code style={{ 
          fontSize: '1rem', 
          padding: '0.25rem 0.75rem', 
          background: 'var(--sl-color-gray-2)', 
          borderRadius: '0.25rem',
          fontWeight: 600,
        }}>
          {artifact.patternId}
        </code>
        {artifact.status && (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.75rem',
            background: artifact.status === 'Stable' ? 'var(--sl-color-accent-low)' : 'var(--sl-color-gray-2)',
            color: artifact.status === 'Stable' ? 'var(--sl-color-accent-high)' : 'var(--sl-color-gray-5)',
            borderRadius: '9999px',
          }}>
            {artifact.status}
          </span>
        )}
        {artifact.type && (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.75rem',
            background: 'var(--sl-color-gray-2)',
            color: 'var(--sl-color-gray-5)',
            borderRadius: '9999px',
          }}>
            {artifact.type}
          </span>
        )}
        <span style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.75rem',
          border: '1px solid var(--sl-color-gray-3)',
          borderRadius: '9999px',
          color: 'var(--sl-color-gray-5)',
        }}>
          Part {artifact.part}: {partNames[artifact.part]}
        </span>
      </div>

      {(artifact.techLabel || artifact.plainLabel) && (
        <div style={{ 
          padding: '1rem', 
          background: 'var(--sl-color-gray-1)', 
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
        }}>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sl-color-gray-4)', marginBottom: '0.75rem' }}>
            Twin Labels
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {artifact.techLabel && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-4)' }}>Technical</span>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--sl-color-black)' }}>{artifact.techLabel}</p>
              </div>
            )}
            {artifact.plainLabel && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--sl-color-gray-4)' }}>Plain Language</span>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--sl-color-black)' }}>{artifact.plainLabel}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {artifact.tags && artifact.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {artifact.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                background: 'var(--sl-color-gray-2)',
                borderRadius: '9999px',
                color: 'var(--sl-color-gray-5)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <Section title="Problem Frame" content={artifact.problemFrame} />
      <Section title="Problem" content={artifact.problem} />
      <Section title="Forces" content={artifact.forces} />
      <Section title="Solution" content={artifact.solution} />
      <Section title="Conformance Checklist" content={artifact.conformanceChecklist} />
      <Section title="Anti-patterns" content={artifact.antiPatterns} />
      <Section title="Relations" content={artifact.relations} />
      <Section title="Rationale" content={artifact.rationale} />
      <Section title="Body" content={artifact.body} />

      {backlinks.length > 0 && (
        <div style={{ 
          padding: '1rem', 
          border: '1px solid var(--sl-color-gray-3)', 
          borderRadius: '0.5rem',
          marginTop: '2rem',
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--sl-color-black)' }}>
            Referenced By
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {backlinks.map((bl) => (
              <li key={bl.id} style={{ marginBottom: '0.5rem' }}>
                <a
                  href={`/artifacts/${bl.patternId.toLowerCase().replace(".", "-")}/`}
                  style={{ color: 'var(--sl-color-accent)' }}
                >
                  <code>{bl.patternId}</code> - {bl.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
