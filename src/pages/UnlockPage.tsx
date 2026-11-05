import { useState, type FormEvent } from 'react'
import { useAtlas } from '../context/AtlasContext'

export function UnlockPage() {
  const { needsSetup, setupPin, unlock } = useAtlas()
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (pin.length < 4) {
      setError('PIN must be at least 4 characters.')
      return
    }
    setBusy(true)
    try {
      if (needsSetup) {
        if (pin !== confirm) {
          setError('PINs do not match.')
          return
        }
        await setupPin(pin)
      } else {
        const ok = await unlock(pin)
        if (!ok) setError('Incorrect PIN.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="unlock-screen">
      <div className="unlock-card">
        <div className="unlock-mark" aria-hidden>
          △
        </div>
        <h1>Atlas</h1>
        <p className="unlock-lede">
          {needsSetup
            ? 'Set a local PIN to gate access on this device. Your data stays in this browser.'
            : 'Enter your PIN to continue.'}
        </p>
        <form onSubmit={onSubmit} className="stack-form">
          <label>
            PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
          </label>
          {needsSetup && (
            <label>
              Confirm PIN
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          )}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-btn" disabled={busy}>
            {needsSetup ? 'Create Atlas' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  )
}
