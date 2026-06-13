import { useState } from 'react'
import { Modal } from '../components/Modal'

export function ProgramsTab({ t, programs, activeProgramId, workoutActive,
  onSwitch, onRename, onDuplicate, onDelete, onBrowseTemplates, onOpenWizard }) {

  const [renameId, setRenameId] = useState(null)
  const [renameV, setRenameV] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const startRename = p => { setRenameId(p.id); setRenameV(p.name) }
  const commitRename = () => {
    if (renameV.trim()) onRename(renameId, renameV.trim())
    setRenameId(null)
  }

  return (
    <div className="tab-scroll">
      <div className="settings-section">
        <button className="data-btn program-builder-btn" onClick={onOpenWizard}>🪄 {t.buildProgram}</button>
        <button className="data-btn" onClick={onBrowseTemplates}>📋 {t.loadTemplate}</button>
      </div>

      <div className="settings-section">
        <p className="section-label">{t.myPrograms}</p>
        {programs.map(p => {
          const dayCount = p.days.length
          const exCount = Object.values(p.program).reduce((n, list) => n + list.length, 0)
          const active = p.id === activeProgramId
          return (
            <div key={p.id} className={`program-row ${active ? 'active' : ''}`}>
              <div className="program-info">
                <div className="program-name">
                  {p.name}
                  {active && <span className="active-badge">{t.activeBadge}</span>}
                </div>
                <div className="program-meta">
                  {dayCount} {dayCount === 1 ? t.day : t.days} · {exCount} {t.pgExLabel}
                </div>
              </div>
              <div className="program-actions">
                {!active && (
                  <button className="prog-activate-btn" disabled={workoutActive} onClick={() => onSwitch(p.id)}>
                    {t.activate}
                  </button>
                )}
                <button className="icon-btn" title={t.rename} onClick={() => startRename(p)}>✏️</button>
                <button className="icon-btn" title={t.duplicate} onClick={() => onDuplicate(p.id)}>⧉</button>
                <button className="icon-btn danger" title={t.deleteConfirm} onClick={() => setConfirmDelete(p)}>🗑</button>
              </div>
            </div>
          )
        })}
      </div>

      {renameId && (
        <Modal onClose={() => setRenameId(null)}>
          <h3 className="modal-title">{t.renameProgramTitle}</h3>
          <input value={renameV} onChange={e => setRenameV(e.target.value)} className="modal-input" autoFocus
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenameId(null) }} />
          <div className="modal-row">
            <button className="secondary-btn" onClick={() => setRenameId(null)}>{t.cancel}</button>
            <button className="primary-btn" onClick={commitRename}>{t.save}</button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <h3 className="modal-title">🗑 {t.deleteProgramTitle}</h3>
          <p className="modal-warn">{t.deleteProgramBody.replace('{name}', confirmDelete.name)}</p>
          <div className="modal-row">
            <button className="secondary-btn" onClick={() => setConfirmDelete(null)}>{t.cancel}</button>
            <button className="danger-btn modal-danger-btn" onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null) }}>
              {t.deleteConfirm}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
