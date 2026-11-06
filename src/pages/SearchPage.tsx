import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAtlas } from '../context/AtlasContext'
import { searchAll } from '../lib/search'

export function SearchPage() {
  const { data } = useAtlas()
  const [query, setQuery] = useState('')

  const hits = useMemo(() => (data ? searchAll(data, query) : []), [data, query])

  if (!data) return null

  return (
    <div className="page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Find anything</p>
          <h1>Search</h1>
          <p className="lede">
            Full-text across objectives, projects, milestones, tasks, and journal.
          </p>
        </div>
      </div>

      <label className="search-field">
        <span className="sr-only">Search</span>
        <input
          type="search"
          placeholder="Search Atlas…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </label>

      {query.trim() && (
        <ul className="search-results">
          {hits.length === 0 && <li className="muted">No matches.</li>}
          {hits.map((hit) => (
            <li key={`${hit.kind}-${hit.id}`}>
              <span className="kind-pill">{hit.kind}</span>
              {hit.kind === 'goal' ? (
                <Link to={`/goals/${hit.id}`}>
                  <strong>{hit.title}</strong>
                  <span className="muted">{hit.snippet}</span>
                </Link>
              ) : hit.kind === 'project' ? (
                <Link to="/projects">
                  <strong>{hit.title}</strong>
                  <span className="muted">{hit.snippet}</span>
                </Link>
              ) : (
                <div>
                  <strong>{hit.title}</strong>
                  <span className="muted">{hit.snippet}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
