import { fmtTime } from '../helpers'

export function WorkoutSummary({ summary, unit, t, onClose }) {
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
