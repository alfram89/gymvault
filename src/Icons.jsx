const Ic = ({ size, children }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
    style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }}>
    {children}
  </svg>
)

const s = { stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round' }

// ── MUSCLE GROUP ICONS ────────────────────────────────────────────

export const IconChest = ({ size = 16 }) => (
  <Ic size={size}>
    {/* bench press: lying figure pushing bar up */}
    <circle cx="27" cy="21" r="3" fill="currentColor"/>
    <line x1="5"  y1="21" x2="24" y2="21" {...s}/>
    <line x1="13" y1="21" x2="9"  y2="11" {...s}/>
    <line x1="13" y1="21" x2="19" y2="11" {...s}/>
    <rect x="1"  y="9"  width="30" height="2.5" rx="1" fill="currentColor"/>
    <rect x="0"  y="7"  width="3"  height="7"   rx="1" fill="currentColor"/>
    <rect x="29" y="7"  width="3"  height="7"   rx="1" fill="currentColor"/>
  </Ic>
)

export const IconBack = ({ size = 16 }) => (
  <Ic size={size}>
    {/* bent-over row: bent figure pulling bar to chest */}
    <circle cx="24" cy="5" r="3" fill="currentColor"/>
    <line x1="21" y1="8"  x2="11" y2="20" {...s}/>
    <line x1="14" y1="15" x2="9"  y2="24" {...s}/>
    <line x1="14" y1="15" x2="19" y2="24" {...s}/>
    <line x1="11" y1="20" x2="8"  y2="30" {...s}/>
    <line x1="11" y1="20" x2="16" y2="30" {...s}/>
    <rect x="2"  y="24" width="28" height="2.5" rx="1" fill="currentColor"/>
    <rect x="0"  y="22" width="3"  height="7"   rx="1" fill="currentColor"/>
    <rect x="29" y="22" width="3"  height="7"   rx="1" fill="currentColor"/>
  </Ic>
)

export const IconLegs = ({ size = 16 }) => (
  <Ic size={size}>
    {/* barbell squat */}
    <circle cx="15" cy="4" r="3" fill="currentColor"/>
    <rect x="2"  y="9"  width="28" height="2.5" rx="1.25" fill="currentColor"/>
    <rect x="0"  y="7"  width="3"  height="7"   rx="1"    fill="currentColor"/>
    <rect x="29" y="7"  width="3"  height="7"   rx="1"    fill="currentColor"/>
    <line x1="15" y1="11.5" x2="13" y2="21" {...s}/>
    <line x1="13" y1="21"   x2="7"  y2="26" {...s}/>
    <line x1="7"  y1="26"   x2="9"  y2="31" {...s}/>
    <line x1="13" y1="21"   x2="19" y2="26" {...s}/>
    <line x1="19" y1="26"   x2="17" y2="31" {...s}/>
  </Ic>
)

export const IconShoulders = ({ size = 16 }) => (
  <Ic size={size}>
    {/* overhead press: standing figure pressing bar overhead */}
    <rect x="1"  y="2"  width="30" height="2.5" rx="1" fill="currentColor"/>
    <rect x="0"  y="0"  width="3"  height="7"   rx="1" fill="currentColor"/>
    <rect x="29" y="0"  width="3"  height="7"   rx="1" fill="currentColor"/>
    <circle cx="16" cy="11" r="3" fill="currentColor"/>
    <line x1="16" y1="14" x2="6"  y2="5"  {...s}/>
    <line x1="16" y1="14" x2="26" y2="5"  {...s}/>
    <line x1="16" y1="14" x2="16" y2="23" {...s}/>
    <line x1="16" y1="23" x2="12" y2="31" {...s}/>
    <line x1="16" y1="23" x2="20" y2="31" {...s}/>
  </Ic>
)

export const IconArms = ({ size = 16 }) => (
  <Ic size={size}>
    {/* bicep curl: one arm curled with dumbbell */}
    <circle cx="16" cy="5" r="3" fill="currentColor"/>
    <line x1="16" y1="8"  x2="16" y2="21" {...s}/>
    <line x1="16" y1="12" x2="9"  y2="20" {...s}/>
    <line x1="16" y1="12" x2="23" y2="19" {...s}/>
    <line x1="23" y1="19" x2="20" y2="11" {...s}/>
    <rect x="17" y="9"  width="7"  height="2"   rx="1" fill="currentColor"/>
    <rect x="16" y="7"  width="2"  height="6"   rx="1" fill="currentColor"/>
    <rect x="22" y="7"  width="2"  height="6"   rx="1" fill="currentColor"/>
    <line x1="16" y1="21" x2="12" y2="29" {...s}/>
    <line x1="16" y1="21" x2="20" y2="29" {...s}/>
  </Ic>
)

export const IconCore = ({ size = 16 }) => (
  <Ic size={size}>
    {/* crunch: upper body raised, legs bent on floor */}
    <circle cx="27" cy="11" r="3" fill="currentColor"/>
    <line x1="14" y1="24" x2="25" y2="13" {...s}/>
    <line x1="2"  y1="27" x2="14" y2="27" {...s}/>
    <line x1="8"  y1="27" x2="10" y2="21" {...s}/>
    <line x1="14" y1="27" x2="12" y2="21" {...s}/>
    <line x1="10" y1="21" x2="12" y2="21" {...s}/>
    <line x1="22" y1="18" x2="16" y2="22" {...s}/>
  </Ic>
)

export const IconCardio = ({ size = 16 }) => (
  <Ic size={size}>
    {/* running figure */}
    <circle cx="22" cy="4" r="3" fill="currentColor"/>
    <line x1="20" y1="7"  x2="15" y2="18" {...s}/>
    <line x1="17" y1="11" x2="8"  y2="8"  {...s}/>
    <line x1="17" y1="11" x2="25" y2="16" {...s}/>
    <line x1="15" y1="18" x2="8"  y2="26" {...s}/>
    <line x1="15" y1="18" x2="21" y2="24" {...s}/>
    <line x1="8"  y1="26" x2="10" y2="31" {...s}/>
    <line x1="21" y1="24" x2="18" y2="30" {...s}/>
  </Ic>
)

// ── EQUIPMENT ICONS ───────────────────────────────────────────────

export const IconBarbell = ({ size = 16 }) => (
  <Ic size={size}>
    {/* wide bar with disc plates */}
    <rect x="0"  y="10" width="5"  height="12" rx="2" fill="currentColor"/>
    <rect x="27" y="10" width="5"  height="12" rx="2" fill="currentColor"/>
    <rect x="5"  y="14" width="22" height="4"  rx="2" fill="currentColor"/>
  </Ic>
)

export const IconDumbbell = ({ size = 16 }) => (
  <Ic size={size}>
    {/* short bar with large round plates */}
    <rect x="4"  y="9"  width="7" height="14" rx="3.5" fill="currentColor"/>
    <rect x="21" y="9"  width="7" height="14" rx="3.5" fill="currentColor"/>
    <rect x="11" y="12" width="2" height="8"  rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="19" y="12" width="2" height="8"  rx="0.5" fill="currentColor" opacity="0.5"/>
    <rect x="13" y="14" width="6" height="4"  rx="2"   fill="currentColor"/>
  </Ic>
)

export const IconCable = ({ size = 16 }) => (
  <Ic size={size}>
    {/* figure pulling cable from overhead pulley */}
    <circle cx="4" cy="3" r="2.5" stroke="currentColor" strokeWidth="2" fill="none"/>
    <line x1="6"  y1="4"  x2="14" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="24" cy="9"  r="3" fill="currentColor"/>
    <line x1="24" y1="12" x2="22" y2="22" {...s}/>
    <line x1="24" y1="15" x2="14" y2="19" {...s}/>
    <line x1="22" y1="22" x2="18" y2="30" {...s}/>
    <line x1="22" y1="22" x2="26" y2="30" {...s}/>
  </Ic>
)

export const IconMachine = ({ size = 16 }) => (
  <Ic size={size}>
    {/* seated figure at a machine */}
    <rect x="22" y="8"  width="3" height="16" rx="1" fill="currentColor" opacity="0.4"/>
    <rect x="14" y="21" width="12" height="3" rx="1" fill="currentColor" opacity="0.4"/>
    <circle cx="16" cy="11" r="3" fill="currentColor"/>
    <line x1="16" y1="14" x2="16" y2="21" {...s}/>
    <line x1="16" y1="17" x2="22" y2="11" {...s}/>
    <rect x="19" y="7"  width="8"  height="2.5" rx="1" fill="currentColor"/>
    <line x1="16" y1="21" x2="10" y2="29" {...s}/>
    <line x1="26" y1="21" x2="28" y2="29" {...s}/>
  </Ic>
)

export const IconBodyweight = ({ size = 16 }) => (
  <Ic size={size}>
    {/* push-up from side: diagonal body, arms to floor */}
    <circle cx="27" cy="8"  r="3" fill="currentColor"/>
    <line x1="24" y1="10" x2="4"  y2="23" {...s}/>
    <line x1="19" y1="13" x2="15" y2="20" {...s}/>
    <line x1="11" y1="20" x2="19" y2="20" {...s}/>
    <line x1="4"  y1="23" x2="2"  y2="27" {...s}/>
    <line x1="0"  y1="27" x2="26" y2="27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </Ic>
)

// ── DIFFICULTY BARS ───────────────────────────────────────────────

export const DiffBars = ({ dif }) => {
  const filled = { beginner: 1, intermediate: 2, advanced: 3 }[dif] ?? 1
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'flex-end', marginRight: 3 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          display: 'inline-block',
          width: 3,
          height: 5 + i * 3,
          borderRadius: 1,
          opacity: i < filled ? 1 : 0.2,
          background: 'currentColor',
        }}/>
      ))}
    </span>
  )
}

// ── LOOKUP MAPS ───────────────────────────────────────────────────

export const MG_ICONS = {
  chest: IconChest, back: IconBack, legs: IconLegs,
  shoulders: IconShoulders, arms: IconArms, core: IconCore, cardio: IconCardio,
}

export const EQ_ICONS = {
  barbell: IconBarbell, dumbbell: IconDumbbell, cable: IconCable,
  machine: IconMachine, bodyweight: IconBodyweight,
}
