// Each slot is an ordered array of exercise IDs — first candidate that passes
// the equipment filter wins. A/B variants pick different exercises for variety.

const DAY_SLOTS = {
  full_A: [
    ['bench-press',  'db-press',    'push-up',      'cable-fly'    ],  // chest
    ['barbell-row',  'pull-up',     'lat-pulldown',  'db-row'       ],  // back horizontal
    ['squat',        'leg-press',   'lunges',        'hack-squat'   ],  // legs quad
    ['ohp',          'db-shpress',  'arnold-press'                  ],  // shoulders
    ['pull-up',      'lat-pulldown','chin-up',       'seated-row'   ],  // back vertical
    ['plank',        'hanging-lr',  'crunch',        'cable-crunch' ],  // core
  ],
  full_B: [
    ['incline-bench','db-press',    'push-up',       'cable-fly'    ],  // chest variation
    ['lat-pulldown', 'chin-up',     'pull-up',       'seated-row'   ],  // back vertical
    ['rdl',          'bulgarian',   'leg-press',     'lunges'       ],  // legs hinge
    ['db-shpress',   'lat-raise',   'face-pull',     'arnold-press' ],  // shoulders variation
    ['barbell-curl', 'hammer-curl', 'skull-crusher', 'tricep-dips'  ],  // arms
    ['crunch',       'russian-twist','mtn-climber',  'hanging-lr'   ],  // core variation
  ],
  full_C: [
    ['decline-bench','cable-fly',   'db-fly',        'push-up'      ],  // chest
    ['t-bar-row',    'db-row',      'barbell-row',   'seated-row'   ],  // back
    ['leg-press',    'hack-squat',  'bulgarian',     'lunges'       ],  // legs variation
    ['ohp',          'arnold-press','face-pull'                     ],  // shoulders
    ['tricep-push',  'skull-crusher','tricep-dips',  'overhead-ext' ],  // triceps
    ['ab-wheel',     'hanging-lr',  'cable-crunch',  'crunch'       ],  // core
  ],

  upper_A: [
    ['bench-press',  'db-press',    'push-up',       'cable-fly'    ],  // chest compound
    ['barbell-row',  'db-row',      't-bar-row',     'seated-row'   ],  // back horizontal
    ['ohp',          'db-shpress',  'arnold-press'                  ],  // shoulders
    ['pull-up',      'lat-pulldown','chin-up',       'seated-row'   ],  // back vertical
    ['barbell-curl', 'hammer-curl', 'preacher-curl'                 ],  // biceps
    ['skull-crusher','tricep-push', 'tricep-dips',   'overhead-ext' ],  // triceps
  ],
  upper_B: [
    ['incline-bench','cable-fly',   'db-fly',        'push-up'      ],  // chest variation
    ['lat-pulldown', 'chin-up',     'seated-row',    'db-row'       ],  // back variation
    ['db-shpress',   'lat-raise',   'arnold-press',  'face-pull'    ],  // shoulders variation
    ['face-pull',    'lat-raise',   'front-raise'                   ],  // rear delt/isolation
    ['hammer-curl',  'conc-curl',   'preacher-curl'                 ],  // biceps variation
    ['tricep-push',  'overhead-ext','skull-crusher', 'tricep-dips'  ],  // triceps variation
  ],
  lower_A: [
    ['squat',        'leg-press',   'hack-squat',    'lunges'       ],  // quad compound
    ['deadlift',     'rdl',         'bulgarian',     'lunges'       ],  // hip hinge
    ['leg-press',    'hack-squat',  'leg-ext',       'lunges'       ],  // quad machine
    ['leg-curl',                                                     ],  // hamstring
    ['calf-raise'                                                    ],  // calf
    ['plank',        'hanging-lr',  'crunch',        'cable-crunch' ],  // core
  ],
  lower_B: [
    ['rdl',          'deadlift',    'bulgarian',     'lunges'       ],  // hinge first
    ['hack-squat',   'leg-press',   'bulgarian',     'squat'        ],  // quad variation
    ['leg-ext',      'leg-press',   'hack-squat'                    ],  // quad isolation
    ['leg-curl'                                                      ],  // hamstring
    ['calf-raise'                                                    ],  // calf
    ['ab-wheel',     'crunch',      'russian-twist', 'hanging-lr'   ],  // core variation
  ],

  push_A: [
    ['bench-press',  'db-press',    'push-up'                       ],  // chest compound
    ['incline-bench','cable-fly',   'db-fly',        'push-up'      ],  // chest incline
    ['ohp',          'db-shpress',  'arnold-press'                  ],  // shoulders compound
    ['lat-raise',    'front-raise', 'face-pull'                     ],  // shoulder isolation
    ['skull-crusher','tricep-push', 'tricep-dips'                   ],  // triceps compound
    ['overhead-ext', 'tricep-push', 'tricep-dips'                   ],  // triceps isolation
  ],
  push_B: [
    ['incline-bench','db-press',    'push-up',       'cable-fly'    ],  // chest variation
    ['cable-fly',    'db-fly',      'chest-dip',     'decline-bench'],  // chest isolation
    ['db-shpress',   'arnold-press','ohp'                           ],  // shoulders
    ['lat-raise',    'front-raise'                                   ],  // shoulder isolation
    ['tricep-push',  'tricep-dips', 'overhead-ext'                  ],  // triceps
    ['skull-crusher','overhead-ext','tricep-dips'                   ],  // triceps variation
  ],
  pull_A: [
    ['barbell-row',  'db-row',      't-bar-row',     'seated-row'   ],  // back horizontal
    ['pull-up',      'lat-pulldown','chin-up'                       ],  // back vertical
    ['seated-row',   'lat-pulldown','db-row',        't-bar-row'    ],  // back variation
    ['face-pull',    'lat-raise'                                     ],  // rear delt
    ['barbell-curl', 'hammer-curl', 'preacher-curl'                 ],  // biceps compound
    ['conc-curl',    'preacher-curl','hammer-curl'                  ],  // biceps isolation
  ],
  pull_B: [
    ['lat-pulldown', 'chin-up',     'pull-up'                       ],  // vertical first
    ['seated-row',   't-bar-row',   'db-row',        'barbell-row'  ],  // horizontal
    ['db-row',       'barbell-row', 'seated-row'                    ],  // back variation
    ['face-pull',    'lat-raise'                                     ],  // rear delt
    ['hammer-curl',  'conc-curl',   'preacher-curl'                 ],  // biceps variation
    ['barbell-curl', 'preacher-curl','conc-curl'                    ],  // biceps compound
  ],
  legs_A: [
    ['squat',        'leg-press',   'hack-squat',    'lunges'       ],  // quad compound
    ['rdl',          'deadlift',    'lunges'                        ],  // hip hinge
    ['leg-press',    'hack-squat',  'leg-ext',       'lunges'       ],  // quad machine
    ['leg-curl'                                                      ],  // hamstring
    ['calf-raise'                                                    ],  // calf
    ['plank',        'hanging-lr',  'cable-crunch',  'crunch'       ],  // core
  ],
  legs_B: [
    ['rdl',          'deadlift',    'bulgarian',     'lunges'       ],  // hinge first
    ['hack-squat',   'leg-press',   'bulgarian',     'squat'        ],  // quad variation
    ['leg-ext',      'leg-press'                                     ],  // quad isolation
    ['leg-curl'                                                      ],  // hamstring
    ['calf-raise'                                                    ],  // calf
    ['ab-wheel',     'crunch',      'russian-twist', 'hanging-lr'   ],  // core variation
  ],
}

const DAY_NAMES = {
  full_A: 'Full Body A', full_B: 'Full Body B', full_C: 'Full Body C',
  upper_A: 'Upper A',    lower_A: 'Lower A',
  upper_B: 'Upper B',    lower_B: 'Lower B',
  push_A: 'Push A',      pull_A: 'Pull A',   legs_A: 'Legs A',
  push_B: 'Push B',      pull_B: 'Pull B',   legs_B: 'Legs B',
}

const SPLIT_DAYS = {
  2: ['full_A', 'full_B'],
  3: ['full_A', 'full_B', 'full_C'],
  4: ['upper_A', 'lower_A', 'upper_B', 'lower_B'],
  5: ['upper_A', 'lower_A', 'full_A',  'upper_B', 'lower_B'],
  6: ['push_A',  'pull_A',  'legs_A',  'push_B',  'pull_B', 'legs_B'],
}

const GOAL_PARAMS = {
  strength: { sets: 5, reps: 5,  rest: 180, secs: 60 },
  muscle:   { sets: 4, reps: 10, rest: 90,  secs: 45 },
  fitness:  { sets: 3, reps: 15, rest: 60,  secs: 30 },
}

const CAPACITY = {
  30: 4,
  45: 5,
  60: 6,
  90: 7,
}

function canUse(exercise, equipment) {
  if (!exercise) return false
  // Bodyweight-only mode: strict filter
  if (equipment.length === 1 && equipment[0] === 'bodyweight') {
    return exercise.eq === 'bodyweight'
  }
  // Has gym access: bodyweight always available
  return equipment.includes(exercise.eq) || exercise.eq === 'bodyweight'
}

function fillSlot(candidates, allEx, equipment, preferred, used) {
  // Sort so preferred (from history) exercises bubble up
  const sorted = [...candidates].sort((a, b) => {
    const ap = preferred.has(a) ? -1 : 0
    const bp = preferred.has(b) ? -1 : 0
    return ap - bp
  })
  const eligible = sorted
    .map(id => allEx.find(e => e.id === id))
    .filter(ex => ex && canUse(ex, equipment) && !used.has(ex.id))
  if (!eligible.length) return null
  // Random pick among the top two so "Regenerate" actually varies the program
  // while still favouring the slot's primary (compound) candidates
  const pick = eligible[Math.floor(Math.random() * Math.min(2, eligible.length))]
  used.add(pick.id)
  return pick
}

function getHistoryPreferences(history) {
  if (!history || history.length === 0) return { preferred: new Set(), sessionCount: 0 }

  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
  const recent = history.filter(s => new Date(s.date) >= eightWeeksAgo)

  const preferred = new Set(
    recent.flatMap(s => s.exercises.map(e => e.exerciseId))
  )
  return { preferred, sessionCount: recent.length }
}

function getNeglectedMuscles(history) {
  if (!history || history.length === 0) return []
  const threeWeeksAgo = new Date()
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21)
  const recentMuscles = new Set(
    history
      .filter(s => new Date(s.date) >= threeWeeksAgo)
      .flatMap(s => s.exercises.map(e => e.mg || e.muscleGroup))
  )
  return ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']
    .filter(m => !recentMuscles.has(m))
}

const FOCUS_MGS = {
  upper: ['chest', 'back', 'shoulders', 'arms'],
  lower: ['legs'],
  core:  ['core'],
}

// Muscle group a slot trains, derived from its first known candidate
function slotMg(candidates, allEx) {
  for (const id of candidates) {
    const ex = allEx.find(e => e.id === id)
    if (ex) return ex.mg
  }
  return null
}

export function generateProgram(prefs, allEx, history = []) {
  const { daysPerWeek, goal, equipment, sessionMinutes, focus } = prefs
  const params = GOAL_PARAMS[goal] || GOAL_PARAMS.muscle
  const capacity = CAPACITY[sessionMinutes] || 6
  const dayKeys = SPLIT_DAYS[daysPerWeek] || SPLIT_DAYS[3]

  const { preferred, sessionCount } = getHistoryPreferences(history)
  const neglected = getNeglectedMuscles(history)
  const focusMgs = FOCUS_MGS[focus] || []

  const days = dayKeys.map(key => {
    const slots = DAY_SLOTS[key] || []

    // Pick which slots survive the capacity cut by priority (focused area
    // first, then neglected muscle groups), but keep the day's original
    // exercise ordering (compounds before isolation)
    const prioritised = slots
      .map((candidates, i) => {
        const mg = slotMg(candidates, allEx)
        const prio = (focusMgs.includes(mg) ? -2 : 0) + (neglected.includes(mg) ? -1 : 0)
        return { candidates, i, prio }
      })
      .sort((a, b) => a.prio - b.prio || a.i - b.i)
      .slice(0, capacity)
      .sort((a, b) => a.i - b.i)

    const used = new Set()
    const exercises = prioritised
      .map(({ candidates }) => fillSlot(candidates, allEx, equipment, preferred, used))
      .filter(Boolean)
      .map(ex => {
        const isTime = ex.inputMode === 'time'
        return {
          exerciseId: ex.id,
          sets: params.sets,
          ...(isTime ? { secs: params.secs } : { reps: params.reps }),
          restTime: params.rest,
        }
      })

    return { name: DAY_NAMES[key] || key, exercises }
  })

  return {
    id: `generated-${Date.now()}`,
    name: buildProgramName(daysPerWeek, goal),
    description: buildDescription(daysPerWeek, goal, sessionCount),
    tags: ['generated'],
    days,
    _meta: { sessionCount, neglected },
  }
}

function buildProgramName(days, goal) {
  const splits = { 2: '2-Day', 3: '3-Day', 4: '4-Day', 5: '5-Day', 6: '6-Day' }
  const goals = { strength: 'Strength', muscle: 'Muscle Builder', fitness: 'Fitness' }
  const type = days <= 3 ? 'Full Body' : days === 4 ? 'Upper/Lower' : days === 5 ? 'Split' : 'PPL'
  return `${splits[days] || ''} ${type} — ${goals[goal] || ''}`
}

function buildDescription(days, goal, sessionCount) {
  const type = days <= 3 ? 'Full body' : days === 4 ? 'Upper/Lower split' : days === 5 ? '5-day split' : 'Push/Pull/Legs'
  const base = `${type}, ${days} days/week. Auto-generated.`
  return sessionCount > 0 ? `${base} Personalised from ${sessionCount} recent sessions.` : base
}
