export const MUSCLE_COLORS = {
  chest:     '#ef4444',
  back:      '#3b82f6',
  legs:      '#22c55e',
  shoulders: '#eab308',
  arms:      '#f97316',
  core:      '#a855f7',
}

export const DIFF_COLORS = {
  beginner:     '#4ade80',
  intermediate: '#facc15',
  advanced:     '#f87171',
}

export const EXERCISES = [
  // Chest
  { id:'bench-press',   name:'Bench Press',             mg:'chest',     eq:'barbell',    dif:'intermediate' },
  { id:'incline-bench', name:'Incline Bench Press',     mg:'chest',     eq:'barbell',    dif:'intermediate' },
  { id:'decline-bench', name:'Decline Bench Press',     mg:'chest',     eq:'barbell',    dif:'intermediate' },
  { id:'db-fly',        name:'Dumbbell Fly',             mg:'chest',     eq:'dumbbell',   dif:'beginner' },
  { id:'db-press',      name:'Dumbbell Press',           mg:'chest',     eq:'dumbbell',   dif:'beginner' },
  { id:'push-up',       name:'Push-Up',                  mg:'chest',     eq:'bodyweight', dif:'beginner' },
  { id:'cable-fly',     name:'Cable Crossover',          mg:'chest',     eq:'cable',      dif:'intermediate' },
  { id:'chest-dip',     name:'Chest Dip',                mg:'chest',     eq:'bodyweight', dif:'intermediate' },
  // Back
  { id:'pull-up',       name:'Pull-Up',                  mg:'back',      eq:'bodyweight', dif:'intermediate' },
  { id:'barbell-row',   name:'Barbell Row',              mg:'back',      eq:'barbell',    dif:'intermediate' },
  { id:'lat-pulldown',  name:'Lat Pulldown',             mg:'back',      eq:'cable',      dif:'beginner' },
  { id:'seated-row',    name:'Seated Cable Row',         mg:'back',      eq:'cable',      dif:'beginner' },
  { id:'db-row',        name:'Dumbbell Row',             mg:'back',      eq:'dumbbell',   dif:'beginner' },
  { id:'deadlift',      name:'Deadlift',                 mg:'back',      eq:'barbell',    dif:'advanced' },
  { id:'t-bar-row',     name:'T-Bar Row',                mg:'back',      eq:'barbell',    dif:'intermediate' },
  { id:'chin-up',       name:'Chin-Up',                  mg:'back',      eq:'bodyweight', dif:'intermediate' },
  // Legs
  { id:'squat',         name:'Squat',                    mg:'legs',      eq:'barbell',    dif:'intermediate' },
  { id:'leg-press',     name:'Leg Press',                mg:'legs',      eq:'machine',    dif:'beginner' },
  { id:'lunges',        name:'Lunges',                   mg:'legs',      eq:'bodyweight', dif:'beginner' },
  { id:'rdl',           name:'Romanian Deadlift',        mg:'legs',      eq:'barbell',    dif:'intermediate' },
  { id:'leg-curl',      name:'Leg Curl',                 mg:'legs',      eq:'machine',    dif:'beginner' },
  { id:'leg-ext',       name:'Leg Extension',            mg:'legs',      eq:'machine',    dif:'beginner' },
  { id:'calf-raise',    name:'Calf Raise',               mg:'legs',      eq:'machine',    dif:'beginner' },
  { id:'hack-squat',    name:'Hack Squat',               mg:'legs',      eq:'machine',    dif:'intermediate' },
  { id:'bulgarian',     name:'Bulgarian Split Squat',    mg:'legs',      eq:'dumbbell',   dif:'advanced' },
  // Shoulders
  { id:'ohp',           name:'Overhead Press',           mg:'shoulders', eq:'barbell',    dif:'intermediate' },
  { id:'db-shpress',    name:'DB Shoulder Press',        mg:'shoulders', eq:'dumbbell',   dif:'beginner' },
  { id:'lat-raise',     name:'Lateral Raise',            mg:'shoulders', eq:'dumbbell',   dif:'beginner' },
  { id:'face-pull',     name:'Face Pull',                mg:'shoulders', eq:'cable',      dif:'beginner' },
  { id:'arnold-press',  name:'Arnold Press',             mg:'shoulders', eq:'dumbbell',   dif:'intermediate' },
  { id:'front-raise',   name:'Front Raise',              mg:'shoulders', eq:'dumbbell',   dif:'beginner' },
  { id:'upright-row',   name:'Upright Row',              mg:'shoulders', eq:'barbell',    dif:'intermediate' },
  // Arms
  { id:'barbell-curl',  name:'Barbell Curl',             mg:'arms',      eq:'barbell',    dif:'beginner' },
  { id:'hammer-curl',   name:'Hammer Curl',              mg:'arms',      eq:'dumbbell',   dif:'beginner' },
  { id:'tricep-push',   name:'Tricep Pushdown',          mg:'arms',      eq:'cable',      dif:'beginner' },
  { id:'skull-crusher', name:'Skull Crusher',            mg:'arms',      eq:'barbell',    dif:'intermediate' },
  { id:'tricep-dips',   name:'Tricep Dips',              mg:'arms',      eq:'bodyweight', dif:'intermediate' },
  { id:'preacher-curl', name:'Preacher Curl',            mg:'arms',      eq:'barbell',    dif:'beginner' },
  { id:'overhead-ext',  name:'Overhead Tricep Extension',mg:'arms',      eq:'dumbbell',   dif:'beginner' },
  { id:'conc-curl',     name:'Concentration Curl',       mg:'arms',      eq:'dumbbell',   dif:'beginner' },
  // Core
  { id:'plank',         name:'Plank',                    mg:'core',      eq:'bodyweight', dif:'beginner' },
  { id:'crunch',        name:'Crunch',                   mg:'core',      eq:'bodyweight', dif:'beginner' },
  { id:'russian-twist', name:'Russian Twist',            mg:'core',      eq:'bodyweight', dif:'beginner' },
  { id:'hanging-lr',    name:'Hanging Leg Raise',        mg:'core',      eq:'bodyweight', dif:'intermediate' },
  { id:'ab-wheel',      name:'Ab Wheel Rollout',         mg:'core',      eq:'bodyweight', dif:'advanced' },
  { id:'cable-crunch',  name:'Cable Crunch',             mg:'core',      eq:'cable',      dif:'beginner' },
  { id:'mtn-climber',   name:'Mountain Climber',         mg:'core',      eq:'bodyweight', dif:'beginner' },
]
