import Dexie from 'dexie'

const db = new Dexie('GymVaultDB')

db.version(1).stores({
  kv: 'key'
})

export const dbGet = async (key, fallback = null) => {
  try {
    const item = await db.kv.get(key)
    return item ? item.value : fallback
  } catch {
    return fallback
  }
}

export const dbSet = async (key, value) => {
  try {
    await db.kv.put({ key, value })
  } catch (e) {
    console.warn('DB write failed:', e)
  }
}

export const loadAllData = async () => {
  const [settings, days, program, history, customExercises, userTemplates] = await Promise.all([
    dbGet('settings'),
    dbGet('days'),
    dbGet('program'),
    dbGet('history'),
    dbGet('customExercises'),
    dbGet('userTemplates'),
  ])
  return { settings, days, program, history, customExercises, userTemplates }
}

export default db
