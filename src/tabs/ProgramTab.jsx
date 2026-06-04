import { useState, useRef, useEffect } from 'react'
import { mc, uid, fmtTime } from '../helpers'
import { WheelPicker } from '../components/WheelPicker'
import { CardioExCard } from '../components/CardioExCard'

export function ProgramTab({ t, days, selectedDay, setSelectedDay, program, setProgram,
  allEx, unit, workoutActive, workoutSets, setWorkoutSets,
  startWorkout, finishWorkout, history, onRestTimer, onOpenTemplatePicker }) {

  const exercises = program[selectedDay] || []
  const dragIdx = useRef(null)
  const lastSession = history.find(h => h.dayId === selectedDay)
  const [picker, setPicker] = useState(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => { if (workoutActive) setEditMode(false) }, [workoutActive])

  const updEx = (idx, fn) => setProgram(prev => {
    const a = [...(prev[selectedDay] || [])]
    a[idx] = fn(a[idx])
    return { ...prev, [selectedDay]: a }
  })
  const updSet = (ei, si, f, v) => updEx(ei, ex => ({ ...ex, sets: ex.sets.map((s, i) => i === si ? { ...s, [f]: v } : s) }))
  const addSet = ei => updEx(ei, ex => {
    const exD = allEx.find(e => e.id === ex.exerciseId)
    const mode = exD?.inputMode ?? 'weight+reps'
    const last = ex.sets[ex.sets.length - 1]
    const newSet = mode === 'time'
      ? { id: uid(), secs: last?.secs ?? 30, completed: false }
      : { id: uid(), reps: last?.reps ?? 10, weight: last?.weight ?? 0, completed: false }
    return { ...ex, sets: [...ex.sets, newSet] }
  })
  const remSet = (ei, si) => updEx(ei, ex => ex.sets.length <= 1 ? ex : { ...ex, sets: ex.sets.filter((_, i) => i !== si) })
  const remEx = i => setProgram(prev => { const a = [...(prev[selectedDay] || [])]; a.splice(i, 1); return { ...prev, [selectedDay]: a } })
  const moveEx = (i, dir) => setProgram(prev => {
    const a = [...(prev[selectedDay] || [])]
    const j = i + dir
    if (j < 0 || j >= a.length) return prev
    ;[a[i], a[j]] = [a[j], a[i]]
    return { ...prev, [selectedDay]: a }
  })

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
      <div className="day-selector-row">
        <div className="day-selector">
          {days.map(d => (
            <button key={d.id} className={`day-chip ${selectedDay === d.id ? 'active' : ''}`} onClick={() => setSelectedDay(d.id)}>{d.name}</button>
          ))}
        </div>
        {!workoutActive && exercises.length > 0 && (
          <button className="edit-program-btn" onClick={() => setEditMode(e => !e)}>
            {editMode ? t.editDone : t.editProgram}
          </button>
        )}
      </div>

      {exercises.length > 0 && !editMode && (
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
              updEx={updEx} remEx={remEx} ei={ei} editMode={editMode}
              onDragStart={onDragStart} onDrop={onDrop} onMoveUp={() => moveEx(ei, -1)} onMoveDown={() => moveEx(ei, 1)}
              isFirst={ei === 0} isLast={ei === exercises.length - 1} />
          }

          const color = mc(exData?.mg)
          const lastEx = lastSession?.exercises?.find(e => e.exerciseId === ex.exerciseId)
          const mode = exData?.inputMode ?? 'weight+reps'
          const hasWeight = mode === 'weight+reps' || mode === 'reps+added'
          const cols = hasWeight ? '20px 1fr 1fr 28px' : '20px 1fr 28px'
          const wtLabel = exData?.weightLabel === 'kg/hand'
            ? unit + ' / hand'
            : exData?.weightLabel === 'added'
            ? 'Added ' + unit
            : unit

          return (
            <div key={ex.id} className={`ex-card ${ex.isWarmup ? 'warmup-exercise' : ''}`}
              style={{ borderLeftColor: ex.isWarmup ? '#f59e0b' : color }}
              draggable={editMode} onDragStart={() => onDragStart(ei)}
              onDragOver={e => e.preventDefault()} onDrop={() => onDrop(ei)}>

              <div className="ex-header">
                <div>
                  <div className="ex-name">{exData?.name || ex.exerciseId}</div>
                  <div className="ex-tags">
                    <span className="muscle-tag" style={{ background: color + '22', color }}>{t[exData?.mg] || exData?.mg}</span>
                    <span className="eq-tag">{t[exData?.eq] || exData?.eq}</span>
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
                      <button className="move-btn" onClick={() => moveEx(ei, -1)} disabled={ei === 0}>↑</button>
                      <button className="move-btn" onClick={() => moveEx(ei, 1)} disabled={ei === exercises.length - 1}>↓</button>
                      <button className="remove-ex-btn" onClick={() => remEx(ei)}>{t.remove}</button>
                    </>
                  )}
                  {!editMode && !workoutActive && <span className="drag-handle">⠿</span>}
                </div>
              </div>

              {!workoutActive && !editMode && (
                <div className="rest-row">
                  <span className="rest-label">{t.restS}</span>
                  <button className="rest-input set-input-btn"
                    onClick={() => setPicker({ label: t.restS, value: ex.restTime ?? 90, min: 0, max: 600, step: 1, onConfirm: v => updEx(ei, x => ({ ...x, restTime: v })) })}>
                    {ex.restTime ?? 90}
                  </button>
                </div>
              )}

              {!editMode && (
                <>
                  <div className="sets-header" style={{ gridTemplateColumns: cols }}>
                    <span>#</span>
                    <span>{mode === 'time' ? t.secs : t.reps}</span>
                    {hasWeight && <span>{mode === 'reps+added' ? t.addedWt : t.wt}</span>}
                    <span></span>
                  </div>

                  {ex.sets.map((set, si) => {
                    const ws = workoutSets[ex.id]?.[si]
                    const done = workoutActive && ws?.completed
                    const lastSet = lastEx?.sets?.[si]
                    const secsVal = workoutActive ? (ws?.secs ?? set.secs ?? 30) : (set.secs ?? 30)
                    const repsVal = workoutActive ? (ws?.reps ?? set.reps) : set.reps
                    const wtVal   = workoutActive ? (ws?.weight ?? set.weight) : set.weight
                    return (
                      <div key={set.id || si} className={`set-row ${done ? 'set-done' : ''}`} style={{ gridTemplateColumns: cols }}>
                        <span className="set-num">{si + 1}</span>
                        <div>
                          {mode === 'time' ? (
                            <button className="set-input set-input-btn"
                              onClick={() => { if (!done) setPicker({ label: t.secs, value: secsVal, min: 5, max: 600, step: 5, onConfirm: v => workoutActive ? updWS(ex.id, si, 'secs', v) : updSet(ei, si, 'secs', v) }) }}>
                              {fmtTime(secsVal)}
                            </button>
                          ) : (
                            <button className="set-input set-input-btn"
                              onClick={() => { if (!done) setPicker({ label: t.reps, value: repsVal, min: 1, max: exData?.repsMax ?? 50, step: 1, onConfirm: v => workoutActive ? updWS(ex.id, si, 'reps', v) : updSet(ei, si, 'reps', v) }) }}>
                              {repsVal}
                            </button>
                          )}
                          {lastSet && !workoutActive && (
                            <div className="set-hint">
                              {mode === 'time' ? fmtTime(lastSet.secs ?? 0) : lastSet.reps}
                            </div>
                          )}
                        </div>
                        {hasWeight && (
                          <div>
                            <button className="set-input set-input-btn"
                              onClick={() => { if (!done) setPicker({ label: t.wt, value: wtVal, unit: wtLabel, min: 0, max: exData?.weightMax ?? 250, step: exData?.weightStep ?? 0.5, onConfirm: v => workoutActive ? updWS(ex.id, si, 'weight', v) : updSet(ei, si, 'weight', v) }) }}>
                              {wtVal}
                            </button>
                            {lastSet && !workoutActive && <div className="set-hint">{lastSet.weight}</div>}
                          </div>
                        )}
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
                </>
              )}
            </div>
          )
        })
      )}

      {picker && <WheelPicker t={t} {...picker} onClose={() => setPicker(null)} />}
    </div>
  )
}
