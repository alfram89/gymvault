import { useState, useEffect } from 'react'
import { dbGet, dbSet, loadAllData } from './db'
import { EXERCISES } from './constants'
import { getTranslations } from './i18n/index.js'
import { TemplatePicker } from './TemplatePicker.jsx'
import { uid, fmtTime, isCardioSet, isTimeSet, calcVol } from './helpers'
import { Onboarding } from './components/Onboarding'
import { WorkoutSummary } from './components/WorkoutSummary'
import { ProgramTab } from './tabs/ProgramTab'
import { LibraryTab } from './tabs/LibraryTab'
import { HistoryTab } from './tabs/HistoryTab'
import { SettingsTab } from './tabs/SettingsTab'
import './index.css'

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [onboarded, setOnboarded] = useState(false)
  const [darkMode, setDarkMode] = useState('dark')
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
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
  const [workoutElapsed, setWorkoutElapsed] = useState(0)
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

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = e => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    loadAllData().then(data => {
      if (data.settings) {
        setOnboarded(data.settings.onboarded ?? false)
        const saved = data.settings.darkMode
        setDarkMode(saved === true ? 'dark' : saved === false ? 'light' : saved ?? 'dark')
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

  useEffect(() => { if (loaded) dbSet('settings', { onboarded, darkMode, unit, lang, selectedDay }) }, [loaded, onboarded, darkMode, unit, lang, selectedDay])
  useEffect(() => { if (loaded) dbSet('days', days) }, [loaded, days])
  useEffect(() => { if (loaded) dbSet('program', program) }, [loaded, program])
  useEffect(() => { if (loaded) dbSet('history', history) }, [loaded, history])
  useEffect(() => { if (loaded) dbSet('customExercises', customEx) }, [loaded, customEx])
  useEffect(() => { if (loaded) dbSet('userTemplates', userTemplates) }, [loaded, userTemplates])

  useEffect(() => {
    if (!restActive || restSecs <= 0) { if (restSecs <= 0) setRestActive(false); return }
    const id = setTimeout(() => setRestSecs(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [restActive, restSecs])

  useEffect(() => {
    if (!workoutActive) return
    const id = setTimeout(() => setWorkoutElapsed(s => s + 1), 1000)
    return () => clearTimeout(id)
  }, [workoutActive, workoutElapsed])

  const t = getTranslations(lang)
  const effectiveDark = darkMode === 'auto' ? systemDark : darkMode === 'dark'
  const allEx = [...EXERCISES, ...customEx]
  const curProg = program[selectedDay] || []

  const startWorkout = () => {
    const sets = {}
    curProg.forEach(ex => { sets[ex.id] = ex.sets.map(s => ({ ...s, completed: false })) })
    setWorkoutSets(sets); setWorkoutStart(Date.now()); setWorkoutElapsed(0); setWorkoutActive(true)
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
      if (ex.sets.length && (isCardioSet(ex.sets[0]) || isTimeSet(ex.sets[0]))) return
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
        } else if (ex.sets.length && isTimeSet(ex.sets[0])) {
          day[i] = { ...ex, sets: ex.sets.map((s, j) => { const ws = workoutSets[ex.id]?.[j]; return ws && ws.completed ? { ...s, secs: ws.secs } : s }) }
        } else {
          day[i] = { ...ex, sets: ex.sets.map((s, j) => { const ws = workoutSets[ex.id]?.[j]; return ws && ws.completed ? { ...s, reps: ws.reps, weight: ws.weight } : s }) }
        }
      })
      return { ...prev, [selectedDay]: day }
    })
    const totalSets = sess.exercises.filter(e => !e.isWarmup && e.sets.length && !isCardioSet(e.sets[0]) && !isTimeSet(e.sets[0])).flatMap(e => e.sets).filter(s => s.completed).length
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
        .map(te => {
          const exData = allEx.find(e => e.id === te.exerciseId)
          const isTime = exData?.inputMode === 'time'
          return {
            id: uid(), exerciseId: te.exerciseId, isWarmup: false,
            restTime: te.restTime ?? 90,
            sets: Array.from({ length: te.sets }, () => isTime
              ? { id: uid(), secs: te.secs ?? 30, completed: false }
              : { id: uid(), reps: te.reps, weight: 0, completed: false }
            )
          }
        })
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
    <div className={`app ${effectiveDark ? 'dark' : 'light'}`}>
      <header className="app-header">
        <div className="app-title">💪 GymTrack</div>
        {workoutActive && (
          <div className="workout-badge">
            <div className="workout-badge-row">
              <span className="pulse-dot" />
              <span>{t.workAct}</span>
            </div>
            <div className="workout-badge-time">{fmtTime(workoutElapsed)}</div>
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
        {activeTab === 2 && <HistoryTab t={t} history={history} days={days} unit={unit} darkMode={effectiveDark} />}
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
