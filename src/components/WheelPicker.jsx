import { useRef, useEffect, useLayoutEffect } from 'react'

export function WheelPicker({ label, value, min, max, step, unit, t, onClose, onConfirm }) {
  const ITEM_H = 44
  const items = []
  for (let v = min; v <= max; v = Math.round((v + step) * 1000) / 1000) items.push(v)

  const valueToIdx = v => Math.max(0, Math.min(items.length - 1, Math.round((v - min) / step)))

  const scrollRef = useRef(null)
  const selectedRef = useRef(items[valueToIdx(value)])
  const timerRef = useRef(null)

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = valueToIdx(value) * ITEM_H
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const idx = Math.round(scrollRef.current.scrollTop / ITEM_H)
    const clamped = Math.max(0, Math.min(items.length - 1, idx))
    selectedRef.current = items[clamped]
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = clamped * ITEM_H
    }, 150)
  }

  const handleDone = () => { onConfirm(selectedRef.current); onClose() }

  return (
    <div className="wheel-overlay" onClick={onClose}>
      <div className="wheel-sheet" onClick={e => e.stopPropagation()}>
        <div className="wheel-header">
          <span className="wheel-label">{label}{unit ? ` (${unit})` : ''}</span>
          <button className="wheel-done-btn" onClick={handleDone}>{t.done}</button>
        </div>
        <div className="wheel-wrap">
          <div className="wheel-scroll" ref={scrollRef} onScroll={handleScroll}>
            <div className="wheel-pad" />
            {items.map((v, i) => (
              <div key={i} className="wheel-item">{step < 1 ? v.toFixed(1) : v}</div>
            ))}
            <div className="wheel-pad" />
          </div>
          <div className="wheel-selector" />
          <div className="wheel-fade-top" />
          <div className="wheel-fade-bottom" />
        </div>
      </div>
    </div>
  )
}
