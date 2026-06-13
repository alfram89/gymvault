import { useState } from 'react'
import { MUSCLE_COLORS, DIFF_COLORS, EXERCISES } from '../constants'
import { mc, uid, newCardioInterval } from '../helpers'
import { EQ_ICONS, DiffBars } from '../Icons.jsx'
import { Modal } from '../components/Modal'
import { EXERCISE_INFO } from '../data/exerciseInfo'

export function LibraryTab({ t, days, program, setProgram, customEx, setCustomEx }) {
  const [srch, setSrch] = useState('')
  const [fM, setFM] = useState('all')
  const [fE, setFE] = useState('all')
  const [fD, setFD] = useState('all')
  const [addModal, setAddModal] = useState(null)
  const [infoModal, setInfoModal] = useState(null)
  const [warmupChoice, setWarmupChoice] = useState(false)
  const [custModal, setCustModal] = useState(false)
  const [confirmDeleteEx, setConfirmDeleteEx] = useState(null)
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
  grouped.forEach(([, exs]) => exs.sort((a, b) => a.name.localeCompare(b.name)))

  const addToDay = (ex, dayId, warmup) => {
    setProgram(prev => {
      const initialSet = ex.type === 'cardio'
        ? newCardioInterval(ex.metrics || ['duration'])
        : ex.inputMode === 'time'
        ? { id: uid(), secs: 30, completed: false }
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
  const deleteCustom = id => {
    setCustomEx(p => p.filter(e => e.id !== id))
    // History keeps its own exerciseName snapshots, so only the program needs cleaning
    setProgram(prev => Object.fromEntries(
      Object.entries(prev).map(([dayId, list]) => [dayId, list.filter(e => e.exerciseId !== id)])
    ))
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
                  <div className="lib-card-actions">
                    {ex.custom && <button className="info-btn" onClick={() => setConfirmDeleteEx(ex)}>🗑</button>}
                    <button className="info-btn" onClick={() => setInfoModal(ex)}>ⓘ</button>
                    <button className="add-btn" onClick={() => handleAdd(ex)}>{t.addProg}</button>
                  </div>
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

      {confirmDeleteEx && (
        <Modal onClose={() => setConfirmDeleteEx(null)}>
          <h3 className="modal-title">🗑 {t.deleteCustomTitle}</h3>
          <p className="modal-warn">{t.deleteCustomBody.replace('{name}', confirmDeleteEx.name)}</p>
          <div className="modal-row">
            <button className="secondary-btn" onClick={() => setConfirmDeleteEx(null)}>{t.cancel}</button>
            <button className="danger-btn modal-danger-btn" onClick={() => { deleteCustom(confirmDeleteEx.id); setConfirmDeleteEx(null) }}>
              {t.deleteConfirm}
            </button>
          </div>
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

      {infoModal && (() => {
        const info = EXERCISE_INFO[infoModal.id]
        const color = mc(infoModal.mg)
        return (
          <Modal onClose={() => setInfoModal(null)}>
            <h3 className="modal-title">{infoModal.name}</h3>
            <div className="info-meta">
              <span className="muscle-tag" style={{ background: color + '22', color }}>{t[infoModal.mg] || infoModal.mg}</span>
              <span className="eq-tag">{t[infoModal.eq] || infoModal.eq}</span>
              <span className="dif-tag" style={{ color: DIFF_COLORS[infoModal.dif] }}>{t[infoModal.dif] || infoModal.dif}</span>
            </div>
            {info ? (
              <>
                <p className="info-label">{t.infoMuscles}</p>
                <p className="info-text">{info.muscles}</p>
                <p className="info-label">{t.infoHowTo}</p>
                <p className="info-text">{info.description}</p>
              </>
            ) : (
              <p className="info-text" style={{ marginTop: 12 }}>{t.infoCustomNote}</p>
            )}
            <button className="secondary-btn" style={{ marginTop: 16 }} onClick={() => setInfoModal(null)}>{t.close}</button>
          </Modal>
        )
      })()}
    </div>
  )
}
