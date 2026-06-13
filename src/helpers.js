import { MUSCLE_COLORS } from './constants'

export const uid = () => Math.random().toString(36).slice(2, 9)
export const fmtTime = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
// Local-timezone YYYY-MM-DD (toISOString would give the UTC date, which is
// yesterday for late-night sessions east of Greenwich)
export const localISODate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const fmtDate = d => new Date(d).toLocaleDateString()
export const mc = mg => MUSCLE_COLORS[mg] || '#6b7280'
export const isCardioSet = s => s.duration !== undefined
export const isTimeSet = s => s.secs !== undefined
export const calcVol = ex => {
  if (ex.isWarmup) return 0
  const sets = ex.sets
  if (sets.length && isCardioSet(sets[0]))
    return sets.filter(s => s.completed).reduce((t, s) => t + (s.duration || 0), 0)
  if (sets.length && isTimeSet(sets[0])) return 0
  return sets.filter(s => s.completed).reduce((t, s) => t + (s.weight || 0) * (s.reps || 0), 0)
}
export const METRIC_UNIT = { duration: 'min', distance: 'km', speed: 'km/h', incline: '%', calories: 'kcal', heart_rate: 'bpm', resistance: 'lvl' }
export const CARDIO_PICKER = { duration: { min: 0, max: 360, step: 1 }, distance: { min: 0, max: 100, step: 0.1 }, speed: { min: 0, max: 80, step: 0.1 }, incline: { min: 0, max: 30, step: 1 }, calories: { min: 0, max: 2000, step: 5 }, heart_rate: { min: 40, max: 220, step: 1 }, resistance: { min: 0, max: 30, step: 1 } }
export const newCardioInterval = metrics => {
  const interval = { id: uid(), completed: false }
  metrics.forEach(m => { interval[m] = 0 })
  return interval
}
// Expand a template's day list into live { days, program } maps with fresh ids.
// Shared by the Programs tab (apply template), the wizard, and legacy migration.
export const buildProgramDays = (template, allEx) => {
  const days = template.days.map(d => ({ id: uid(), name: d.name }))
  const program = {}
  template.days.forEach((td, i) => {
    program[days[i].id] = td.exercises
      .filter(te => allEx.find(e => e.id === te.exerciseId))
      .map(te => {
        const exData = allEx.find(e => e.id === te.exerciseId)
        const isCardio = exData?.type === 'cardio'
        const isTime = exData?.inputMode === 'time'
        return {
          id: uid(), exerciseId: te.exerciseId, isWarmup: false,
          restTime: te.restTime ?? (isCardio ? 0 : 90),
          sets: Array.from({ length: te.sets }, () => isCardio
            ? { ...newCardioInterval(exData.metrics || ['duration']), ...(te.duration ? { duration: te.duration } : {}) }
            : isTime
            ? { id: uid(), secs: te.secs ?? 30, completed: false }
            : { id: uid(), reps: te.reps, weight: 0, completed: false }
          )
        }
      })
  })
  return { days, program }
}
// Structural check for imported backup files — rejects shapes that would
// corrupt state (e.g. {"days": 5}) before any setter runs. Accepts both the
// v2 (programs) and legacy (days/program) shapes.
export const validateBackup = d => {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return false
  for (const k of ['history', 'customExercises', 'userTemplates', 'days', 'programs'])
    if (d[k] !== undefined && !Array.isArray(d[k])) return false
  if (d.programs !== undefined && !d.programs.every(p =>
    p && typeof p === 'object' && Array.isArray(p.days)
    && p.program && typeof p.program === 'object' && !Array.isArray(p.program))) return false
  if (d.program !== undefined && (typeof d.program !== 'object' || Array.isArray(d.program) || d.program === null
    || !Object.values(d.program).every(Array.isArray))) return false
  if (d.settings !== undefined && (typeof d.settings !== 'object' || Array.isArray(d.settings) || d.settings === null)) return false
  return true
}
export const weekOf = ds => {
  const d = new Date(ds + 'T12:00:00')
  d.setDate(d.getDate() - (d.getDay() + 6) % 7)
  return localISODate(d)
}
