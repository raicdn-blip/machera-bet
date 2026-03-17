import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage({ onLogin, notify }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim().toLowerCase())
        .eq('password', password.trim())
        .eq('is_active', true)
        .single()

      if (error || !data) {
        notify('Usuario o contraseña incorrectos', 'er')
      } else {
        onLogin(data)
      }
    } catch (_) {
      notify('Error de conexión', 'er')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 28px',
      background: '#070707',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 42 }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 68,
          letterSpacing: 4,
          color: '#FFD700',
          lineHeight: 1,
        }}>
          MACHERA BET
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: 5,
          color: '#2A2A2A',
          textTransform: 'uppercase',
          marginTop: 8,
        }}>
          La Polla Deportiva
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center', fontSize: 20 }}>
          {['🇨🇱','🏎️','⭐','🏀','🏈','🌍','🥊'].map(e => <span key={e}>{e}</span>)}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleLogin}
        style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div>
          <label className="fl-lbl">Usuario</label>
          <input
            className="inp"
            placeholder="tu_usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        <div>
          <label className="fl-lbl">Contraseña</label>
          <input
            className="inp"
            type="password"
            placeholder="••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button
          className="btn bt-gd bt-blk"
          type="submit"
          disabled={loading}
          style={{ marginTop: 6 }}
        >
          {loading ? 'Ingresando...' : 'Ingresar →'}
        </button>
      </form>

      <div style={{
        marginTop: 36,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 11,
        color: '#1E1E1E',
        letterSpacing: 1,
        textAlign: 'center',
        lineHeight: 1.7,
      }}>
        ¿No tienes acceso? Contacta al administrador.
      </div>
    </div>
  )
}
