import { useState, useEffect } from 'react'
import BarbellIcon from './BarbellIcon'
import { dbGet, dbSet, loadAllData } from './db'
import { EXERCISES } from './constants'
import { getTranslations } from './i18n/index.js'
import { TemplatePicker } from './TemplatePicker.jsx'
import { ProgramWizard } from './components/ProgramWizard.jsx'
import { uid, fmtTime, isCardioSet, isTimeSet, calcVol, localISODate, buildProgramDays } from './helpers'
import { Onboarding } from './components/Onboarding'
import { WorkoutSummary } from './components/WorkoutSummary'
import { ProgramTab } from './tabs/ProgramTab'
import { ProgramsTab } from './tabs/ProgramsTab'
import { LibraryTab } from './tabs/LibraryTab'
import { HistoryTab } from './tabs/HistoryTab'
import { SettingsTab } from './tabs/SettingsTab'
import './index.css'

// A brand-new empty program (used on first run, reset, and when the last
// program is deleted)
const freshProgram = () => {
  const en = getTranslations('en')
  const d1 = uid(), d2 = uid()
  return { id: uid(), name: en.myProgram, days: [{ id: d1, name: en.dayA }, { id: d2, name: en.dayB }], program: { [d1]: [], [d2]: [] } }
}

// Build the programs list from a legacy (pre-multi-program) data shape:
// the single days/program pair plus every saved user template.
const migrateLegacy = (data, allEx) => {
  const en = getTranslations('en')
  const progs = []
  if (data.days || data.program) {
    progs.push({ id: uid(), name: en.myProgram, days: data.days ?? [], program: data.program ?? {} })
  }
  ;(data.userTemplates || []).forEach(tpl => {
    const { days, program } = buildProgramDays(tpl, allEx)
    progs.push({ id: uid(), name: tpl.name, days, program })
  })
  return progs.length ? progs : [freshProgram()]
}

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [onboarded, setOnboarded] = useState(false)
  const [darkMode, setDarkMode] = useState('dark')
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [unit, setUnit] = useState('kg')
  const [lang, setLang] = useState('en')
  const [programs, setPrograms] = useState(() => [freshProgram()])
  const [activeProgramId, setActiveProgramId] = useState(() => programs[0].id)
  const [selectedDay, setSelectedDay] = useState('')
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
  const [restStartTime, setRestStartTime] = useState(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showProgramWizard, setShowProgramWizard] = useState(false)

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
      }
      if (data.history) setHistory(data.history)
      if (data.customExercises) setCustomEx(data.customExercises)

      // Programs: use the v2 list if present, else migrate the legacy shape
      const allExLocal = [...EXERCISES, ...(data.customExercises || [])]
      const progs = data.programs?.length ? data.programs : migrateLegacy(data, allExLocal)
      const wanted = data.settings?.activeProgramId
      const activeId = wanted && progs.find(p => p.id === wanted) ? wanted : progs[0].id
      setPrograms(progs)
      setActiveProgramId(activeId)

      const active = progs.find(p => p.id === activeId)
      let sel = data.settings?.selectedDay
      if (!active?.days.some(d => d.id === sel)) sel = active?.days[0]?.id ?? ''

      if (data.activeWorkout) {
        const aw = data.activeWorkout
        if (aw.programId && progs.find(p => p.id === aw.programId)) setActiveProgramId(aw.programId)
        sel = aw.dayId
        setWorkoutSets(aw.workoutSets || {})
        setWorkoutStart(aw.workoutStart)
        setWorkoutElapsed(Math.floor((Date.now() - aw.workoutStart) / 1000))
        setWorkoutActive(true)
      }
      setSelectedDay(sel)
      setLoaded(true)
    }).catch(e => {
      console.error('Failed to load data from IndexedDB, starting with defaults:', e)
      setLoaded(true)
    })
  }, [])

  useEffect(() => { if (loaded) dbSet('settings', { onboarded, darkMode, unit, lang, selectedDay, activeProgramId }) }, [loaded, onboarded, darkMode, unit, lang, selectedDay, activeProgramId])
  useEffect(() => { if (loaded) dbSet('programs', programs) }, [loaded, programs])
  useEffect(() => { if (loaded) dbSet('history', history) }, [loaded, history])
  useEffect(() => { if (loaded) dbSet('customExercises', customEx) }, [loaded, customEx])
  useEffect(() => {
    if (loaded) dbSet('activeWorkout', workoutActive ? { workoutStart, workoutSets, dayId: selectedDay, programId: activeProgramId } : null)
  }, [loaded, workoutActive, workoutStart, workoutSets, selectedDay, activeProgramId])

  useEffect(() => {
    if (!restActive || restSecs <= 0) { if (restSecs <= 0) setRestActive(false); return }
    const id = setTimeout(() => {
      const remaining = Math.max(0, restMax - Math.floor((Date.now() - restStartTime) / 1000))
      setRestSecs(remaining)
    }, 1000)
    return () => clearTimeout(id)
  }, [restActive, restSecs, restMax, restStartTime])

  useEffect(() => {
    if (!workoutActive) return
    const id = setTimeout(() => setWorkoutElapsed(Math.floor((Date.now() - workoutStart) / 1000)), 1000)
    return () => clearTimeout(id)
  }, [workoutActive, workoutElapsed, workoutStart])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (workoutActive && workoutStart) setWorkoutElapsed(Math.floor((Date.now() - workoutStart) / 1000))
      if (restActive && restStartTime) {
        const remaining = Math.max(0, restMax - Math.floor((Date.now() - restStartTime) / 1000))
        setRestSecs(remaining)
        if (remaining <= 0) setRestActive(false)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [workoutActive, workoutStart, restActive, restStartTime, restMax])

  const t = getTranslations(lang)
  const effectiveDark = darkMode === 'auto' ? systemDark : darkMode === 'dark'
  const allEx = [...EXERCISES, ...customEx]

  // The active program is the single source of truth for days/program; the
  // wrapper setters write changes back into its slot in the programs list, so
  // child tabs keep their existing days/setDays/program/setProgram interface.
  const activeProgram = programs.find(p => p.id === activeProgramId) || programs[0]
  const activeId = activeProgram?.id
  const days = activeProgram?.days ?? []
  const program = activeProgram?.program ?? {}
  const setDays = upd => setPrograms(prev => prev.map(p => p.id !== activeId ? p
    : { ...p, days: typeof upd === 'function' ? upd(p.days) : upd }))
  const setProgram = upd => setPrograms(prev => prev.map(p => p.id !== activeId ? p
    : { ...p, program: typeof upd === 'function' ? upd(p.program) : upd }))
  const curProg = program[selectedDay] || []

  const startWorkout = () => {
    const sets = {}
    curProg.forEach(ex => { sets[ex.id] = ex.sets.map(s => ({ ...s, completed: false })) })
    setWorkoutSets(sets); setWorkoutStart(Date.now()); setWorkoutElapsed(0); setWorkoutActive(true)
  }

  const finishWorkout = () => {
    const duration = Math.floor((Date.now() - workoutStart) / 1000)
    const sess = {
      id: uid(), date: localISODate(),
      dayId: selectedDay, dayName: days.find(d => d.id === selectedDay)?.name || '',
      duration,
      exercises: curProg.map(ex => {
        const ed = allEx.find(e => e.id === ex.exerciseId)
        // muscleGroup duplicates mg for older history entries that predate the mg field
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
          day[i] = { ...ex, sets: ex.sets.map((s, j) => { const ws = workoutSets[ex.id]?.[j]; return ws && ws.completed ? { ...s, ...ws } : s }) }
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

  // Apply a template: 'add' appends its days to the active program; otherwise
  // it becomes a brand-new program (the new active one).
  const applyTemplate = (template, mode) => {
    const { days: newDays, program: newProgram } = buildProgramDays(template, allEx)
    if (mode === 'add') {
      setPrograms(prev => prev.map(p => p.id !== activeId ? p
        : { ...p, days: [...p.days, ...newDays], program: { ...p.program, ...newProgram } }))
    } else {
      const np = { id: uid(), name: template.name || getTranslations('en').myProgram, days: newDays, program: newProgram }
      setPrograms(prev => [...prev, np])
      setActiveProgramId(np.id)
      setSelectedDay(newDays[0]?.id ?? '')
    }
    setShowTemplatePicker(false)
    setActiveTab(0)
  }

  const switchProgram = id => {
    if (workoutActive) return
    const p = programs.find(x => x.id === id)
    if (!p) return
    setActiveProgramId(id)
    setSelectedDay(p.days[0]?.id ?? '')
  }

  const renameProgram = (id, name) => setPrograms(prev => prev.map(p => p.id === id ? { ...p, name } : p))

  const duplicateProgram = id => {
    const src = programs.find(p => p.id === id)
    if (!src) return
    const idMap = {}
    const newDays = src.days.map(d => { const nid = uid(); idMap[d.id] = nid; return { id: nid, name: d.name } })
    const newProgram = {}
    src.days.forEach(d => {
      newProgram[idMap[d.id]] = (src.program[d.id] || []).map(ex => ({
        ...ex, id: uid(), sets: ex.sets.map(s => ({ ...s, id: uid() }))
      }))
    })
    setPrograms(prev => [...prev, { id: uid(), name: `${src.name} ${t.copySuffix}`, days: newDays, program: newProgram }])
  }

  const deleteProgram = id => {
    const remaining = programs.filter(p => p.id !== id)
    if (!remaining.length) {
      const f = freshProgram()
      setPrograms([f]); setActiveProgramId(f.id); setSelectedDay(f.days[0].id)
      return
    }
    setPrograms(remaining)
    if (activeProgramId === id) {
      setActiveProgramId(remaining[0].id)
      setSelectedDay(remaining[0].days[0]?.id ?? '')
    }
  }

  const importData = parsed => {
    const allExLocal = [...EXERCISES, ...(parsed.customExercises || [])]
    const progs = parsed.programs?.length ? parsed.programs : migrateLegacy(parsed, allExLocal)
    const activeId2 = parsed.activeProgramId && progs.find(p => p.id === parsed.activeProgramId) ? parsed.activeProgramId : progs[0].id
    setPrograms(progs); setActiveProgramId(activeId2)
    setSelectedDay(progs.find(p => p.id === activeId2)?.days[0]?.id ?? '')
    if (parsed.history) setHistory(parsed.history)
    if (parsed.customExercises) setCustomEx(parsed.customExercises)
    if (parsed.settings?.language) setLang(parsed.settings.language)
    if (parsed.settings?.unit) setUnit(parsed.settings.unit)
    if (parsed.settings?.darkMode !== undefined) {
      const dm = parsed.settings.darkMode
      setDarkMode(dm === true ? 'dark' : dm === false ? 'light' : dm)
    }
  }

  const resetData = () => {
    const f = freshProgram()
    setPrograms([f]); setActiveProgramId(f.id); setSelectedDay(f.days[0].id)
    setHistory([]); setCustomEx([])
  }

  const handleOnboard = ({ unit: u }) => {
    setUnit(u); setOnboarded(true)
  }

  if (!loaded) return <div style={{ minHeight: '100vh', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#6b7280', fontSize: 14 }}>Loading…</div></div>

  if (!onboarded) return <Onboarding onComplete={handleOnboard} />

  const tabs = [{ icon: '🏋️', label: t.prog }, { icon: '📋', label: t.programs }, { icon: '📚', label: t.lib }, { icon: '📈', label: t.hist }, { icon: '⚙️', label: t.sets }]

  return (
    <div className={`app ${effectiveDark ? 'dark' : 'light'}`}>
      <header className="app-header">
        <div className="app-title"><BarbellIcon size={26} /> GymVault</div>
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
        {activeTab === 0 && <ProgramTab t={t} days={days} selectedDay={selectedDay} setSelectedDay={setSelectedDay} program={program} setProgram={setProgram} allEx={allEx} unit={unit} workoutActive={workoutActive} workoutSets={workoutSets} setWorkoutSets={setWorkoutSets} startWorkout={startWorkout} finishWorkout={finishWorkout} history={history} onRestTimer={s => { setRestSecs(s); setRestMax(s); setRestStartTime(Date.now()); setRestActive(true) }} onOpenTemplatePicker={() => setActiveTab(1)} />}
        {activeTab === 1 && <ProgramsTab t={t} programs={programs} activeProgramId={activeId} workoutActive={workoutActive} onSwitch={switchProgram} onRename={renameProgram} onDuplicate={duplicateProgram} onDelete={deleteProgram} onBrowseTemplates={() => setShowTemplatePicker(true)} onOpenWizard={() => setShowProgramWizard(true)} />}
        {activeTab === 2 && <LibraryTab t={t} days={days} program={program} setProgram={setProgram} customEx={customEx} setCustomEx={setCustomEx} />}
        {activeTab === 3 && <HistoryTab t={t} history={history} days={days} unit={unit} darkMode={effectiveDark} />}
        {activeTab === 4 && <SettingsTab t={t} lang={lang} setLang={setLang} unit={unit} setUnit={setUnit} darkMode={darkMode} setDarkMode={setDarkMode} days={days} setDays={setDays} selectedDay={selectedDay} setSelectedDay={setSelectedDay} program={program} setProgram={setProgram} programs={programs} activeProgramId={activeId} history={history} customEx={customEx} installPrompt={installPrompt} setInstallPrompt={setInstallPrompt} onImportData={importData} onResetData={resetData} />}
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
        <TemplatePicker t={t} allEx={allEx}
          onApply={applyTemplate}
          onClose={() => setShowTemplatePicker(false)} />
      )}
      {showProgramWizard && (
        <ProgramWizard t={t} allEx={allEx} history={history}
          onApply={tpl => applyTemplate(tpl, 'new')}
          onClose={() => setShowProgramWizard(false)} />
      )}
    </div>
  )
}
