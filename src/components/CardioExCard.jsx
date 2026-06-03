import { useState } from 'react'
import { DIFF_COLORS } from '../constants'
import { mc, METRIC_UNIT, CARDIO_PICKER, newCardioInterval, uid } from '../helpers'
import { WheelPicker } from './WheelPicker'

export function CardioExCard({ ex, exData, t, workoutActive, workoutSets, setWorkoutSets,
  updEx, remEx, ei, editMode, onDragStart, onDrop, onMoveUp, onMoveDown, isFirst, isLast }) {
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
      draggable={editMode} onDragStart={() => onDragStart(ei)}
      onDragOver={e => e.preventDefault()} onDrop={() => onDrop(ei)}>

      <div className="ex-header">
        <div>
          <div className="ex-name">{exData?.name || ex.exerciseId}</div>
          <div className="ex-tags">
            <span className="muscle-tag" style={{ background: color + '22', color }}>{t.cardio}</span>
            <span className="eq-tag">{t[exData?.eq] || exData?.eq}</span>
            <span className="dif-tag" style={{ color: DIFF_COLORS[exData?.dif] }}>{t[exData?.dif] || exData?.dif}</span>
            {ex.isWarmup && <span className="warmup-badge-inline">🔥</span>}
          </div>
        </div>
        <div className="ex-actions">
          {editMode && (
            <>
              <button className={`warmup-chip ${ex.isWarmup ? 'active' : ''}`}
                onClick={() => updEx(ei, e => ({ ...e, isWarmup: !e.isWarmup }))}>
                {ex.isWarmup ? '🔥' : t.warmupEx}
              </button>
              <button className="move-btn" onClick={onMoveUp} disabled={isFirst}>↑</button>
              <button className="move-btn" onClick={onMoveDown} disabled={isLast}>↓</button>
              <button className="remove-ex-btn" onClick={() => remEx(ei)}>{t.remove}</button>
            </>
          )}
          {!editMode && !workoutActive && <span className="drag-handle">⠿</span>}
        </div>
      </div>

      {!editMode && (
        <>
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
        </>
      )}

      {picker && <WheelPicker t={t} {...picker} onClose={() => setPicker(null)} />}
    </div>
  )
}
