import { useState } from 'react'
import { TEMPLATES } from './data/templates/index.js'

const TAGS = ['all', 'beginner', 'intermediate', 'advanced', 'strength', 'hypertrophy', 'cardio', 'endurance', 'hiit', 'barbell', 'dumbbell', 'bodyweight', 'running', '2-day']

export function TemplatePicker({ t, allEx, userTemplates, onApply, onDelete, onClose }) {
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [mode, setMode]         = useState('replace')

  const all = [
    ...TEMPLATES,
    ...userTemplates.map(ut => ({ ...ut, isUser: true })),
  ]
  const filtered = all.filter(tp => {
    if (filter !== 'all' && !tp.tags?.includes(filter)) return false
    if (search && !tp.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const missingCount = tp =>
    tp.days.flatMap(d => d.exercises)
      .filter(e => !allEx.find(x => x.id === e.exerciseId)).length

  // ── Confirm screen ───────────────────────────────────────────
  if (selected) {
    const missing = missingCount(selected)
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          <h3 className="modal-title">{selected.name}</h3>
          <p className="modal-sub">{selected.description}</p>

          <div className="tpl-days-preview">
            {selected.days.map((d, i) => (
              <div key={i} className="tpl-day-row">
                <span className="tpl-day-name">{d.name}</span>
                <span className="tpl-day-count">{d.exercises.length} exercises</span>
              </div>
            ))}
          </div>

          {missing > 0 && (
            <p className="tpl-missing">⚠ {missing} exercise{missing > 1 ? 's' : ''} not in library — will be skipped</p>
          )}

          <p className="section-label" style={{ marginTop: 16, marginBottom: 8 }}>{t.applyAs}</p>
          <div className="toggle-row">
            <button className={`toggle-btn ${mode === 'replace' ? 'active' : ''}`} onClick={() => setMode('replace')}>{t.replaceProgram}</button>
            <button className={`toggle-btn ${mode === 'add'     ? 'active' : ''}`} onClick={() => setMode('add')}>{t.addDays}</button>
          </div>

          <div className="modal-row" style={{ marginTop: 16 }}>
            <button className="secondary-btn" onClick={() => setSelected(null)}>← {t.back}</button>
            <button className="primary-btn" onClick={() => onApply(selected, mode)}>{t.applyTemplate}</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Browse screen ────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box tpl-picker-box" onClick={e => e.stopPropagation()}>
        <div className="tpl-picker-header">
          <h3 className="modal-title" style={{ marginBottom: 0 }}>{t.browseTemplates}</h3>
          <button className="ghost-btn tpl-close-btn" onClick={onClose}>✕</button>
        </div>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.srchTemplates}
          className="search-input"
          style={{ marginBottom: 10 }}
        />

        <div className="chip-row">
          {TAGS.map(tag => (
            <button key={tag} className={`chip ${filter === tag ? 'active' : ''}`}
              onClick={() => setFilter(tag)}>
              {tag === 'all' ? t.allTags : tag.charAt(0).toUpperCase() + tag.slice(1)}
            </button>
          ))}
        </div>

        <div className="tpl-list">
          {filtered.length === 0 && (
            <p className="chart-empty" style={{ paddingTop: 24 }}>{t.noTplMatch}</p>
          )}

          {filtered.map(tp => (
            <div key={tp.id} className="tpl-card">
              <button className="tpl-card-body" onClick={() => setSelected(tp)}>
                <div className="tpl-card-header">
                  <span className="tpl-card-name">{tp.name}</span>
                  {tp.isUser && <span className="custom-badge">✦ {t.mine}</span>}
                </div>
                <p className="tpl-card-desc">{tp.description}</p>
                <div className="tpl-card-meta">
                  <span>{tp.days.length} {tp.days.length === 1 ? t.day : t.days}</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {tp.tags?.map(tag => (
                      <span key={tag} className="chip" style={{ padding: '2px 7px', fontSize: 10 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
              {tp.isUser && (
                <button className="tpl-delete-btn" onClick={() => onDelete(tp.id)}>🗑</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
