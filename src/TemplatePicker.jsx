import { useState } from 'react'
import { TEMPLATES } from './data/templates/index.js'

const TAGS = ['all', 'beginner', 'intermediate', 'advanced', 'strength', 'hypertrophy', 'cardio', 'endurance', 'hiit', 'barbell', 'dumbbell', 'bodyweight', 'running', '2-day']

export function TemplatePicker({ t, allEx, onApply, onClose }) {
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [mode, setMode]         = useState('new')

  const filtered = TEMPLATES.filter(tp => {
    if (filter !== 'all' && !tp.tags?.includes(filter)) return false
    if (search && !tp.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const missingCount = tp =>
    tp.days.flatMap(d => d.exercises)
      .filter(e => !allEx.find(x => x.id === e.exerciseId)).length

  // ── Confirm / detail screen ──────────────────────────────────
  if (selected) {
    const missing = missingCount(selected)
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          <h3 className="modal-title">{selected.name}</h3>

          {selected.tags?.length > 0 && (
            <div className="tpl-confirm-tags">
              {selected.tags.map(tag => (
                <span key={tag} className="chip chip-sm">{tag}</span>
              ))}
            </div>
          )}

          <p className="modal-sub">{selected.description}</p>

          <div className="tpl-days-preview">
            {selected.days.map((d, i) => (
              <div key={i} className="tpl-day-row">
                <span className="tpl-day-name">{d.name}</span>
                <span className="tpl-day-count">{d.exercises.length} {t.pgExLabel}</span>
              </div>
            ))}
          </div>

          {missing > 0 && (
            <p className="tpl-missing">⚠ {t.tplMissing.replace('{count}', missing)}</p>
          )}

          <p className="section-label" style={{ marginTop: 16, marginBottom: 8 }}>{t.applyAs}</p>
          <div className="toggle-row">
            <button className={`toggle-btn ${mode === 'new' ? 'active' : ''}`} onClick={() => setMode('new')}>{t.newProgramMode}</button>
            <button className={`toggle-btn ${mode === 'add' ? 'active' : ''}`} onClick={() => setMode('add')}>{t.addToCurrent}</button>
          </div>

          <div className="modal-row" style={{ marginTop: 16 }}>
            <button className="secondary-btn" onClick={() => setSelected(null)}>← {t.goBack}</button>
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
            <div key={tp.id} className="tpl-card" onClick={() => setSelected(tp)}>
              <div className="tpl-card-content">
                <div className="tpl-card-name">{tp.name}</div>
                <div className="tpl-card-tagrow">
                  {tp.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="chip chip-sm">{tag}</span>
                  ))}
                  {tp.tags?.length > 3 && (
                    <span className="chip chip-sm">+{tp.tags.length - 3}</span>
                  )}
                </div>
              </div>
              <span className="tpl-card-days">{tp.days.length} {tp.days.length === 1 ? t.day : t.days}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
