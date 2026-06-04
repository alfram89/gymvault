import { MUSCLE_COLORS } from './constants'

export const uid = () => Math.random().toString(36).slice(2, 9)
export const fmtTime = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
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
export const weekOf = ds => {
  const d = new Date(ds)
  d.setDate(d.getDate() - (d.getDay() + 6) % 7)
  return d.toISOString().split('T')[0]
}
