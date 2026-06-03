import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { dbGet, dbSet, loadAllData } from './db'
import { MUSCLE_COLORS, DIFF_COLORS, EXERCISES } from './constants'
import { getTranslations, availableLanguages } from './i18n/index.js'
import { EQ_ICONS, DiffBars } from './Icons.jsx'
import { TemplatePicker } from './TemplatePicker.jsx'
import './index.css'

// ── HELPERS ──────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9)
const fmtTime = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
const fmtDate = d => new Date(d).toLocaleDateString()
const mc = mg => MUSCLE_COLORS[mg] || '#6b7280'
const isCardioSet = s => s.duration !== undefined
const calcVol = ex => {
  if (ex.isWarmup) return 0
  const sets = ex.sets
  if (sets.length && isCardioSet(sets[0]))
    return sets.filter(s => s.completed).reduce((t, s) => t + (s.duration || 0), 0)
  return sets.filter(s => s.completed).reduce((t, s) => t + (s.weight || 0) * (s.reps || 0), 0)
}
const METRIC_UNIT = { duration: 'min', distance: 'km', speed: 'km/h', incline: '%', calories: 'kcal', heart_rate: 'bpm', resistance: 'lvl' }
const CARDIO_PICKER = { duration: { min: 0, max: 120, step: 1 }, distance: { min: 0, max: 100, step: 0.1 }, speed: { min: 0, max: 40, step: 0.1 }, incline: { min: 0, max: 30, step: 1 }, calories: { min: 0, max: 2000, step: 5 }, heart_rate: { min: 40, max: 220, step: 1 }, resistance: { min: 0, max: 30, step: 1 } }
const newCardioInterval = metrics => {
  const interval = { id: uid(), completed: false }
  metrics.forEach(m => { interval[m] = 0 })
  return interval
}
const weekOf = ds => { const d = new Date(ds); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.toISOString().split('T')[0] }

// ── WHEEL PICKER ─────────────────────────────────────────────────
function WheelPicker({ label, value, min, max, step, unit, t, onClose, onConfirm }) {
  const ITEM_H = 44
  const items = []
  for (let v = min; v <= max; v = Math.round((v + step) * 1000) / 1000) items.push(v)

  const valueToIdx = v => Math.max(0, Math.min(items.length - 1, Math.round((v - min) / step)))

  const scrollRef = useRef(null)
  const selectedRef = useRef(items[valueToIdx(value)])
  const timerRef = useRef(null)

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = valueToIdx(value) * ITEM_H
  }, [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const idx = Math.round(scrollRef.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(items.length - 1, idx))
    selectedRef.current = items[clamped]
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = clamped * ITEM_H
    }, 150)
  }

  const handleDone = () => { onConfirm(selectedRef.current); onClose() }

  return (
    <div className="wheel-overlay" onClick={onClose}>
      <div className="wheel-sheet" onClick={e => e.stopPropagation()}>
        <div className="wheel-header">
          <span className="wheel-label">{label}{unit ? ` (${unit})` : ''}</span>
          <button className="wheel-done-btn" onClick={handleDone}>{t.done}</button>
        </div>
        <div className="wheel-wrap">
          <div className="wheel-scroll" ref={scrollRef} onScroll={handleScroll}>
            <div className="wheel-pad" />
            {items.map((v, i) => (
              <div key={i} className="wheel-item">{step < 1 ? v.toFixed(1) : v}</div>
            ))}
            <div className="wheel-pad" />
          </div>
          <div className="wheel-selector" />
          <div className="wheel-fade-top" />
          <div className="wheel-fade-bottom" />
        </div>
      </div>
    </div>
  )
}

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
  const { hasStrength, hasCardio, totalSets, totalVolume, cardioIntervals, cardioTime, warmupCount, prs, duration } = summary

  const stats = [
    [t.dur, fmtTime(duration)],
    ...(hasStrength ? [[t.compSets, totalSets], [t.totVol, Math.round(totalVolume) + ' ' + unit]] : []),
    ...(hasCardio ? [[t.intervals, cardioIntervals], [t.cardioTimeLbl, fmtTime(cardioTime)]] : []),
    ...((hasStrength || hasCardio) ? [[t.newPRs, prs.length]] : []),
  ]

  return (
    <div className="summary-overlay">
      <div className="summary-box">
        <h2>{t.workDone}</h2>
        <div className="stat-grid">
          {stats.map(([label, val]) => (
            <div key={label} className="stat-card">
              <div className="stat-val">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
        {prs.length > 0 && (
          <div className="pr-box">
            <p className="pr-title">🏆 {t.newPRs}</p>
            {prs.map((pr, i) => (
              <div key={i} className="pr-row">
                <span>{pr.name}</span>
                <span className="pr-val">{pr.weight} {unit}</span>
              </div>
            ))}
          </div>
        )}
        {warmupCount > 0 && (
          <p className="summary-warmup">🔥 {warmupCount} {warmupCount === 1 ? t.warmupDone : t.warmupsDone}</p>
        )}
        <button className="primary-btn" onClick={onClose}>{t.close}</button>
      </div>
    </div>
  )
}

// ── CARDIO EXERCISE CARD ─────────────────────────────────────────
function CardioExCard({ ex, exData, t, workoutActive, workoutSets, setWorkoutSets, updEx, remEx, ei, onDragStart, onDrop }) {
  const color = mc(exData?.mg)
  const metrics = exData?.metrics || ['duration']
  const [picker, setPicker] = useState(null)

  const intervals = ex.sets
  const updInterval = (si, field, val) => updEx(ei, e => ({ ...e, sets: e.sets.map((s, i) => i === si ? { ...s, [field]: val } : s) }))
  const addInterval = () => updEx(ei, e => ({ ...e, sets: [...e.sets, { ...newCardioInterval(metrics), id: uid() }] }))
  const remInterval = si => updEx(ei, e => e.sets.length <= 1 ? e : { ...e, sets: e.sets.filter((_, i) => i !== si) })
  const completeInterval = si => {
    setWorkoutSets(prev => { const s = [...(prev[ex.id] || [])]; s[si] = { ...s[si], completed: true }; return { ...prev, [ex.id]: s } })
  }
  const updWS = (si, field, val) => setWorkoutSets(prev => { const s = [...(prev[ex.id] || [])]; s[si] = { ...s[si], [field]: val }; return { ...prev, [ex.id]: s } })

  return (
    <div className={`ex-card cardio-card ${ex.isWarmup ? 'warmup-exercise' : ''}`}
      style={{ borderLeftColor: ex.isWarmup ? '#f59e0b' : color }}
      draggable onDragStart={() => onDragStart(ei)}
      onDragOver={e => e.preventDefault()} onDrop={() => onDrop(ei)}>

      <div className="ex-header">
        <div>
          <div className="ex-name">{exData?.name || ex.exerciseId}</div>
          <div className="ex-tags">
            <span className="muscle-tag" style={{ background: color + '22', color }}>{t.cardio}</span>
            <span className="eq-tag">{t[exData?.eq] || exData?.eq}</span>
            <span className="dif-tag" style={{ color: DIFF_COLORS[exData?.dif] }}>{t[exData?.dif] || exData?.dif}</span>
          </div>
        </div>
        <div className="ex-actions">
          {!workoutActive && (
            <button className={`warmup-chip ${ex.isWarmup ? 'active' : ''}`}
              onClick={() => updEx(ei, e => ({ ...e, isWarmup: !e.isWarmup }))}>
              {ex.isWarmup ? '🔥' : t.warmupEx}
            </button>
          )}
          <span className="drag-handle">⠿</span>
          {!workoutActive && <button className="remove-btn" onClick={() => remEx(ei)}>✕</button>}
        </div>
      </div>

      <div className="cardio-header">
        <span>#</span>
        {metrics.map(m => <span key={m}>{t[m] || m}</span>)}
        <span></span>
      </div>

      {intervals.map((interval, si) => {
        const ws = workoutSets[ex.id]?.[si]
        const done = workoutActive && ws?.completed
        return (
          <div key={interval.id || si} className={`cardio-row ${done ? 'set-done' : ''}`}>
            <span className="set-num">{si + 1}</span>
            {metrics.map(m => {
              const val = workoutActive ? (ws?.[m] ?? interval[m]) : interval[m]
              return (
                <div key={m} className="cardio-cell">
                  <button
                    className="set-input cardio-input set-input-btn"
                    onClick={() => {
                      if (!done) {
                        const cfg = CARDIO_PICKER[m] || { min: 0, max: 999, step: 1 }
                        setPicker({ label: t[m] || m, value: val || 0, ...cfg, unit: METRIC_UNIT[m], onConfirm: n => workoutActive ? updWS(si, m, n) : updInterval(si, m, n) })
                      }
                    }}>
                    {val || 0}
                  </button>
                  <div className="cardio-unit">{METRIC_UNIT[m]}</div>
                </div>
              )
            })}
            <div className="complete-cell">
              {workoutActive ? (
                <button className={`complete-btn ${done ? 'done' : ''}`} onClick={() => !done && completeInterval(si)}>
                  {done ? '✓' : '○'}
                </button>
              ) : (
                <button className="rem-set-btn" onClick={() => remInterval(si)}>✕</button>
              )}
            </div>
          </div>
        )
      })}

      {!workoutActive && (
        <button className="add-set-btn" onClick={addInterval}>{t.addInterval}</button>
      )}
      {picker && <WheelPicker t={t} {...picker} onClose={() => setPicker(null)} />}
    </div>
  )
}

// ── PROGRAM TAB ──────────────────────────────────────────────────
function ProgramTab({ t, days, selectedDay, setSelectedDay, program, setProgram,
  allEx, unit, workoutActive, workoutSets, setWorkoutSets,
  startWorkout, finishWorkout, history, onRestTimer, onOpenTemplatePicker }) {

  const exercises = program[selectedDay] || []
  const dragIdx = useRef(null)
  const lastSession = history.find(h => h.dayId === selectedDay)
  const [picker, setPicker] = useState(null)

  const updEx = (idx, fn) => setProgram(prev => {
    const a = [...(prev[selectedDay] || [])]
    a[idx] = fn(a[idx])
    return { ...prev, [selectedDay]: a }
  })
  const updSet = (ei, si, f, v) => updEx(ei, ex => ({ ...ex, sets: ex.sets.map((s, i) => i === si ? { ...s, [f]: v } : s) }))
  const addSet = ei => updEx(ei, ex => {
    const last = ex.sets[ex.sets.length - 1] || { reps: 10, weight: 0 }
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

      {exercises.length > 0 && (
        <div className="workout-action-bar">
          <button className={`workout-action-btn ${workoutActive ? 'finish' : 'start'}`}
            onClick={workoutActive ? finishWorkout : startWorkout}>
            {workoutActive ? `🏁 ${t.finishW}` : `▶ ${t.startW}`}
          </button>
        </div>
      )}

      {exercises.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏋️</div>
          <p className="empty-title">{t.noEx}</p>
          <p className="empty-sub">{t.addLib}</p>
          <button className="tpl-empty-btn" onClick={onOpenTemplatePicker}>
            📋 {t.startFromTemplate}
          </button>
        </div>
      ) : (
        exercises.map((ex, ei) => {
          const exData = allEx.find(e => e.id === ex.exerciseId)

          if (exData?.type === 'cardio') {
            return <CardioExCard key={ex.id} ex={ex} exData={exData} t={t}
              workoutActive={workoutActive} workoutSets={workoutSets} setWorkoutSets={setWorkoutSets}
              updEx={updEx} remEx={remEx} ei={ei} onDragStart={onDragStart} onDrop={onDrop} />
          }

          const color = mc(exData?.mg)
          const lastEx = lastSession?.exercises?.find(e => e.exerciseId === ex.exerciseId)

          return (
            <div key={ex.id} className={`ex-card ${ex.isWarmup ? 'warmup-exercise' : ''}`} style={{ borderLeftColor: ex.isWarmup ? '#f59e0b' : color }}
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
                  {!workoutActive && (
                    <button className={`warmup-chip ${ex.isWarmup ? 'active' : ''}`}
                      onClick={() => updEx(ei, e => ({ ...e, isWarmup: !e.isWarmup }))}>
                      {ex.isWarmup ? '🔥' : t.warmupEx}
                    </button>
                  )}
                  <span className="drag-handle">⠿</span>
                  {!workoutActive && <button className="remove-btn" onClick={() => remEx(ei)}>✕</button>}
                </div>
              </div>

              {!workoutActive && (
                <div className="rest-row">
                  <span className="rest-label">{t.restS}</span>
                  <button className="rest-input set-input-btn"
                    onClick={() => setPicker({ label: t.restS, value: ex.restTime ?? 90, min: 0, max: 600, step: 1, onConfirm: v => updEx(ei, x => ({ ...x, restTime: v })) })}>
                    {ex.restTime ?? 90}
                  </button>
                </div>
              )}

              <div className="sets-header">
                <span>#</span><span>{t.reps}</span><span>{t.wt}</span><span></span>
              </div>

              {ex.sets.map((set, si) => {
                const ws = workoutSets[ex.id]?.[si]
                const done = workoutActive && ws?.completed
                const lastSet = lastEx?.sets?.[si]
                return (
                  <div key={set.id || si} className={`set-row ${done ? 'set-done' : ''}`}>
                    <span className="set-num">{si + 1}</span>
                    <div>
                      <button
                        className="set-input set-input-btn"
                        onClick={() => { if (!done) setPicker({ label: t.reps, value: workoutActive ? (ws?.reps ?? set.reps) : set.reps, min: 1, max: 50, step: 1, onConfirm: v => workoutActive ? updWS(ex.id, si, 'reps', v) : updSet(ei, si, 'reps', v) }) }}>
                        {workoutActive ? (ws?.reps ?? set.reps) : set.reps}
                      </button>
                      {lastSet && !workoutActive && <div className="set-hint">{lastSet.reps}</div>}
                    </div>
                    <div>
                      <button
                        className="set-input set-input-btn"
                        onClick={() => { if (!done) setPicker({ label: t.wt, value: workoutActive ? (ws?.weight ?? set.weight) : set.weight, unit, min: 0, max: 250, step: 0.5, onConfirm: v => workoutActive ? updWS(ex.id, si, 'weight', v) : updSet(ei, si, 'weight', v) }) }}>
                        {workoutActive ? (ws?.weight ?? set.weight) : set.weight}
                      </button>
                      {lastSet && !workoutActive && <div className="set-hint">{lastSet.weight}</div>}
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

      {picker && <WheelPicker t={t} {...picker} onClose={() => setPicker(null)} />}
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
  const [warmupChoice, setWarmupChoice] = useState(false)
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

  const addToDay = (ex, dayId, warmup) => {
    setProgram(prev => {
      const initialSet = ex.type === 'cardio'
        ? newCardioInterval(ex.metrics || ['duration'])
        : { id: uid(), reps: 10, weight: 0, completed: false }
      const ne = { id: uid(), exerciseId: ex.id, isWarmup: !!warmup, sets: [initialSet], restTime: ex.type === 'cardio' ? 0 : 90 }
      return { ...prev, [dayId]: [...(prev[dayId] || []), ne] }
    })
    setAddModal(null)
    setWarmupChoice(false)
  }
  const handleAdd = ex => setAddModal(ex)
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

      {grouped.map(([mg, exs]) => {
        return (
          <div key={mg} className="muscle-group">
            <div className="mg-header">
              <div className="mg-dot" style={{ background: mc(mg) }} />
              <span className="mg-label" style={{ color: mc(mg) }}>{t[mg]}</span>
            </div>
            {exs.map(ex => {
              const EqIcon = EQ_ICONS[ex.eq]
              return (
                <div key={ex.id} className="lib-card" style={{ borderLeftColor: mc(ex.mg) }}>
                  <div>
                    <div className="lib-name">{ex.name}</div>
                    <div className="lib-tags">
                      <span className="eq-tag">{EqIcon && <EqIcon size={13} />}{t[ex.eq]}</span>
                      <span className="dif-tag" style={{ color: DIFF_COLORS[ex.dif] }}><DiffBars dif={ex.dif} />{t[ex.dif]}</span>
                      {ex.custom && <span className="custom-badge">✦ custom</span>}
                    </div>
                  </div>
                  <button className="add-btn" onClick={() => handleAdd(ex)}>{t.addProg}</button>
                </div>
              )
            })}
          </div>
        )
      })}

      {addModal && (
        <Modal onClose={() => { setAddModal(null); setWarmupChoice(false) }}>
          <h3 className="modal-title">{addModal.name}</h3>
          <div className="warmup-toggle-row">
            {[[false, t.workingEx], [true, t.warmupEx]].map(([val, label]) => (
              <button key={String(val)}
                className={`toggle-btn ${warmupChoice === val ? 'active' : ''}`}
                onClick={() => setWarmupChoice(val)}>
                {val ? '🔥 ' : ''}{label}
              </button>
            ))}
          </div>
          <p className="modal-sub" style={{ marginTop: 12 }}>{days.length > 1 ? t.selDayP : ''}</p>
          {days.map(d => (
            <button key={d.id} className="primary-btn" style={{ marginBottom: 8 }}
              onClick={() => addToDay(addModal, d.id, warmupChoice)}>{d.name}</button>
          ))}
          <button className="ghost-btn" onClick={() => { setAddModal(null); setWarmupChoice(false) }}>{t.cancel}</button>
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
function HistoryTab({ t, history, days, unit, darkMode }) {
  const [fDay, setFDay] = useState('all')
  const [selEx, setSelEx] = useState('')
  const [viewSess, setViewSess] = useState(null)

  const filtered = fDay === 'all' ? history : history.filter(h => h.dayId === fDay)

  const prs = {}
  history.forEach(sess => sess.exercises.forEach(ex => {
    if (ex.isWarmup) return
    ex.sets.filter(s => s.completed && (s.weight || 0) > 0).forEach(s => {
      if (!prs[ex.exerciseId] || s.weight > prs[ex.exerciseId].weight)
        prs[ex.exerciseId] = { weight: s.weight, name: ex.exerciseName, date: sess.date }
    })
  }))

  const histEx = [...new Set(history.flatMap(h => h.exercises.map(e => e.exerciseId)))]
    .map(id => ({ id, name: history.flatMap(h => h.exercises).find(e => e.exerciseId === id)?.exerciseName || id }))

  const progData = [...history].filter(h => h.exercises.some(e => e.exerciseId === selEx && !e.isWarmup)).reverse().map(h => {
    const ex = h.exercises.find(e => e.exerciseId === selEx && !e.isWarmup)
    const mw = Math.max(0, ...ex.sets.filter(s => s.completed && s.weight > 0).map(s => s.weight))
    return { date: h.date.slice(5), weight: mw }
  })

  const weekVol = {}
  history.forEach(h => {
    const w = weekOf(h.date)
    const vol = h.exercises.filter(ex => !ex.sets.length || !isCardioSet(ex.sets[0])).reduce((t, ex) => t + calcVol(ex), 0)
    weekVol[w] = (weekVol[w] || 0) + vol
  })
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

  const gridColor = darkMode ? '#374151' : '#e5e7eb'
  const tickColor = darkMode ? '#9ca3af' : '#6b7280'
  const ttStyle = { contentStyle: { background: darkMode ? '#1f2937' : '#ffffff', border: 'none', borderRadius: 8, fontSize: 12 } }

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
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="w" tick={{ fill: tickColor, fontSize: 10 }} />
                  <YAxis tick={{ fill: tickColor, fontSize: 10 }} />
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
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 10 }} />
                  <YAxis tick={{ fill: tickColor, fontSize: 10 }} />
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
            <span className="session-vol">{Math.round(viewSess.exercises.reduce((t, ex) => t + calcVol(ex), 0))} {unit}</span>
          </div>
          <div className="session-detail">
            {viewSess.exercises.map((ex, i) => {
              const cardio = ex.sets.length && isCardioSet(ex.sets[0])
              return (
                <div key={i} className="sess-ex" style={{ borderLeftColor: mc(ex.mg || ex.muscleGroup) }}>
                  <div className="sess-ex-name">
                  {ex.exerciseName}
                  {ex.isWarmup && <span className="warmup-badge">🔥 {t.warmupEx}</span>}
                </div>
                  {ex.sets.map((s, j) => (
                    <div key={j} className={`sess-set ${s.isWarmup ? 'warmup' : ''}`}>
                      <span>{cardio ? t.interval : 'Set'} {j + 1}</span>
                      {cardio
                        ? Object.entries(s).filter(([k]) => !['id','completed'].includes(k) && s[k] > 0).map(([k, v]) => (
                            <span key={k}>{t[k] || k}: {k === 'duration' ? fmtTime(v) : v} {METRIC_UNIT[k] || ''}</span>
                          ))
                        : <><span>{s.reps} reps</span><span>{s.weight} {unit}</span></>
                      }
                      {s.completed && <span className="set-check">✓</span>}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <button className="secondary-btn" onClick={() => setViewSess(null)}>{t.close}</button>
        </Modal>
      )}
    </div>
  )
}

// ── SETTINGS TAB ─────────────────────────────────────────────────
function SettingsTab({ t, lang, setLang, unit, setUnit, darkMode, setDarkMode,
  days, setDays, program, setProgram, history, setHistory, customEx, setCustomEx,
  userTemplates, setUserTemplates, installPrompt, setInstallPrompt,
  onOpenTemplatePicker, onSaveTemplate }) {

  const isInstalled = window.matchMedia('(display-mode: standalone)').matches
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const [showIOSHint, setShowIOSHint] = useState(false)

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt()
      setInstallPrompt(null)
    } else if (isIOS) {
      setShowIOSHint(true)
    }
  }

  const [newDay, setNewDay] = useState('')
  const [editId, setEditId] = useState(null)
  const [editV, setEditV] = useState('')
  const [resetV, setResetV] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [showSaveTpl, setShowSaveTpl] = useState(false)
  const [saveTplName, setSaveTplName] = useState('')
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
    const data = { version: 1, days, program, history, customExercises: customEx, userTemplates, settings: { language: lang, unit, darkMode } }
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
        if (d.userTemplates) setUserTemplates(d.userTemplates)
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
    setProgram({ 'day-a': [], 'day-b': [] }); setHistory([]); setCustomEx([]); setUserTemplates([])
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
        <button className="data-btn" onClick={onOpenTemplatePicker}>📋 {t.loadTemplate}</button>
        <button className="data-btn" onClick={() => setShowSaveTpl(true)}>💾 {t.saveAsTemplate}</button>
        <button className="data-btn" onClick={exportJSON}>⬇️ {t.expJ}</button>
        <button className="data-btn" onClick={() => fileRef.current?.click()}>⬆️ {t.impJ}</button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importJSON} />
      </div>

      {showSaveTpl && (
        <Modal onClose={() => { setShowSaveTpl(false); setSaveTplName('') }}>
          <h3 className="modal-title">{t.saveTemplateTitle}</h3>
          <input value={saveTplName} onChange={e => setSaveTplName(e.target.value)}
            placeholder={t.saveTemplatePl} className="modal-input" autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && saveTplName.trim()) { onSaveTemplate(saveTplName.trim()); setShowSaveTpl(false); setSaveTplName('') } }} />
          <div className="modal-row">
            <button className="secondary-btn" onClick={() => { setShowSaveTpl(false); setSaveTplName('') }}>{t.cancel}</button>
            <button className="primary-btn"
              onClick={() => { if (saveTplName.trim()) { onSaveTemplate(saveTplName.trim()); setShowSaveTpl(false); setSaveTplName('') } }}>
              {t.save}
            </button>
          </div>
        </Modal>
      )}

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

      {!isInstalled && (isIOS || installPrompt) && (
        <div className="settings-section">
          <button className="data-btn install-btn" onClick={handleInstall}>📲 {t.install}</button>
        </div>
      )}

      {showIOSHint && (
        <Modal onClose={() => setShowIOSHint(false)}>
          <h3 className="modal-title">📲 {t.installIosTitle}</h3>
          <div className="ios-install-steps">
            <p>1. {t.installIosStep1} <span className="ios-share-icon">□↑</span> {t.installIosStep2}</p>
            <p>2. {t.installIosStep3}</p>
          </div>
          <button className="primary-btn" style={{ marginTop: 16 }} onClick={() => setShowIOSHint(false)}>{t.close}</button>
        </Modal>
      )}

      <div className="settings-section">
        <p className="section-label">{t.abt}</p>
        <div className="about-content">
          <span>{t.ver}</span>
          <span>{t.lic}</span>
          <a href="https://github.com/alfram89/GymTrack" target="_blank" rel="noopener noreferrer" className="gh-link">🔗 {t.gh}</a>
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
  const [installPrompt, setInstallPrompt] = useState(null)
  const [userTemplates, setUserTemplates] = useState([])
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  useEffect(() => {
    const handler = e => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

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
      if (data.userTemplates) setUserTemplates(data.userTemplates)
      setLoaded(true)
    })
  }, [])

  // Persist to IndexedDB whenever state changes
  useEffect(() => { if (loaded) dbSet('settings', { onboarded, darkMode, unit, lang, selectedDay }) }, [loaded, onboarded, darkMode, unit, lang, selectedDay])
  useEffect(() => { if (loaded) dbSet('days', days) }, [loaded, days])
  useEffect(() => { if (loaded) dbSet('program', program) }, [loaded, program])
  useEffect(() => { if (loaded) dbSet('history', history) }, [loaded, history])
  useEffect(() => { if (loaded) dbSet('customExercises', customEx) }, [loaded, customEx])
  useEffect(() => { if (loaded) dbSet('userTemplates', userTemplates) }, [loaded, userTemplates])

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
        return { exerciseId: ex.exerciseId, exerciseName: ed?.name || ex.exerciseId, mg: ed?.mg || '', muscleGroup: ed?.mg || '', isWarmup: ex.isWarmup || false, sets: (workoutSets[ex.id] || ex.sets).map(s => ({ ...s })) }
      })
    }
    const prs = []
    sess.exercises.forEach(ex => {
      if (ex.isWarmup) return
      if (ex.sets.length && isCardioSet(ex.sets[0])) return
      const mw = Math.max(0, ...ex.sets.filter(s => s.completed && (s.weight || 0) > 0).map(s => s.weight))
      if (mw > 0) {
        const pm = history.flatMap(h => h.exercises.filter(e => e.exerciseId === ex.exerciseId && !e.isWarmup)).flatMap(e => e.sets.filter(s => s.completed)).reduce((m, s) => Math.max(m, s.weight || 0), 0)
        if (mw > pm) prs.push({ name: ex.exerciseName, weight: mw })
      }
    })
    setProgram(prev => {
      const day = [...(prev[selectedDay] || [])]
      day.forEach((ex, i) => {
        const exData = allEx.find(e => e.id === ex.exerciseId)
        if (exData?.type === 'cardio') {
          day[i] = { ...ex, sets: ex.sets.map((s, j) => { const ws = workoutSets[ex.id]?.[j]; return ws && ws.completed ? { ...ws } : s }) }
        } else {
          day[i] = { ...ex, sets: ex.sets.map((s, j) => { const ws = workoutSets[ex.id]?.[j]; return ws && ws.completed ? { ...s, reps: ws.reps, weight: ws.weight } : s }) }
        }
      })
      return { ...prev, [selectedDay]: day }
    })
    const totalSets = sess.exercises.filter(e => !e.isWarmup && e.sets.length && !isCardioSet(e.sets[0])).flatMap(e => e.sets).filter(s => s.completed).length
    const totalVolume = sess.exercises.reduce((t, ex) => t + calcVol(ex), 0)
    let cardioIntervals = 0, cardioTime = 0
    sess.exercises.forEach(ex => {
      if (ex.isWarmup || !ex.sets.length || !isCardioSet(ex.sets[0])) return
      const done = ex.sets.filter(s => s.completed)
      cardioIntervals += done.length
      cardioTime += done.reduce((sum, s) => sum + (s.duration || 0), 0)
    })
    const warmupCount = sess.exercises.filter(e => e.isWarmup && e.sets.some(s => s.completed)).length
    const hasStrength = sess.exercises.some(e => !e.isWarmup && e.sets.length && !isCardioSet(e.sets[0]))
    const hasCardio = sess.exercises.some(e => !e.isWarmup && e.sets.length && isCardioSet(e.sets[0]))
    setLastSummary({ ...sess, prs, totalSets, totalVolume, cardioIntervals, cardioTime, warmupCount, hasStrength, hasCardio })
    setHistory(prev => [sess, ...prev])
    setWorkoutActive(false); setRestActive(false); setRestSecs(0); setShowSummary(true)
  }

  const applyTemplate = (template, mode) => {
    const newDays = template.days.map(d => ({ id: uid(), name: d.name }))
    const newProgram = {}
    template.days.forEach((td, i) => {
      newProgram[newDays[i].id] = td.exercises
        .filter(te => allEx.find(e => e.id === te.exerciseId))
        .map(te => ({
          id: uid(), exerciseId: te.exerciseId, isWarmup: false,
          restTime: te.restTime ?? 90,
          sets: Array.from({ length: te.sets }, () => ({
            id: uid(), reps: te.reps, weight: 0, completed: false
          }))
        }))
    })
    if (mode === 'replace') {
      setDays(newDays); setProgram(newProgram); setSelectedDay(newDays[0].id)
    } else {
      setDays(prev => [...prev, ...newDays])
      setProgram(prev => ({ ...prev, ...newProgram }))
    }
    setShowTemplatePicker(false)
    setActiveTab(0)
  }

  const saveAsTemplate = name => {
    const tpl = {
      id: uid(), name, description: '', tags: [],
      days: days.map(d => ({
        name: d.name,
        exercises: (program[d.id] || []).map(ex => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets.length,
          reps: ex.sets[0]?.reps || 10,
          restTime: ex.restTime ?? 90
        }))
      }))
    }
    setUserTemplates(prev => [...prev, tpl])
  }

  const deleteUserTemplate = id => setUserTemplates(prev => prev.filter(t => t.id !== id))

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
        {activeTab === 0 && <ProgramTab t={t} days={days} selectedDay={selectedDay} setSelectedDay={setSelectedDay} program={program} setProgram={setProgram} allEx={allEx} unit={unit} workoutActive={workoutActive} workoutSets={workoutSets} setWorkoutSets={setWorkoutSets} startWorkout={startWorkout} finishWorkout={finishWorkout} history={history} onRestTimer={s => { setRestSecs(s); setRestMax(s); setRestActive(true) }} onOpenTemplatePicker={() => setShowTemplatePicker(true)} />}
        {activeTab === 1 && <LibraryTab t={t} days={days} program={program} setProgram={setProgram} customEx={customEx} setCustomEx={setCustomEx} />}
        {activeTab === 2 && <HistoryTab t={t} history={history} days={days} unit={unit} darkMode={darkMode} />}
        {activeTab === 3 && <SettingsTab t={t} lang={lang} setLang={setLang} unit={unit} setUnit={setUnit} darkMode={darkMode} setDarkMode={setDarkMode} days={days} setDays={setDays} program={program} setProgram={setProgram} history={history} setHistory={setHistory} customEx={customEx} setCustomEx={setCustomEx} userTemplates={userTemplates} setUserTemplates={setUserTemplates} installPrompt={installPrompt} setInstallPrompt={setInstallPrompt} onOpenTemplatePicker={() => setShowTemplatePicker(true)} onSaveTemplate={saveAsTemplate} />}
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
      {showTemplatePicker && (
        <TemplatePicker t={t} allEx={allEx} userTemplates={userTemplates}
          onApply={applyTemplate}
          onDelete={deleteUserTemplate}
          onClose={() => setShowTemplatePicker(false)} />
      )}
    </div>
  )
}
