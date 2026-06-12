import { useState } from 'react'
import { generateProgram } from '../utils/programGenerator'

const STEPS = ['days', 'goal', 'equipment', 'time', 'focus', 'preview']

const EQUIPMENT_OPTIONS = [
  { id: 'barbell',    label: '🏋️ Barbell' },
  { id: 'dumbbell',   label: '💪 Dumbbells' },
  { id: 'cable',      label: '🔗 Cable' },
  { id: 'machine',    label: '⚙️ Machines' },
  { id: 'bodyweight', label: '🤸 Bodyweight only' },
]

export function ProgramWizard({ t, allEx, history, onApply, onClose }) {
  const [step, setStep] = useState(0)
  const [prefs, setPrefs] = useState({
    daysPerWeek: null,
    goal: null,
    equipment: [],
    sessionMinutes: null,
    focus: null,
  })
  const [generated, setGenerated] = useState(null)

  const sessionCount = (() => {
    if (!history || history.length === 0) return 0
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 56)
    return history.filter(s => new Date(s.date) >= cutoff).length
  })()

  const set = (key, val) => setPrefs(p => ({ ...p, [key]: val }))

  const toggleEquip = id => {
    setPrefs(p => {
      const cur = p.equipment
      if (id === 'bodyweight') {
        return { ...p, equipment: cur.includes('bodyweight') ? [] : ['bodyweight'] }
      }
      const without = cur.filter(e => e !== 'bodyweight')
      return {
        ...p,
        equipment: without.includes(id) ? without.filter(e => e !== id) : [...without, id],
      }
    })
  }

  const canAdvance = () => {
    if (step === 0) return prefs.daysPerWeek !== null
    if (step === 1) return prefs.goal !== null
    if (step === 2) return prefs.equipment.length > 0
    if (step === 3) return prefs.sessionMinutes !== null
    return true
  }

  const advance = () => {
    if (step === STEPS.indexOf('preview') - 1) {
      const result = generateProgram(prefs, allEx, history)
      setGenerated(result)
    }
    setStep(s => s + 1)
  }

  const currentStep = STEPS[step]

  return (
    <div className="wizard-overlay" onClick={onClose}>
      <div className="wizard-sheet" onClick={e => e.stopPropagation()}>

        <div className="wizard-header">
          <button className="wizard-close-btn" onClick={onClose}>✕</button>
          <div className="wizard-steps">
            {STEPS.map((_, i) => (
              <div key={i} className={`wizard-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
            ))}
          </div>
        </div>

        <div className="wizard-body">

          {currentStep === 'days' && (
            <>
              <h2 className="wizard-title">{t.pgDays}</h2>
              {prefs.daysPerWeek && (
                <p className="wizard-hint">{t['pgHint' + prefs.daysPerWeek] || ''}</p>
              )}
              <div className="wizard-days-row">
                {[2, 3, 4, 5, 6].map(n => (
                  <button key={n}
                    className={`wizard-day-btn ${prefs.daysPerWeek === n ? 'active' : ''}`}
                    onClick={() => set('daysPerWeek', n)}>
                    {n}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === 'goal' && (
            <>
              <h2 className="wizard-title">{t.pgGoal}</h2>
              <div className="wizard-goal-list">
                {[
                  { id: 'strength', emoji: '🏋️', label: t.goalStrength, desc: t.goalStrengthDesc },
                  { id: 'muscle',   emoji: '💪', label: t.goalMuscle,   desc: t.goalMuscleDesc   },
                  { id: 'fitness',  emoji: '⚡', label: t.goalFitness,  desc: t.goalFitnessDesc  },
                ].map(g => (
                  <button key={g.id}
                    className={`wizard-goal-card ${prefs.goal === g.id ? 'active' : ''}`}
                    onClick={() => set('goal', g.id)}>
                    <span className="wizard-goal-emoji">{g.emoji}</span>
                    <div>
                      <div className="wizard-goal-name">{g.label}</div>
                      <div className="wizard-goal-desc">{g.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === 'equipment' && (
            <>
              <h2 className="wizard-title">{t.pgEquip}</h2>
              <p className="wizard-hint">{t.pgEquipNote}</p>
              <div className="wizard-equip-list">
                {EQUIPMENT_OPTIONS.map(eq => (
                  <button key={eq.id}
                    className={`wizard-equip-btn ${prefs.equipment.includes(eq.id) ? 'active' : ''}`}
                    onClick={() => toggleEquip(eq.id)}>
                    {eq.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === 'time' && (
            <>
              <h2 className="wizard-title">{t.pgTime}</h2>
              <div className="wizard-time-row">
                {[30, 45, 60, 90].map(m => (
                  <button key={m}
                    className={`wizard-time-btn ${prefs.sessionMinutes === m ? 'active' : ''}`}
                    onClick={() => set('sessionMinutes', m)}>
                    <span className="wizard-time-num">{m}</span>
                    <span className="wizard-time-unit">min</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === 'focus' && (
            <>
              <h2 className="wizard-title">{t.pgFocus}</h2>
              <p className="wizard-hint">{t.pgFocusNote}</p>
              <div className="wizard-focus-list">
                {[
                  { id: null,    label: t.pgSkip,    emoji: '—'  },
                  { id: 'upper', label: t.focusUpper, emoji: '💪' },
                  { id: 'lower', label: t.focusLower, emoji: '🦵' },
                  { id: 'core',  label: t.focusCore,  emoji: '🎯' },
                ].map(f => (
                  <button key={String(f.id)}
                    className={`wizard-focus-btn ${prefs.focus === f.id ? 'active' : ''}`}
                    onClick={() => set('focus', f.id)}>
                    <span className="wizard-focus-emoji">{f.emoji}</span>
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {currentStep === 'preview' && generated && (
            <>
              <h2 className="wizard-title">{generated.name}</h2>
              {sessionCount > 0 && (
                <p className="wizard-personalised-note">
                  ✨ {t.pgPersonalised} ({sessionCount} {t.pgSessions})
                </p>
              )}
              <div className="wizard-preview-days">
                {generated.days.map((day, i) => (
                  <div key={i} className="wizard-preview-day">
                    <div className="wizard-preview-day-name">{day.name}</div>
                    <div className="wizard-preview-exercises">
                      {day.exercises.map((ex, j) => {
                        const exData = allEx.find(e => e.id === ex.exerciseId)
                        return (
                          <span key={j} className="wizard-preview-ex">
                            {exData?.name || ex.exerciseId}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>

        <div className="wizard-footer">
          {step > 0 ? (
            <button className="secondary-btn" onClick={() => setStep(s => s - 1)}>{t.pgBack}</button>
          ) : (
            <button className="secondary-btn" onClick={onClose}>{t.cancel}</button>
          )}

          {currentStep !== 'preview' ? (
            <button className="primary-btn" style={{ flex: 2 }}
              disabled={!canAdvance()}
              onClick={advance}>
              {step === STEPS.indexOf('focus') ? t.pgGenerate : t.pgNext}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, flex: 2 }}>
              <button className="secondary-btn" onClick={() => {
                const result = generateProgram(prefs, allEx, history)
                setGenerated(result)
              }}>{t.pgRegenerate}</button>
              <button className="primary-btn" style={{ flex: 1 }}
                onClick={() => { onApply(generated); onClose() }}>
                {t.pgApply}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
