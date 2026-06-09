export default function BarbellIcon({ size = 28, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bi-metal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#2563eb"/>
          <stop offset="50%"  stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
        <linearGradient id="bi-shade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.22"/>
          <stop offset="45%"  stopColor="white" stopOpacity="0"/>
          <stop offset="100%" stopColor="black" stopOpacity="0.30"/>
        </linearGradient>
        <linearGradient id="bi-rim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* left plate L3 */}
      <rect x="2"  y="15" width="11" height="70" rx="3"   fill="url(#bi-metal)"/>
      <rect x="2"  y="15" width="11" height="70" rx="3"   fill="url(#bi-shade)"/>
      <rect x="2"  y="15" width="3"  height="70" rx="1"   fill="url(#bi-rim)"/>

      {/* left plate L2 */}
      <rect x="13" y="23" width="9"  height="54" rx="2.5" fill="url(#bi-metal)"/>
      <rect x="13" y="23" width="9"  height="54" rx="2.5" fill="url(#bi-shade)"/>
      <rect x="13" y="23" width="3"  height="54" rx="1"   fill="url(#bi-rim)"/>

      {/* left plate L1 */}
      <rect x="22" y="31" width="7"  height="38" rx="2"   fill="url(#bi-metal)"/>
      <rect x="22" y="31" width="7"  height="38" rx="2"   fill="url(#bi-shade)"/>
      <rect x="22" y="31" width="2.5" height="38" rx="1"  fill="url(#bi-rim)"/>

      {/* left collar */}
      <rect x="29" y="39" width="6"  height="22" rx="2"   fill="url(#bi-metal)" opacity="0.75"/>
      <rect x="29" y="39" width="6"  height="22" rx="2"   fill="url(#bi-shade)"/>

      {/* bar */}
      <rect x="35" y="44" width="30" height="12" rx="4"   fill="url(#bi-metal)" opacity="0.65"/>
      <line x1="39" y1="44" x2="39" y2="56" stroke="black" strokeWidth="1.1" opacity="0.35"/>
      <line x1="42" y1="44" x2="42" y2="56" stroke="black" strokeWidth="1.1" opacity="0.35"/>
      <line x1="45" y1="44" x2="45" y2="56" stroke="black" strokeWidth="1.1" opacity="0.35"/>
      <line x1="48" y1="44" x2="48" y2="56" stroke="black" strokeWidth="1.1" opacity="0.35"/>
      <line x1="51" y1="44" x2="51" y2="56" stroke="black" strokeWidth="1.1" opacity="0.35"/>
      <line x1="54" y1="44" x2="54" y2="56" stroke="black" strokeWidth="1.1" opacity="0.35"/>
      <line x1="57" y1="44" x2="57" y2="56" stroke="black" strokeWidth="1.1" opacity="0.35"/>
      <line x1="60" y1="44" x2="60" y2="56" stroke="black" strokeWidth="1.1" opacity="0.35"/>
      <rect x="35" y="44" width="30" height="3"  rx="2"   fill="white" fillOpacity="0.13"/>

      {/* right collar */}
      <rect x="65" y="39" width="6"  height="22" rx="2"   fill="url(#bi-metal)" opacity="0.75"/>
      <rect x="65" y="39" width="6"  height="22" rx="2"   fill="url(#bi-shade)"/>

      {/* right plate R1 */}
      <rect x="71" y="31" width="7"  height="38" rx="2"   fill="url(#bi-metal)"/>
      <rect x="71" y="31" width="7"  height="38" rx="2"   fill="url(#bi-shade)"/>

      {/* right plate R2 */}
      <rect x="78" y="23" width="9"  height="54" rx="2.5" fill="url(#bi-metal)"/>
      <rect x="78" y="23" width="9"  height="54" rx="2.5" fill="url(#bi-shade)"/>

      {/* right plate R3 */}
      <rect x="87" y="15" width="11" height="70" rx="3"   fill="url(#bi-metal)"/>
      <rect x="87" y="15" width="11" height="70" rx="3"   fill="url(#bi-shade)"/>
    </svg>
  )
}
