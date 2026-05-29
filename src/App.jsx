import { useState, useEffect, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { dbGet, dbSet, loadAllData } from './db'
import { MUSCLE_COLORS, DIFF_COLORS, EXERCISES } from './constants'
import { getTranslations, availableLanguages } from './i18n/index.js'
import './index.css'

// ── HELPERS ──────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)
const fmtTime = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
const fmtDate = d => new Date(d).toLocaleDateString()
const mc = mg => MUSCLE_COLORS[mg] || '#6b7280'
const calcVol = sets => sets.filter(s => !s.isWarmup && s.completed).reduce((t, s) => t + (s.weight || 0) * (s.reps || 0), 0)
const weekOf = ds => { const d = new Date(ds); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.toISOString().split('T')[0] }

// ── ONBOARDING ───────────────────────────────────────────────────
function Onboarding({ onComplete }) {
  const [unit, setUnit] = useState('kg')
  const t = getTranslations('en')

  return (
    <div className="onboarding">
      <div className="onboarding-icon">💪</div>
      <h1>{t.welT}</h1>
      <p className="onboarding-sub">{t.welS}</p>
      <div className="onboarding-form">
        <label>{t.pkUnt}</label>
        <div className="toggle-row">
          {['kg', 'lbs'].map(u => (
            <button key={u} className={`toggle-btn ${unit === u ? 'active' : ''}`} onClick={() => setUnit(u)}>{u}</button>
          ))}
        </div>
        <button className="primary-btn start-btn" onClick={() => onComplete({ unit })}>{t.start} →</button>
      </div>
    </div>
  )
}

// ── MODAL ────────────────────────────────────────────────────────
function Modal({ onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

// ── WORKOUT SUMMARY ──────────────────────────────────────────────
function WorkoutSummary({ summary, unit, t, onClose }) {
  return (
    <div className="summary-overlay">
      <div className="summary-box">
        <h2>{t.workDone}</h2>
        <div className="stat-grid">
          {[[t.dur, fmtTime(summary.duration)], [t.compSets, summary.totalSets],
            [t.totVol, Math.round(summary.totalVolume) + ' ' + unit], [t.newPRs, summary.prs.length]]
            .map(([label, val]) => (
              <div key={label} className="stat-card">
                <div className="stat-val">{val}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
        </div>
        {summary.prs.length > 0 && (
          <div className="pr-box">
            <p className="pr-title">🏆 {t.newPRs}</p>
            {summary.prs.map((pr, i) => (
              <div key={i} className="pr-row">
                <span>{pr.name}</span>
                <span className="pr-val">{pr.weight} {unit}</span>
              </div>
            ))}
          </div>
        )}
        <button className="primary-btn" onClick={onClose}>{t.close}</button>
      </div>
    </div>
  )
}

// ── PROGRAM TAB ──────────────────────────────────────────────────
function ProgramTab({ t, days, selectedDay, setSelectedDay, program, setProgram,
  allEx, unit, workoutActive, workoutSets, setWorkoutSets,
  startWorkout, finishWorkout, history, onRestTimer }) {

  const exercises = program[selectedDay] || []
  const dragIdx = useRef(null)
  const lastSession = history.find(h => h.dayId === selectedDay)

  const updEx = (idx, fn) => setProgram(prev => {
    const a = [...(prev[selectedDay] || [])]
    a[idx] = fn(a[idx])
    return { ...prev, [selectedDay]: a }
  })
  const updSet = (ei, si, f, v) => updEx(ei, ex => ({ ...ex, sets: ex.sets.map((s, i) => i === si ? { ...s, [f]: v } : s) }))
  const addSet = ei => updEx(ei, ex => {
    const last = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 0, isWarmup: false }
    return { ...ex, sets: [...ex.sets, { ...last, id: uid(), completed: false }] }
  })
  const remSet = (ei, si) => updEx(ei, ex => ex.sets.length <= 1 ? ex : { ...ex, sets: ex.sets.filter((_, i) => i !== si) })
  const remEx = i => setProgram(prev => { const a = [...(prev[selectedDay] || [])]; a.splice(i, 1); return { ...prev, [selectedDay]: a } })

  const completeSet = (exId, si) => {
    setWorkoutSets(prev => { const s = [...(prev[exId] || [])]; s[si] = { ...s[si], completed: true }; return { ...prev, [exId]: s } })
    const ex = exercises.find(e => e.id === exId)
    if (ex?.restTime > 0) onRestTimer(ex.restTime)
  }
  const updWS = (exId, si, f, v) => setWorkoutSets(prev => { const s = [...(prev[exId] || [])]; s[si] = { ...s[si], [f]: v }; return { ...prev, [exId]: s } })

  const onDragStart = i => { dragIdx.current = i }
  const onDrop = i => {
    if (dragIdx.current === null || dragIdx.current === i) return
    setProgram(prev => {
      const a = [...(prev[selectedDay] || [])]
      const [m] = a.splice(dragIdx.current, 1)
      a.splice(i, 0, m)
      dragIdx.current = null
      return { ...prev, [selectedDay]: a }
    })
  }

  return (
    <div className="tab-scroll">
      <div className="day-selector">
        {days.map(d => (
          <button key={d.id} className={`day-chip ${selectedDay === d.id ? 'active' : ''}`} onClick={() => setSelectedDay(d.id)}>{d.name}</button>
        ))}
      </div>

      {exercises.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏋️</div>
          <p className="empty-title">{t.noEx}</p>
          <p className="empty-sub">{t.addLib}</p>
        </div>
      ) : (
        exercises.map((ex, ei) => {
          const exData = allEx.find(e => e.id === ex.exerciseId)
          const color = mc(exData?.mg)
          const lastEx = lastSession?.exercises?.find(e => e.exerciseId === ex.exerciseId)

          return (
            <div key={ex.id} className="ex-card" style={{ borderLeftColor: color }}
              draggable onDragStart={() => onDragStart(ei)}
              onDragOver={e => e.preventDefault()} onDrop={() => onDrop(ei)}>

              <div className="ex-header">
                <div>
                  <div className="ex-name">{exData?.name || ex.exerciseId}</div>
                  <div className="ex-tags">
                    <span className="muscle-tag" style={{ background: color + '22', color }}>{t[exData?.mg] || exData?.mg}</span>
                    <span className="eq-tag">{t[exData?.eq] || exData?.eq}</span>
                  </div>
                </div>
                <div className="ex-actions">
                  <span className="drag-handle">⠿</span>
                  {!workoutActive && <button className="remove-btn" onClick={() => remEx(ei)}>✕</button>}
                </div>
              </div>

              {!workoutActive && (
                <div className="rest-row">
                  <span className="rest-label">{t.restS}</span>
                  <input type="number" min="0" max="600" value={ex.restTime ?? 90}
                    onChange={e => updEx(ei, x => ({ ...x, restTime: +e.target.value || 0 }))}
                    className="rest-input" />
                </div>
              )}

              <div className="sets-header">
                <span>#</span><span>{t.reps}</span><span>{t.wt}</span><span>{t.wu}</span><span></span>
              </div>

              {ex.sets.map((set, si) => {
                const ws = workoutSets[ex.id]?.[si]
                const done = workoutActive && ws?.completed
                const lastSet = lastEx?.sets?.[si]
                return (
                  <div key={set.id || si} className={`set-row ${done ? 'set-done' : ''}`}>
                    <span className="set-num">{si + 1}</span>
                    <div>
                      <input type="number" min="0"
                        value={workoutActive ? (ws?.reps ?? set.reps) : set.reps}
                        onChange={e => workoutActive ? updWS(ex.id, si, 'reps', +e.target.value || 0) : updSet(ei, si, 'reps', +e.target.value || 0)}
                        placeholder={lastSet ? String(lastSet.reps) : '0'}
                        className="set-input" />
                      {lastSet && !workoutActive && <div className="set-hint">{lastSet.reps}</div>}
                    </div>
                    <div>
                      <input type="number" min="0" step="0.5"
                        value={workoutActive ? (ws?.weight ?? set.weight) : set.weight}
                        onChange={e => workoutActive ? updWS(ex.id, si, 'weight', +e.target.value || 0) : updSet(ei, si, 'weight', +e.target.value || 0)}
                        placeholder={lastSet ? String(lastSet.weight) : '0'}
                        className="set-input" />
                      {lastSet && !workoutActive && <div className="set-hint">{lastSet.weight}</div>}
                    </div>
                    <div className="warmup-cell">
                      <input type="checkbox" checked={set.isWarmup} disabled={workoutActive}
                        onChange={e => updSet(ei, si, 'isWarmup', e.target.checked)} />
                    </div>
                    <div className="complete-cell">
                      {workoutActive ? (
                        <button className={`complete-btn ${done ? 'done' : ''}`} onClick={() => !done && completeSet(ex.id, si)}>
                          {done ? '✓' : '○'}
                        </button>
                      ) : (
                        <button className="rem-set-btn" onClick={() => remSet(ei, si)}>✕</button>
                      )}
                    </div>
                  </div>
                )
              })}

              {!workoutActive && (
                <button className="add-set-btn" onClick={() => addSet(ei)}>{t.addSet}</button>
              )}
            </div>
          )
        })
      )}

      {exercises.length > 0 && (
        <div className="floating-btn-wrap">
          <button className={`floating-btn ${workoutActive ? 'finish' : 'start'}`}
            onClick={workoutActive ? finishWorkout : startWorkout}>
            {workoutActive ? `🏁 ${t.finishW}` : `▶ ${t.startW}`}
          </button>
        </div>
      )}
    </div>
  )
}

// ── LIBRARY TAB ──────────────────────────────────────────────────
function LibraryTab({ t, days, program, setProgram, customEx, setCustomEx }) {
  const [srch, setSrch] = useState('')
  const [fM, setFM] = useState('all')
  const [fE, setFE] = useState('all')
  const [fD, setFD] = useState('all')
  const [addModal, setAddModal] = useState(null)
  const [custModal, setCustModal] = useState(false)
  const [form, setForm] = useState({ name: '', mg: 'chest', eq: 'barbell', dif: 'intermediate' })

  const allEx = [...EXERCISES, ...customEx]
  const filtered = allEx.filter(e => {
    if (fM !== 'all' && e.mg !== fM) return false
    if (fE !== 'all' && e.eq !== fE) return false
    if (fD !== 'all' && e.dif !== fD) return false
    if (srch && !e.name.toLowerCase().includes(srch.toLowerCase())) return false
    return true
  })
  const grouped = Object.entries(filtered.reduce((a, e) => { (a[e.mg] ||= []).push(e); return a }, {}))

  const addToDay = (ex, dayId) => {
    setProgram(prev => {
      const ne = { id: uid(), exerciseId: ex.id, sets: [{ id: uid(), reps: 10, weight: 0, isWarmup: false }], restTime: 90 }
      return { ...prev, [dayId]: [...(prev[dayId] || []), ne] }
    })
    setAddModal(null)
  }
  const handleAdd = ex => { if (days.length === 1) addToDay(ex, days[0].id); else setAddModal(ex) }
  const createCustom = () => {
    if (!form.name.trim()) return
    setCustomEx(p => [...p, { id: uid(), ...form, custom: true }])
    setForm({ name: '', mg: 'chest', eq: 'barbell', dif: 'intermediate' })
    setCustModal(false)
  }

  const muscles = [['all', 'All'], ...Object.keys(MUSCLE_COLORS).map(m => [m, t[m]])]
  const equips = [['all', 'All'], ['barbell', t.barbell], ['dumbbell', t.dumbbell], ['cable', t.cable], ['machine', t.machine], ['bodyweight', t.bodyweight]]
  const diffs = [['all', 'All'], ['beginner', t.beginner], ['intermediate', t.intermediate], ['advanced', t.advanced]]

  return (
    <div className="tab-scroll">
      <input value={srch} onChange={e => setSrch(e.target.value)} placeholder={t.srch} className="search-input" />

      <div className="chip-row">
        {muscles.map(([k, lb]) => (
          <button key={k} className={`chip ${fM === k ? 'active' : ''}`}
            style={fM === k ? { background: k !== 'all' ? mc(k) : '#4b5563', color: '#fff' } : {}}
            onClick={() => setFM(k)}>{lb}</button>
        ))}
      </div>
      <div className="chip-row">
        {equips.map(([k, lb]) => (
          <button key={k} className={`chip ${fE === k ? 'active' : ''}`} onClick={() => setFE(k)}>{lb}</button>
        ))}
      </div>
      <div className="chip-row">
        {diffs.map(([k, lb]) => (
          <button key={k} className={`chip ${fD === k ? 'active' : ''}`} onClick={() => setFD(k)}>{lb}</button>
        ))}
      </div>

      <button className="custom-btn" onClick={() => setCustModal(true)}>{t.mkCustom}</button>

      {grouped.map(([mg, exs]) => (
        <div key={mg} className="muscle-group">
          <div className="mg-header">
            <div className="mg-dot" style={{ background: mc(mg) }} />
            <span className="mg-label" style={{ color: mc(mg) }}>{t[mg]}</span>
          </div>
          {exs.map(ex => (
            <div key={ex.id} className="lib-card" style={{ borderLeftColor: mc(ex.mg) }}>
              <div>
                <div className="lib-name">{ex.name}</div>
                <div className="lib-tags">
                  <span className="eq-tag">{t[ex.eq]}</span>
                  <span className="dif-tag" style={{ color: DIFF_COLORS[ex.dif] }}>{t[ex.dif]}</span>
                  {ex.custom && <span className="custom-badge">✦ custom</span>}
                </div>
              </div>
              <button className="add-btn" onClick={() => handleAdd(ex)}>{t.addProg}</button>
            </div>
          ))}
        </div>
      ))}

      {addModal && (
        <Modal onClose={() => setAddModal(null)}>
          <h3 className="modal-title">{addModal.name}</h3>
          <p className="modal-sub">{t.selDayP}</p>
          {days.map(d => (
            <button key={d.id} className="primary-btn" style={{ marginBottom: 8 }} onClick={() => addToDay(addModal, d.id)}>{d.name}</button>
          ))}
          <button className="ghost-btn" onClick={() => setAddModal(null)}>{t.cancel}</button>
        </Modal>
      )}

      {custModal && (
        <Modal onClose={() => setCustModal(false)}>
          <h3 className="modal-title">{t.mkCustom}</h3>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={t.exNm} className="modal-input" />
          {[['mg', Object.keys(MUSCLE_COLORS).map(m => [m, t[m]])],
            ['eq', [['barbell', t.barbell], ['dumbbell', t.dumbbell], ['cable', t.cable], ['machine', t.machine], ['bodyweight', t.bodyweight]]],
            ['dif', [['beginner', t.beginner], ['intermediate', t.intermediate], ['advanced', t.advanced]]]
          ].map(([f, opts]) => (
            <select key={f} value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} className="modal-input">
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <div className="modal-row">
            <button className="secondary-btn" onClick={() => setCustModal(false)}>{t.cancel}</button>
            <button className="primary-btn" onClick={createCustom}>{t.save}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── HISTORY TAB ──────────────────────────────────────────────────
function HistoryTab({ t, history, days, unit }) {
  const [fDay, setFDay] = useState('all')
  const [selEx, setSelEx] = useState('')
  const [viewSess, setViewSess] = useState(null)

  const filtered = fDay === 'all' ? history : history.filter(h => h.dayId === fDay)

  const prs = {}
  history.forEach(sess => sess.exercises.forEach(ex =>
    ex.sets.filter(s => !s.isWarmup && s.completed && (s.weight || 0) > 0).forEach(s => {
      if (!prs[ex.exerciseId] || s.weight > prs[ex.exerciseId].weight)
        prs[ex.exerciseId] = { weight: s.weight, name: ex.exerciseName, date: sess.date }
    })
  ))

  const histEx = [...new Set(history.flatMap(h => h.exercises.map(e => e.exerciseId)))]
    .map(id => ({ id, name: history.flatMap(h => h.exercises).find(e => e.exerciseId === id)?.exerciseName || id }))

  const progData = [...history].filter(h => h.exercises.some(e => e.exerciseId === selEx)).reverse().map(h => {
    const ex = h.exercises.find(e => e.exerciseId === selEx)
    const mw = Math.max(0, ...ex.sets.filter(s => !s.isWarmup && s.completed && s.weight > 0).map(s => s.weight))
    return { date: h.date.slice(5), weight: mw }
  })

  const weekVol = {}
  history.forEach(h => { const w = weekOf(h.date); weekVol[w] = (weekVol[w] || 0) + h.exercises.reduce((t, ex) => t + calcVol(ex.sets), 0) })
  const volData = Object.entries(weekVol).sort(([a], [b]) => a > b ? 1 : -1).slice(-8).map(([w, v]) => ({ w: w.slice(5), v: Math.round(v) }))

  const trained = new Set(history.map(h => h.date))
  const today = new Date()
  const heatmap = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (83 - i))
    const ds = d.toISOString().split('T')[0]
    return { ds, on: trained.has(ds) }
  })

  let streak = 0
  const srt = [...trained].sort().reverse()
  if (srt.length) {
    let c = new Date(today.toISOString().split('T')[0])
    for (const ds of srt) { if (ds === c.toISOString().split('T')[0]) { streak++; c.setDate(c.getDate() - 1) } else break }
  }

  const ttStyle = { contentStyle: { background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 } }

  return (
    <div className="tab-scroll">
      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p className="empty-sub">{t.noHist}</p>
        </div>
      ) : (
        <>
          <div className="section-card">
            <div className="section-header">
              <h3>{t.calTitle}</h3>
              <div className="streak-badge">
                <div className="streak-num">{streak}</div>
                <div className="streak-label">{t.streak}</div>
              </div>
            </div>
            <div className="heatmap">
              {heatmap.map((d, i) => (
                <div key={i} className={`heat-cell ${d.on ? 'on' : ''}`} title={d.ds} />
              ))}
            </div>
          </div>

          <div className="chip-row">
            {[['all', t.allDays], ...days.map(d => [d.id, d.name])].map(([id, nm]) => (
              <button key={id} className={`chip ${fDay === id ? 'active' : ''}`} onClick={() => setFDay(id)}>{nm}</button>
            ))}
          </div>

          {Object.keys(prs).length > 0 && (
            <div className="section-card">
              <h3>🏆 {t.prsTitle}</h3>
              {Object.values(prs).map((pr, i) => (
                <div key={i} className="pr-row-hist">
                  <span>{pr.name}</span>
                  <div>
                    <span className="pr-val">{pr.weight} {unit}</span>
                    <span className="pr-date">{fmtDate(pr.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {volData.length > 0 && (
            <div className="section-card">
              <h3>📊 {t.wkVol}</h3>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={volData} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="w" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip {...ttStyle} />
                  <Bar dataKey="v" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="section-card">
            <h3>📈 {t.wtProg}</h3>
            <select value={selEx} onChange={e => setSelEx(e.target.value)} className="select-input">
              <option value="">{t.pickEx}</option>
              {histEx.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            {selEx && progData.length > 1 && (
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={progData} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip {...ttStyle} />
                  <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
            {selEx && progData.length <= 1 && <p className="chart-empty">Log more sessions to see progression</p>}
          </div>

          <div className="section-card">
            <h3>🗓 {t.wkLog}</h3>
            {filtered.map(sess => (
              <button key={sess.id} className="session-row" onClick={() => setViewSess(sess)}>
                <div className="session-info">
                  <div className="session-name">{sess.dayName}</div>
                  <div className="session-date">{fmtDate(sess.date)}</div>
                </div>
                <div className="session-meta">
                  <div>{fmtTime(sess.duration)}</div>
                  <div>{sess.exercises.length} ex.</div>
                </div>
                <div className="session-tags">
                  {[...new Set(sess.exercises.map(e => e.mg || e.muscleGroup))].map(mg => (
                    <span key={mg} className="muscle-tag-sm" style={{ background: mc(mg) + '33', color: mc(mg) }}>{t[mg] || mg}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {viewSess && (
        <Modal onClose={() => setViewSess(null)}>
          <div className="modal-session-head">
            <div>
              <h3 className="modal-title">{viewSess.dayName}</h3>
              <p className="modal-sub">{fmtDate(viewSess.date)} · {fmtTime(viewSess.duration)}</p>
            </div>
            <span className="session-vol">{Math.round(viewSess.exercises.reduce((t, ex) => t + calcVol(ex.sets), 0))} {unit}</span>
          </div>
          <div className="session-detail">
            {viewSess.exercises.map((ex, i) => (
              <div key={i} className="sess-ex" style={{ borderLeftColor: mc(ex.mg || ex.muscleGroup) }}>
                <div className="sess-ex-name">{ex.exerciseName}</div>
                {ex.sets.map((s, j) => (
                  <div key={j} className={`sess-set ${s.isWarmup ? 'warmup' : ''}`}>
                    <span>Set {j + 1}{s.isWarmup ? ' (W)' : ''}</span>
                    <span>{s.reps} reps</span>
                    <span>{s.weight} {unit}</span>
                    {s.completed && <span className="set-check">✓</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <button className="secondary-btn" onClick={() => setViewSess(null)}>{t.close}</button>
        </Modal>
      )}
    </div>
  )
}

// ── SETTINGS TAB ─────────────────────────────────────────────────
function SettingsTab({ t, lang, setLang, unit, setUnit, darkMode, setDarkMode,
  days, setDays, program, setProgram, history, setHistory, customEx, setCustomEx }) {

  const [newDay, setNewDay] = useState('')
  const [editId, setEditId] = useState(null)
  const [editV, setEditV] = useState('')
  const [resetV, setResetV] = useState('')
  const [showReset, setShowReset] = useState(false)
  const fileRef = useRef(null)

  const addDay = () => {
    if (!newDay.trim()) return
    const d = { id: uid(), name: newDay.trim() }
    setDays(p => [...p, d]); setProgram(p => ({ ...p, [d.id]: [] })); setNewDay('')
  }
  const renameDay = id => {
    if (!editV.trim()) { setEditId(null); return }
    setDays(p => p.map(d => d.id === id ? { ...d, name: editV.trim() } : d)); setEditId(null)
  }
  const deleteDay = id => {
    if (days.length <= 1) return
    setDays(p => p.filter(d => d.id !== id))
    setProgram(p => { const n = { ...p }; delete n[id]; return n })
  }

  const exportJSON = () => {
    const data = { version: 1, days, program, history, customExercises: customEx, settings: { language: lang, unit, darkMode } }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gymtrack-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}.json`
    a.click(); URL.revokeObjectURL(a.href)
  }
  const importJSON = e => {
    const file = e.target.files?.[0]; if (!file) return
    if (!window.confirm(t.impW)) { e.target.value = ''; return }
    const r = new FileReader()
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result)
        if (d.days) setDays(d.days); if (d.program) setProgram(d.program)
        if (d.history) setHistory(d.history); if (d.customExercises) setCustomEx(d.customExercises)
        if (d.settings?.language) setLang(d.settings.language)
        if (d.settings?.unit) setUnit(d.settings.unit)
        if (d.settings?.darkMode !== undefined) setDarkMode(d.settings.darkMode)
      } catch { alert('Invalid file') }
    }
    r.readAsText(file); e.target.value = ''
  }
  const doReset = () => {
    if (resetV !== t.resetKw) return
    setDays([{ id: 'day-a', name: 'Day A' }, { id: 'day-b', name: 'Day B' }])
    setProgram({ 'day-a': [], 'day-b': [] }); setHistory([]); setCustomEx([])
    setResetV(''); setShowReset(false)
  }

  const Tgl = ({ opts, val, fn }) => (
    <div className="toggle-row">
      {opts.map(([v, lb]) => <button key={String(v)} className={`toggle-btn sm ${val === v ? 'active' : ''}`} onClick={() => fn(v)}>{lb}</button>)}
    </div>
  )

  return (
    <div className="tab-scroll">
      <div className="settings-section">
        <p className="section-label">{t.thm} & {t.lng}</p>
        <div className="settings-row"><span>{t.thm}</span><Tgl opts={[[true, '🌙 ' + t.dk], [false, '☀️ ' + t.lt]]} val={darkMode} fn={setDarkMode} /></div>
        <div className="settings-row"><span>{t.unt}</span><Tgl opts={[['kg', 'kg'], ['lbs', 'lbs']]} val={unit} fn={setUnit} /></div>
        {availableLanguages.length > 1 && (
          <div className="settings-row"><span>{t.lng}</span><Tgl opts={availableLanguages.map(l => [l, l.toUpperCase()])} val={lang} fn={setLang} /></div>
        )}
      </div>

      <div className="settings-section">
        <p className="section-label">{t.mgDays}</p>
        {days.map(d => (
          <div key={d.id} className="day-row">
            {editId === d.id ? (
              <>
                <input autoFocus value={editV} onChange={e => setEditV(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') renameDay(d.id); if (e.key === 'Escape') setEditId(null) }}
                  className="day-edit-input" />
                <button className="icon-btn ok" onClick={() => renameDay(d.id)}>✓</button>
                <button className="icon-btn" onClick={() => setEditId(null)}>✕</button>
              </>
            ) : (
              <>
                <span className="day-name-display">{d.name}</span>
                <button className="icon-btn" onClick={() => { setEditId(d.id); setEditV(d.name) }}>✏️</button>
                {days.length > 1 && <button className="icon-btn danger" onClick={() => deleteDay(d.id)}>🗑</button>}
              </>
            )}
          </div>
        ))}
        <div className="day-add-row">
          <input value={newDay} onChange={e => setNewDay(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDay()}
            placeholder={t.newDayPl} className="day-edit-input" />
          <button className="add-day-btn" onClick={addDay}>{t.addDay}</button>
        </div>
      </div>

      <div className="settings-section">
        <p className="section-label">Data</p>
        <button className="data-btn" onClick={exportJSON}>⬇️ {t.expJ}</button>
        <button className="data-btn" onClick={() => fileRef.current?.click()}>⬆️ {t.impJ}</button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importJSON} />
      </div>

      <div className="settings-section danger-section">
        <p className="section-label danger-label">⚠️ {t.danger}</p>
        {!showReset ? (
          <button className="danger-btn" onClick={() => setShowReset(true)}>🗑 {t.resetAll}</button>
        ) : (
          <>
            <p className="reset-prompt">{t.resetPr}</p>
            <input value={resetV} onChange={e => setResetV(e.target.value)} placeholder={t.resetKw} className="day-edit-input" style={{ marginBottom: 10 }} />
            <div className="modal-row">
              <button className="secondary-btn" onClick={() => { setShowReset(false); setResetV('') }}>{t.cancel}</button>
              <button className={`danger-btn ${resetV !== t.resetKw ? 'disabled' : ''}`} disabled={resetV !== t.resetKw} onClick={doReset}>{t.resetAll}</button>
            </div>
          </>
        )}
      </div>

      <div className="settings-section">
        <p className="section-label">{t.abt}</p>
        <div className="about-content">
          <span>{t.ver}</span>
          <span>{t.lic}</span>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="gh-link">🔗 {t.gh}</a>
        </div>
      </div>
    </div>
  )
}

// ── APP ──────────────────────────────────────────────────────────
export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [onboarded, setOnboarded] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [unit, setUnit] = useState('kg')
  const [lang, setLang] = useState('en')
  const [days, setDays] = useState([{ id: 'day-a', name: 'Day A' }, { id: 'day-b', name: 'Day B' }])
  const [selectedDay, setSelectedDay] = useState('day-a')
  const [program, setProgram] = useState({ 'day-a': [], 'day-b': [] })
  const [customEx, setCustomEx] = useState([])
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState(0)
  const [workoutActive, setWorkoutActive] = useState(false)
  const [workoutStart, setWorkoutStart] = useState(null)
  const [workoutSets, setWorkoutSets] = useState({})
  const [showSummary, setShowSummary] = useState(false)
  const [lastSummary, setLastSummary] = useState(null)
  const [restActive, setRestActive] = useState(false)
  const [restSecs, setRestSecs] = useState(0)
  const [restMax, setRestMax] = useState(90)

  // Load from IndexedDB on mount
  useEffect(() => {
    loadAllData().then(data => {
      if (data.settings) {
        setOnboarded(data.settings.onboarded ?? false)
        setDarkMode(data.settings.darkMode ?? true)
        setUnit(data.settings.unit ?? 'kg')
        setLang(data.settings.lang ?? 'en')
        if (data.settings.selectedDay) setSelectedDay(data.settings.selectedDay)
      }
      if (data.days) setDays(data.days)
      if (data.program) setProgram(data.program)
      if (data.history) setHistory(data.history)
      if (data.customExercises) setCustomEx(data.customExercises)
      setLoaded(true)
    })
  }, [])

  // Persist to IndexedDB whenever state changes
  useEffect(() => { if (loaded) dbSet('settings', { onboarded, darkMode, unit, lang, selectedDay }) }, [loaded, onboarded, darkMode, unit, lang, selectedDay])
  useEffect(() => { if (loaded) dbSet('days', days) }, [loaded, days])
  useEffect(() => { if (loaded) dbSet('program', program) }, [loaded, program])
  useEffect(() => { if (loaded) dbSet('history', history) }, [loaded, history])
  useEffect(() => { if (loaded) dbSet('customExercises', customEx) }, [loaded, customEx])

  // Rest timer
  useEffect(() => {
    if (!restActive || restSecs <= 0) { if (restSecs <= 0) setRestActive(false); return }
    const id = setTimeout(() => setRestSecs(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [restActive, restSecs])

  const t = getTranslations(lang)
  const allEx = [...EXERCISES, ...customEx]
  const curProg = program[selectedDay] || []

  const startWorkout = () => {
    const sets = {}
    curProg.forEach(ex => { sets[ex.id] = ex.sets.map(s => ({ ...s, completed: false })) })
    setWorkoutSets(sets); setWorkoutStart(Date.now()); setWorkoutActive(true)
  }

  const finishWorkout = () => {
    const duration = Math.floor((Date.now() - workoutStart) / 1000)
    const sess = {
      id: uid(), date: new Date().toISOString().split('T')[0],
      dayId: selectedDay, dayName: days.find(d => d.id === selectedDay)?.name || '',
      duration,
      exercises: curProg.map(ex => {
        const ed = allEx.find(e => e.id === ex.exerciseId)
        return { exerciseId: ex.exerciseId, exerciseName: ed?.name || ex.exerciseId, mg: ed?.mg || '', muscleGroup: ed?.mg || '', sets: (workoutSets[ex.id] || ex.sets).map(s => ({ ...s })) }
      })
    }
    const prs = []
    sess.exercises.forEach(ex => {
      const mw = Math.max(0, ...ex.sets.filter(s => !s.isWarmup && s.completed && (s.weight || 0) > 0).map(s => s.weight))
      if (mw > 0) {
        const pm = history.flatMap(h => h.exercises.filter(e => e.exerciseId === ex.exerciseId)).flatMap(e => e.sets.filter(s => !s.isWarmup && s.completed)).reduce((m, s) => Math.max(m, s.weight || 0), 0)
        if (mw > pm) prs.push({ name: ex.exerciseName, weight: mw })
      }
    })
    setProgram(prev => {
      const day = [...(prev[selectedDay] || [])]
      day.forEach((ex, i) => { day[i] = { ...ex, sets: ex.sets.map((s, j) => { const ws = workoutSets[ex.id]?.[j]; return ws && ws.completed ? { ...s, reps: ws.reps, weight: ws.weight } : s }) } })
      return { ...prev, [selectedDay]: day }
    })
    const totalSets = sess.exercises.flatMap(e => e.sets).filter(s => s.completed && !s.isWarmup).length
    const totalVolume = sess.exercises.reduce((t, ex) => t + calcVol(ex.sets), 0)
    setLastSummary({ ...sess, prs, totalSets, totalVolume })
    setHistory(prev => [sess, ...prev])
    setWorkoutActive(false); setRestActive(false); setRestSecs(0); setShowSummary(true)
  }

  const handleOnboard = ({ unit: u }) => {
    setUnit(u); setOnboarded(true)
  }

  if (!loaded) return <div style={{ minHeight: '100vh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#6b7280', fontSize: 14 }}>Loading…</div></div>

  if (!onboarded) return <Onboarding onComplete={handleOnboard} />

  const tabs = [{ icon: '📋', label: t.prog }, { icon: '📚', label: t.lib }, { icon: '📈', label: t.hist }, { icon: '⚙️', label: t.sets }]

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <header className="app-header">
        <div className="app-title">💪 GymTrack</div>
        {workoutActive && (
          <div className="workout-badge">
            <span className="pulse-dot" />
            <span>{t.workAct}</span>
          </div>
        )}
      </header>

      {restActive && (
        <div className="rest-bar">
          <div className="rest-info">
            <span className="rest-label">⏱ {t.restTmr}</span>
            <span className="rest-time">{fmtTime(restSecs)}</span>
          </div>
          <div className="rest-controls">
            <div className="rest-track">
              <div className="rest-fill" style={{ width: (restSecs / restMax * 100) + '%' }} />
            </div>
            <button className="skip-btn" onClick={() => { setRestActive(false); setRestSecs(0) }}>{t.skip}</button>
          </div>
        </div>
      )}

      <main className="app-main">
        {activeTab === 0 && <ProgramTab t={t} days={days} selectedDay={selectedDay} setSelectedDay={setSelectedDay} program={program} setProgram={setProgram} allEx={allEx} unit={unit} workoutActive={workoutActive} workoutSets={workoutSets} setWorkoutSets={setWorkoutSets} startWorkout={startWorkout} finishWorkout={finishWorkout} history={history} onRestTimer={s => { setRestSecs(s); setRestMax(s); setRestActive(true) }} />}
        {activeTab === 1 && <LibraryTab t={t} days={days} program={program} setProgram={setProgram} customEx={customEx} setCustomEx={setCustomEx} />}
        {activeTab === 2 && <HistoryTab t={t} history={history} days={days} unit={unit} />}
        {activeTab === 3 && <SettingsTab t={t} lang={lang} setLang={setLang} unit={unit} setUnit={setUnit} darkMode={darkMode} setDarkMode={setDarkMode} days={days} setDays={setDays} program={program} setProgram={setProgram} history={history} setHistory={setHistory} customEx={customEx} setCustomEx={setCustomEx} />}
      </main>

      <nav className="tab-bar">
        {tabs.map((tab, i) => (
          <button key={i} className={`tab-btn ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      {showSummary && lastSummary && <WorkoutSummary t={t} summary={lastSummary} unit={unit} onClose={() => setShowSummary(false)} />}
    </div>
  )
}
