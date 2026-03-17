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
      if (error || !data) notify('Usuario o contraseña incorrectos', 'er')
      else onLogin(data)
    } catch (_) {
      notify('Error de conexión', 'er')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom,#1B4D3A 0%,#1C1C1C 220px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 28px 48px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 64,
          letterSpacing: 4,
          color: '#FFE418',
          lineHeight: 1,
        }}>
          MACHERA BET
        </div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: 5,
          color: 'rgba(255,255,255,.3)',
          textTransform: 'uppercase',
          marginTop: 8,
        }}>
          La Polla Deportiva
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'center', fontSize: 18 }}>
          {['🇨🇱','🏎️','⭐','🏀','🏈','🌍','🥊'].map(e => <span key={e}>{e}</span>)}
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleLogin}
        style={{
          width: '100%',
          maxWidth: 320,
          background: '#252525',
          border: '1px solid #333',
          borderRadius: 4,
          padding: '20px 18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 13,
          letterSpacing: 2,
          color: 'rgba(255,255,255,.3)',
          marginBottom: 4,
          textAlign: 'center',
        }}>
          INGRESAR
        </div>
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
          style={{ marginTop: 4 }}
        >
          {loading ? 'Ingresando...' : 'Ingresar →'}
        </button>
      </form>

      <div style={{
        marginTop: 20,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 11,
        color: 'rgba(255,255,255,.15)',
        letterSpacing: 1,
        textAlign: 'center',
      }}>
        ¿Sin acceso? Contacta al administrador.
      </div>
    </div>
  )
}
