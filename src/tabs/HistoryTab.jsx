import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { mc, fmtTime, fmtDate, isCardioSet, isTimeSet, calcVol, weekOf, localISODate, METRIC_UNIT } from '../helpers'
import { MUSCLE_COLORS } from '../constants'
import { Modal } from '../components/Modal'

const MG_KEYS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

export function HistoryTab({ t, history, days, unit, darkMode }) {
  const [fDay, setFDay] = useState('all')
  const [selEx, setSelEx] = useState('')
  const [viewSess, setViewSess] = useState(null)
  const [showAllLog, setShowAllLog] = useState(false)

  const filtered = fDay === 'all' ? history : history.filter(h => h.dayId === fDay)

  // ── Quick stats ──────────────────────────────────────────────────────────────
  const thisMonth = history.filter(h => h.date.startsWith(localISODate().slice(0, 7))).length
  const dayCounts = Array(7).fill(0)
  history.forEach(h => { dayCounts[new Date(h.date + 'T12:00:00').getDay()]++ })
  const favDay = history.length ? t.dayShort[dayCounts.indexOf(Math.max(...dayCounts))] : '—'

  // ── Heatmap with volume intensity ────────────────────────────────────────────
  const streak = useMemo(() => {
    let s = 0
    const trained = new Set(history.map(h => h.date))
    const srt = [...trained].sort().reverse()
    if (srt.length) {
      const c = new Date()
      for (const ds of srt) {
        if (ds === localISODate(c)) { s++; c.setDate(c.getDate() - 1) }
        else break
      }
    }
    return s
  }, [history])

  // ── Sessions per week (last 12 weeks) ─────────────────────────────────────────
  const freqData = useMemo(() => {
    const counts = {}
    history.forEach(h => { const w = weekOf(h.date); counts[w] = (counts[w] || 0) + 1 })
    const today = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (11 - i) * 7)
      const w = weekOf(localISODate(d))
      return { w: w.slice(5), sessions: counts[w] || 0 }
    })
  }, [history])

  // ── Muscle group balance (radar) ─────────────────────────────────────────────
  const radarData = useMemo(() => {
    const mgCounts = Object.fromEntries(MG_KEYS.map(mg => [mg, 0]))
    history.forEach(h => {
      const mgs = new Set(
        h.exercises.filter(e => !e.isWarmup).map(e => e.mg || e.muscleGroup).filter(Boolean)
      )
      mgs.forEach(mg => { if (mg in mgCounts) mgCounts[mg]++ })
    })
    return MG_KEYS.map(mg => ({
      mg: t[mg] || mg,
      value: history.length ? Math.round((mgCounts[mg] / history.length) * 100) : 0,
    }))
  }, [history, t])

  // ── Weekly volume stacked by muscle group ─────────────────────────────────────
  const volData = useMemo(() => {
    const weekMap = {}
    history.forEach(h => {
      const w = weekOf(h.date)
      if (!weekMap[w]) weekMap[w] = { w: w.slice(5) }
      MG_KEYS.forEach(mg => {
        const vol = h.exercises
          .filter(ex => !ex.isWarmup && (ex.mg || ex.muscleGroup) === mg && (!ex.sets.length || !isCardioSet(ex.sets[0])))
          .reduce((sum, ex) => sum + calcVol(ex), 0)
        weekMap[w][mg] = Math.round((weekMap[w][mg] || 0) + vol)
      })
    })
    return Object.values(weekMap).sort((a, b) => a.w > b.w ? 1 : -1).slice(-8)
  }, [history])

  // ── Exercise list sorted by most-logged ───────────────────────────────────────
  const histEx = useMemo(() => {
    const exCount = {}
    const seen = new Map()
    history.flatMap(h => h.exercises).forEach(e => {
      exCount[e.exerciseId] = (exCount[e.exerciseId] || 0) + 1
      if (!seen.has(e.exerciseId)) seen.set(e.exerciseId, { id: e.exerciseId, name: e.exerciseName || e.exerciseId })
    })
    return [...seen.values()].sort((a, b) => (exCount[b.id] || 0) - (exCount[a.id] || 0))
  }, [history])

  const activeEx = selEx || histEx[0]?.id || ''

  // ── Progression data with PR markers ─────────────────────────────────────────
  const { progData, prWeight } = useMemo(() => {
    if (!activeEx) return { progData: [], prWeight: null }
    const data = [...history]
      .filter(h => h.exercises.some(e => e.exerciseId === activeEx && !e.isWarmup))
      .reverse()
      .map(h => {
        const ex = h.exercises.find(e => e.exerciseId === activeEx && !e.isWarmup)
        const mw = Math.max(0, ...ex.sets.filter(s => s.completed && s.weight > 0).map(s => s.weight))
        return { date: h.date.slice(5), weight: mw, isPR: false }
      })
    let max = 0
    data.forEach(d => { if (d.weight > max) { max = d.weight; d.isPR = true } })
    return { progData: data, prWeight: max > 0 ? max : null }
  }, [history, activeEx])

  const logSessions = showAllLog ? filtered : filtered.slice(0, 5)

  // ── Chart styling ─────────────────────────────────────────────────────────────
  const gridColor = darkMode ? '#374151' : '#e5e7eb'
  const tickColor = darkMode ? '#9ca3af' : '#6b7280'
  const ttBg = darkMode ? '#1f2937' : '#ffffff'

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: ttBg, borderRadius: 8, fontSize: 12, padding: '6px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        {label && <p style={{ margin: '0 0 4px', color: tickColor }}>{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} style={{ margin: '2px 0', color: entry.color }}>
            {entry.name ? `${entry.name}: ` : ''}{entry.value}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="tab-scroll">
      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p className="empty-sub">{t.noHist}</p>
        </div>
      ) : (
        <>
          {/* Stats overview */}
          <div className="stats-row">
            <div className="stat-tile">
              <div className="stat-tile-val">{history.length}</div>
              <div className="stat-tile-label">{t.totalSessions}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-val" style={{ color: '#fb923c' }}>{streak}</div>
              <div className="stat-tile-label">{t.streak}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-val">{thisMonth}</div>
              <div className="stat-tile-label">{t.thisMonth}</div>
            </div>
            <div className="stat-tile">
              <div className="stat-tile-val">{favDay}</div>
              <div className="stat-tile-label">{t.favDay}</div>
            </div>
          </div>

          {/* Training frequency */}
          <div className="section-card">
            <h3 className="section-card-title">📅 {t.freqTitle}</h3>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={freqData} margin={{ left: -20, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="w" tick={{ fill: tickColor, fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fill: tickColor, fontSize: 10 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="sessions" name={t.freqLabel} fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Muscle group balance */}
          <div className="section-card">
            <h3 className="section-card-title">💪 {t.mgBalance}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="mg" tick={{ fill: tickColor, fontSize: 11 }} />
                <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly volume stacked by muscle group */}
          {volData.length > 0 && (
            <div className="section-card">
              <h3 className="section-card-title">📊 {t.wkVol}</h3>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={volData} margin={{ left: -20, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="w" tick={{ fill: tickColor, fontSize: 10 }} />
                  <YAxis tick={{ fill: tickColor, fontSize: 10 }} />
                  <Tooltip content={<ChartTooltip />} />
                  {MG_KEYS.map(mg => (
                    <Bar key={mg} dataKey={mg} name={t[mg] || mg} stackId="a" fill={MUSCLE_COLORS[mg]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Exercise progression */}
          {histEx.length > 0 && (
            <div className="section-card">
              <h3 className="section-card-title">📈 {t.wtProg}</h3>
              <select value={activeEx} onChange={e => setSelEx(e.target.value)} className="select-input">
                {histEx.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              {progData.length > 1 ? (
                <>
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={progData} margin={{ left: -20, right: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="date" tick={{ fill: tickColor, fontSize: 10 }} />
                      <YAxis tick={{ fill: tickColor, fontSize: 10 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy, payload } = props
                          return payload?.isPR
                            ? <circle key={`pr-${cx}`} cx={cx} cy={cy} r={5} fill="#facc15" stroke="#22c55e" strokeWidth={1.5} />
                            : <circle key={`dot-${cx}`} cx={cx} cy={cy} r={3} fill="#22c55e" />
                        }}
                        activeDot={{ r: 5, fill: '#22c55e' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  {prWeight && (
                    <p className="chart-pr-note">
                      <span className="pr-dot-legend" /> {t.prsTitle}: <span style={{ color: '#facc15', fontWeight: 700 }}>{prWeight} {unit}</span>
                    </p>
                  )}
                </>
              ) : (
                <p className="chart-empty">Log more sessions to see progression</p>
              )}
            </div>
          )}

          {/* Workout log */}
          <div className="section-card">
            <h3 className="section-card-title">🗓 {t.wkLog}</h3>
            <div className="chip-row" style={{ marginBottom: 10 }}>
              {[['all', t.allDays], ...days.map(d => [d.id, d.name])].map(([id, nm]) => (
                <button
                  key={id}
                  className={`chip ${fDay === id ? 'active' : ''}`}
                  onClick={() => { setFDay(id); setShowAllLog(false) }}
                >{nm}</button>
              ))}
            </div>
            {logSessions.map(sess => (
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
            {filtered.length > 5 && (
              <button className="show-more-btn" onClick={() => setShowAllLog(v => !v)}>
                {showAllLog ? t.showLess : `${t.showAll} (${filtered.length})`}
              </button>
            )}
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
            <span className="session-vol">{Math.round(viewSess.exercises.reduce((s, ex) => s + calcVol(ex), 0))} {unit}</span>
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
                        ? Object.entries(s).filter(([k]) => !['id', 'completed'].includes(k) && s[k] > 0).map(([k, v]) => (
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
