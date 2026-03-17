import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import LoginPage     from './pages/Login'
import HomePage      from './pages/Home'
import EventsPage    from './pages/Events'
import MyBetsPage    from './pages/MyBets'
import LeaderboardPage from './pages/Leaderboard'
import AdminPage     from './pages/Admin'

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mb_user') || 'null') } catch { return null }
  })
  const [page, setPage]   = useState('home')
  const [toast, setToast] = useState(null)
  const [booting, setBooting] = useState(true)

  // Verify stored session is still valid
  useEffect(() => {
    const verify = async () => {
      const stored = localStorage.getItem('mb_user')
      if (stored) {
        try {
          const u = JSON.parse(stored)
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', u.id)
            .eq('is_active', true)
            .single()
          if (data) { setUser(data); localStorage.setItem('mb_user', JSON.stringify(data)) }
          else      { setUser(null); localStorage.removeItem('mb_user') }
        } catch { setUser(null); localStorage.removeItem('mb_user') }
      }
      setBooting(false)
    }
    verify()
  }, [])

  // Auto-close events (runs every 60s)
  useEffect(() => {
    if (!user) return
    const autoClose = () =>
      supabase
        .from('events')
        .update({ status: 'closed' })
        .eq('status', 'upcoming')
        .lte('close_at', new Date().toISOString())
    autoClose()
    const id = setInterval(autoClose, 60000)
    return () => clearInterval(id)
  }, [user?.id])

  const notify = useCallback((msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const login = (u) => {
    localStorage.setItem('mb_user', JSON.stringify(u))
    setUser(u)
    setPage('home')
  }

  const logout = () => {
    localStorage.removeItem('mb_user')
    setUser(null)
    setPage('home')
  }

  if (booting) {
    return (
      <div className="loading">
        <div className="loading-logo">MACHERA BET</div>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 10,
          color: '#1A1A1A',
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          Cargando...
        </div>
      </div>
    )
  }

  return (
    <div className="mba">
      {toast && (
        <div className={`toast t-${toast.type}`}>{toast.msg}</div>
      )}

      {!user ? (
        <LoginPage onLogin={login} notify={notify} />
      ) : (
        <>
          <header className="hd">
            <div className="hd-logo">MACHERA BET</div>
            <div className="hd-user" onClick={logout} title="Cerrar sesión">
              <span style={{ fontSize: 15 }}>{user.avatar}</span>
              <span className="hd-name">{user.display_name}</span>
              <span style={{ fontSize: 10, color: '#2A2A2A', marginLeft: 2 }}>↩</span>
            </div>
          </header>

          <main className="content">
            {page === 'home'        && <HomePage        user={user} setPage={setPage} />}
            {page === 'events'      && <EventsPage      user={user} notify={notify} />}
            {page === 'mybets'      && <MyBetsPage      user={user} />}
            {page === 'leaderboard' && <LeaderboardPage user={user} />}
            {page === 'admin' && user.is_admin && <AdminPage notify={notify} />}
          </main>

          <nav className="nav">
            {[
              ['home',        '🏠', 'Inicio'],
              ['events',      '🎯', 'Eventos'],
              ['mybets',      '📋', 'Mis Apuestas'],
              ['leaderboard', '🏆', 'Tabla'],
              ...(user.is_admin ? [['admin', '⚙️', 'Admin']] : []),
            ].map(([v, ico, lbl]) => (
              <button
                key={v}
                className={`ni ${page === v ? 'on' : ''}`}
                onClick={() => setPage(v)}
              >
                <span className="ni-ico">{ico}</span>
                {lbl}
              </button>
            ))}
          </nav>
        </>
      )}
    </div>
  )
}
