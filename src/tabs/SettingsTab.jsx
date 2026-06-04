import { useState, useRef } from 'react'
import { availableLanguages } from '../i18n/index.js'
import { uid } from '../helpers'
import { Modal } from '../components/Modal'

function Tgl({ opts, val, fn }) {
  return (
    <div className="toggle-row">
      {opts.map(([v, lb]) => <button key={String(v)} className={`toggle-btn sm ${val === v ? 'active' : ''}`} onClick={() => fn(v)}>{lb}</button>)}
    </div>
  )
}

export function SettingsTab({ t, lang, setLang, unit, setUnit, darkMode, setDarkMode,
  days, setDays, program, setProgram, history, setHistory, customEx, setCustomEx,
  userTemplates, setUserTemplates, installPrompt, setInstallPrompt,
  onOpenTemplatePicker, onSaveTemplate }) {

  const isInstalled = window.matchMedia('(display-mode: standalone)').matches
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const [showIOSHint, setShowIOSHint] = useState(false)

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt()
      setInstallPrompt(null)
    } else if (isIOS) {
      setShowIOSHint(true)
    }
  }

  const [newDay, setNewDay] = useState('')
  const [editId, setEditId] = useState(null)
  const [editV, setEditV] = useState('')
  const [resetV, setResetV] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [showSaveTpl, setShowSaveTpl] = useState(false)
  const [saveTplName, setSaveTplName] = useState('')
  const fileRef = useRef(null)

  const addDay = () => {
    if (!newDay.trim()) return
    const d = { id: uid(), name: newDay.trim() }
    setDays(p => [...p, d]); setProgram(p => ({ ...p, [d.id]: [] })); setNewDay('')
  }
  const renameDay = id => {
    if (!editV.trim()) { setEditId(null); return }
    setDays(p => p.map(d => d.id === id ? { ...d, name: editV.trim() } : d)); setEditId(null)
  }
  const deleteDay = id => {
    if (days.length <= 1) return
    setDays(p => p.filter(d => d.id !== id))
    setProgram(p => { const n = { ...p }; delete n[id]; return n })
  }

  const exportJSON = () => {
    const data = { version: 1, days, program, history, customExercises: customEx, userTemplates, settings: { language: lang, unit, darkMode } }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gymtrack-${new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-')}.json`
    a.click(); URL.revokeObjectURL(a.href)
  }
  const importJSON = e => {
    const file = e.target.files?.[0]; if (!file) return
    if (!window.confirm(t.impW)) { e.target.value = ''; return }
    const r = new FileReader()
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result)
        if (d.days) setDays(d.days); if (d.program) setProgram(d.program)
        if (d.history) setHistory(d.history); if (d.customExercises) setCustomEx(d.customExercises)
        if (d.userTemplates) setUserTemplates(d.userTemplates)
        if (d.settings?.language) setLang(d.settings.language)
        if (d.settings?.unit) setUnit(d.settings.unit)
        if (d.settings?.darkMode !== undefined) setDarkMode(d.settings.darkMode)
      } catch { alert('Invalid file') }
    }
    r.readAsText(file); e.target.value = ''
  }
  const doReset = () => {
    if (resetV !== t.resetKw) return
    setDays([{ id: 'day-a', name: 'Day A' }, { id: 'day-b', name: 'Day B' }])
    setProgram({ 'day-a': [], 'day-b': [] }); setHistory([]); setCustomEx([]); setUserTemplates([])
    setResetV(''); setShowReset(false)
  }

  return (
    <div className="tab-scroll">
      <div className="settings-section">
        <p className="section-label">{t.thm} & {t.lng}</p>
        <div className="settings-row"><span>{t.thm}</span><Tgl opts={[['dark', '🌙 ' + t.dk], ['light', '☀️ ' + t.lt], ['auto', '⚙️ ' + t.auto]]} val={darkMode} fn={setDarkMode} /></div>
        <div className="settings-row"><span>{t.unt}</span><Tgl opts={[['kg', 'kg'], ['lbs', 'lbs']]} val={unit} fn={setUnit} /></div>
        {availableLanguages.length > 1 && (
          <div className="settings-row"><span>{t.lng}</span><Tgl opts={availableLanguages.map(l => [l, l.toUpperCase()])} val={lang} fn={setLang} /></div>
        )}
      </div>

      <div className="settings-section">
        <p className="section-label">{t.mgDays}</p>
        {days.map(d => (
          <div key={d.id} className="day-row">
            {editId === d.id ? (
              <>
                <input autoFocus value={editV} onChange={e => setEditV(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') renameDay(d.id); if (e.key === 'Escape') setEditId(null) }}
                  className="day-edit-input" />
                <button className="icon-btn ok" onClick={() => renameDay(d.id)}>✓</button>
                <button className="icon-btn" onClick={() => setEditId(null)}>✕</button>
              </>
            ) : (
              <>
                <span className="day-name-display">{d.name}</span>
                <button className="icon-btn" onClick={() => { setEditId(d.id); setEditV(d.name) }}>✏️</button>
                {days.length > 1 && <button className="icon-btn danger" onClick={() => deleteDay(d.id)}>🗑</button>}
              </>
            )}
          </div>
        ))}
        <div className="day-add-row">
          <input value={newDay} onChange={e => setNewDay(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDay()}
            placeholder={t.newDayPl} className="day-edit-input" />
          <button className="add-day-btn" onClick={addDay}>{t.addDay}</button>
        </div>
      </div>

      <div className="settings-section">
        <p className="section-label">{t.dataSection}</p>
        <button className="data-btn" onClick={onOpenTemplatePicker}>📋 {t.loadTemplate}</button>
        <button className="data-btn" onClick={() => setShowSaveTpl(true)}>💾 {t.saveAsTemplate}</button>
        <button className="data-btn" onClick={exportJSON}>⬇️ {t.expJ}</button>
        <button className="data-btn" onClick={() => fileRef.current?.click()}>⬆️ {t.impJ}</button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importJSON} />
      </div>

      {showSaveTpl && (
        <Modal onClose={() => { setShowSaveTpl(false); setSaveTplName('') }}>
          <h3 className="modal-title">{t.saveTemplateTitle}</h3>
          <input value={saveTplName} onChange={e => setSaveTplName(e.target.value)}
            placeholder={t.saveTemplatePl} className="modal-input" autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && saveTplName.trim()) { onSaveTemplate(saveTplName.trim()); setShowSaveTpl(false); setSaveTplName('') } }} />
          <div className="modal-row">
            <button className="secondary-btn" onClick={() => { setShowSaveTpl(false); setSaveTplName('') }}>{t.cancel}</button>
            <button className="primary-btn"
              onClick={() => { if (saveTplName.trim()) { onSaveTemplate(saveTplName.trim()); setShowSaveTpl(false); setSaveTplName('') } }}>
              {t.save}
            </button>
          </div>
        </Modal>
      )}

      <div className="settings-section danger-section">
        <p className="section-label danger-label">⚠️ {t.danger}</p>
        {!showReset ? (
          <button className="danger-btn" onClick={() => setShowReset(true)}>🗑 {t.resetAll}</button>
        ) : (
          <>
            <p className="reset-prompt">{t.resetPr}</p>
            <input value={resetV} onChange={e => setResetV(e.target.value)} placeholder={t.resetKw} className="day-edit-input" style={{ marginBottom: 10 }} />
            <div className="modal-row">
              <button className="secondary-btn" onClick={() => { setShowReset(false); setResetV('') }}>{t.cancel}</button>
              <button className={`danger-btn ${resetV !== t.resetKw ? 'disabled' : ''}`} disabled={resetV !== t.resetKw} onClick={doReset}>{t.resetAll}</button>
            </div>
          </>
        )}
      </div>

      {!isInstalled && (isIOS || installPrompt) && (
        <div className="settings-section">
          <button className="data-btn install-btn" onClick={handleInstall}>📲 {t.install}</button>
        </div>
      )}

      {showIOSHint && (
        <Modal onClose={() => setShowIOSHint(false)}>
          <h3 className="modal-title">📲 {t.installIosTitle}</h3>
          <div className="ios-install-steps">
            <p>1. {t.installIosStep1} <span className="ios-share-icon">□↑</span> {t.installIosStep2}</p>
            <p>2. {t.installIosStep3}</p>
          </div>
          <button className="primary-btn" style={{ marginTop: 16 }} onClick={() => setShowIOSHint(false)}>{t.close}</button>
        </Modal>
      )}

      <div className="settings-section">
        <p className="section-label">{t.abt}</p>
        <div className="about-content">
          <span>{t.ver}</span>
          <span>{t.lic}</span>
          <a href="https://github.com/alfram89/GymTrack" target="_blank" rel="noopener noreferrer" className="gh-link">🔗 {t.gh}</a>
        </div>
      </div>
    </div>
  )
}
