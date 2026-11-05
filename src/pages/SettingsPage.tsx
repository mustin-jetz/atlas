import { useRef, useState, type FormEvent } from 'react'
import { useAtlas } from '../context/AtlasContext'
import { fyStartDate, formatDisplayDate } from '../lib/fiscal'

export function SettingsPage() {
  const {
    data,
    updateFy,
    changePin,
    downloadJson,
    downloadCsv,
    restoreJson,
  } = useAtlas()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fyLabel, setFyLabel] = useState(data?.settings.fyLabel ?? 'FY27')
  const [fyEnd, setFyEnd] = useState(data?.settings.fyEndDate ?? '2027-04-24')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [message, setMessage] = useState('')

  if (!data) return null

  function saveFy(e: FormEvent) {
    e.preventDefault()
    updateFy(fyLabel, fyEnd)
    setMessage('Fiscal year updated.')
  }

  async function savePin(e: FormEvent) {
    e.preventDefault()
    const ok = await changePin(currentPin, newPin)
    setMessage(ok ? 'PIN updated.' : 'Current PIN was incorrect.')
    if (ok) {
      setCurrentPin('')
      setNewPin('')
    }
  }

  function onImportFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        restoreJson(String(reader.result))
        setMessage('Backup restored.')
      } catch {
        setMessage('Could not import that file.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="page">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Local device</p>
          <h1>Settings</h1>
          <p className="lede">
            Data lives in this browser only. Export regularly — there is no cloud sync.
          </p>
        </div>
      </div>

      {message && <p className="toast">{message}</p>}

      <section className="settings-block">
        <h2>Fiscal year</h2>
        <p className="muted">
          Current window: {formatDisplayDate(fyStartDate(fyEnd))} → {formatDisplayDate(fyEnd)}
        </p>
        <form className="stack-form narrow" onSubmit={saveFy}>
          <label>
            Label
            <input value={fyLabel} onChange={(e) => setFyLabel(e.target.value)} required />
          </label>
          <label>
            End date
            <input
              type="date"
              value={fyEnd}
              onChange={(e) => setFyEnd(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="primary-btn">
            Save FY
          </button>
        </form>
      </section>

      <section className="settings-block">
        <h2>PIN</h2>
        <p className="muted">Gate only — data is not encrypted at rest in localStorage.</p>
        <form className="stack-form narrow" onSubmit={savePin}>
          <label>
            Current PIN
            <input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              required
            />
          </label>
          <label>
            New PIN
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              minLength={4}
              required
            />
          </label>
          <button type="submit" className="primary-btn">
            Change PIN
          </button>
        </form>
      </section>

      <section className="settings-block">
        <h2>Backup</h2>
        <div className="btn-row">
          <button type="button" className="primary-btn" onClick={downloadJson}>
            Export JSON
          </button>
          <button type="button" className="ghost-btn" onClick={downloadCsv}>
            Export CSV
          </button>
          <button type="button" className="ghost-btn" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImportFile(file)
              e.target.value = ''
            }}
          />
        </div>
      </section>
    </div>
  )
}
