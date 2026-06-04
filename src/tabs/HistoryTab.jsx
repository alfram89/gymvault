import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { mc, fmtTime, fmtDate, isCardioSet, isTimeSet, calcVol, weekOf, METRIC_UNIT } from '../helpers'
import { Modal } from '../components/Modal'

export function HistoryTab({ t, history, days, unit, darkMode }) {
  const [fDay, setFDay] = useState('all')
  const [selEx, setSelEx] = useState('')
  const [viewSess, setViewSess] = useState(null)

  const filtered = fDay === 'all' ? history : history.filter(h => h.dayId === fDay)

  const prs = {}
  history.forEach(sess => sess.exercises.forEach(ex => {
    if (ex.isWarmup) return
    ex.sets.filter(s => s.completed && (s.weight || 0) > 0).forEach(s => {
      if (!prs[ex.exerciseId] || s.weight > prs[ex.exerciseId].weight)
        prs[ex.exerciseId] = { weight: s.weight, name: ex.exerciseName, date: sess.date, mg: ex.mg || ex.muscleGroup || '' }
    })
  }))
  const prList = Object.values(prs).sort((a, b) => b.date.localeCompare(a.date))

  const histEx = []
  const histExSeen = new Map()
  history.flatMap(h => h.exercises).forEach(e => {
    if (!histExSeen.has(e.exerciseId)) {
      histExSeen.set(e.exerciseId, true)
      histEx.push({ id: e.exerciseId, name: e.exerciseName || e.exerciseId })
    }
  })

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

  const { heatmap, streak } = useMemo(() => {
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
    return { heatmap, streak }
  }, [history])

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

          {prList.length > 0 && (
            <div className="section-card">
              <h3>🏆 {t.prsTitle}</h3>
              <div className="pr-scroll-row">
                {prList.map((pr, i) => {
                  const color = mc(pr.mg)
                  return (
                    <div key={i} className="pr-chip" style={{ borderLeftColor: color }}>
                      <span className="pr-chip-name">{pr.name}</span>
                      <span className="pr-chip-weight">{pr.weight} {unit}</span>
                      <span className="pr-chip-date">{fmtDate(pr.date)}</span>
                    </div>
                  )
                })}
              </div>
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
                        : isTimeSet(s)
                        ? <span>{fmtTime(s.secs)}</span>
                        : <><span>{s.reps} reps</span>{s.weight > 0 && <span>{s.weight} {unit}</span>}</>
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
