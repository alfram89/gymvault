import { useState } from 'react'
import { getTranslations } from '../i18n/index.js'

export function Onboarding({ onComplete }) {
  const [unit, setUnit] = useState('kg')
  const t = getTranslations('en')

  return (
    <div className="onboarding">
      <div className="onboarding-icon">💪</div>
      <h1>{t.welT}</h1>
      <p className="onboarding-sub">{t.welS}</p>
      <div className="onboarding-form">
        <label>{t.pkUnt}</label>
        <div className="toggle-row">
          {['kg', 'lbs'].map(u => (
            <button key={u} className={`toggle-btn ${unit === u ? 'active' : ''}`} onClick={() => setUnit(u)}>{u}</button>
          ))}
        </div>
        <button className="primary-btn start-btn" onClick={() => onComplete({ unit })}>{t.start} →</button>
      </div>
    </div>
  )
}
