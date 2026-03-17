import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ProfilePage({ user, onUserUpdate, notify }) {
  const [step, setStep]       = useState('idle') // idle | changing | done
  const [current, setCurrent] = useState('')
  const [newPw, setNewPw]     = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving]   = useState(false)

  const handleChange = async () => {
    if (!current.trim())       { notify('Ingresa tu clave actual', 'er'); return }
    if (newPw.length < 4)      { notify('La nueva clave debe tener al menos 4 caracteres', 'er'); return }
    if (newPw !== confirm)     { notify('Las claves no coinciden', 'er'); return }
    if (newPw === current)     { notify('La nueva clave debe ser distinta', 'er'); return }

    setSaving(true)

    // Verify current password
    const { data: check } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .eq('password', current.trim())
      .single()

    if (!check) {
      notify('Clave actual incorrecta', 'er')
      setSaving(false)
      return
    }

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ password: newPw.trim() })
      .eq('id', user.id)

    if (error) {
      notify('Error al cambiar la clave', 'er')
    } else {
      // Update local session
      const updated = { ...user, password: newPw.trim() }
      localStorage.setItem('mb_user', JSON.stringify(updated))
      onUserUpdate(updated)
      setStep('done')
      setCurrent(''); setNewPw(''); setConfirm('')
      notify('✅ Clave actualizada correctamente')
    }
    setSaving(false)
  }

  return (
    <div>
      {/* Avatar + name */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 0 24px',
        borderBottom: '1px solid #141414',
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>{user.avatar}</div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 28,
          letterSpacing: 2,
          color: '#E5E5E5',
        }}>
          {user.display_name}
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 13,
          color: '#333',
          marginTop: 4,
          letterSpacing: 1,
        }}>
          @{user.username}
        </div>
      </div>

      {/* Change password */}
      <div style={{
        background: '#111',
        border: '1px solid #1A1A1A',
        borderRadius: 12,
        padding: '16px 16px 20px',
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 18,
          letterSpacing: 1,
          color: '#FFD700',
          marginBottom: 16,
        }}>
          Cambiar Contraseña
        </div>

        {step === 'idle' && (
          <button
            className="btn bt-ol bt-blk"
            onClick={() => setStep('changing')}
          >
            🔑 Cambiar mi clave
          </button>
        )}

        {step === 'changing' && (
          <div className="fstack">
            <div>
              <label className="fl-lbl">Clave actual</label>
              <input
                className="inp"
                type="password"
                placeholder="Tu clave actual"
                value={current}
                onChange={e => setCurrent(e.target.value)}
              />
            </div>
            <div>
              <label className="fl-lbl">Nueva clave</label>
              <input
                className="inp"
                type="password"
                placeholder="Mínimo 4 caracteres"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
              />
            </div>
            <div>
              <label className="fl-lbl">Confirmar nueva clave</label>
              <input
                className="inp"
                type="password"
                placeholder="Repite la nueva clave"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChange()}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn bt-gd"
                style={{ flex: 2 }}
                onClick={handleChange}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Confirmar Cambio'}
              </button>
              <button
                className="btn bt-ol"
                style={{ flex: 1 }}
                onClick={() => { setStep('idle'); setCurrent(''); setNewPw(''); setConfirm('') }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{
            background: 'rgba(34,197,94,.06)',
            border: '1px solid rgba(34,197,94,.2)',
            borderRadius: 8,
            padding: '12px 14px',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 14,
            color: '#22C55E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>✅ Clave actualizada</span>
            <button
              className="btn bt-ol-sm"
              onClick={() => setStep('changing')}
            >
              Cambiar de nuevo
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="info-box" style={{ marginTop: 14 }}>
        🔒 Tu clave es personal, no la compartas con nadie.
        Si la olvidas, pídele al administrador que la resetee.
      </div>
    </div>
  )
}
