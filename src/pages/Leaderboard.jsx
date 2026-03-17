import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fmtMoney, MONTHS_ES } from '../constants'

export default function LeaderboardPage({ user }) {
  const [mode, setMode]       = useState('month')
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [playerCount, setPlayerCount] = useState(0)
  const [monthClosed, setMonthClosed] = useState(null)

  const now = new Date()
  const curMonth = now.getMonth() + 1
  const curYear  = now.getFullYear()
  const pot      = playerCount * 5000

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)

      // Users
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, avatar')
        .eq('is_active', true)
        .eq('is_admin', false)

      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
        .eq('is_admin', false)

      // Bets with event info
      let query = supabase
        .from('bets')
        .select('user_id, points, events!inner(event_month, event_year)')
        .not('points', 'is', null)

      if (mode === 'month') {
        query = query.eq('events.event_month', curMonth).eq('events.event_year', curYear)
      }

      const { data: bets } = await query

      // Monthly period (check if closed)
      const { data: period } = await supabase
        .from('monthly_periods')
        .select('*')
        .eq('period_month', curMonth)
        .eq('period_year', curYear)
        .single()

      if (!mounted) return

      const ptsMap = {}
      const exactMap = {}
      const correctMap = {}
      ;(bets || []).forEach(b => {
        ptsMap[b.user_id]    = (ptsMap[b.user_id] || 0) + (b.points || 0)
        if (b.points === 3) exactMap[b.user_id] = (exactMap[b.user_id] || 0) + 1
        if (b.points >= 1)  correctMap[b.user_id] = (correctMap[b.user_id] || 0) + 1
      })

      const ranked = (users || [])
        .map(u => ({
          ...u,
          pts: ptsMap[u.id] || 0,
          exact: exactMap[u.id] || 0,
          correct: correctMap[u.id] || 0,
        }))
        .sort((a, b) => b.pts - a.pts || b.exact - a.exact || b.correct - a.correct)

      setLeaders(ranked)
      setPlayerCount(count || 0)
      setMonthClosed(period?.is_closed ? period : null)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [mode, curMonth, curYear])

  if (loading) return <div className="empty" style={{ paddingTop: 60 }}>Cargando tabla...</div>

  return (
    <div>
      {/* Mode toggle */}
      <div className="tabs">
        <button className={`tab ${mode === 'month' ? 'on' : ''}`} onClick={() => setMode('month')}>
          {MONTHS_ES[curMonth - 1]}
        </button>
        <button className={`tab ${mode === 'all' ? 'on' : ''}`} onClick={() => setMode('all')}>
          Todo el tiempo
        </button>
      </div>

      {/* Prize info */}
      {mode === 'month' && (
        <div className="prize-card" style={{ marginBottom: 14 }}>
          <div>
            <div className="prize-l">Pozo del mes</div>
            <div className="prize-n">{fmtMoney(pot)}</div>
          </div>
          <div className="prize-dist">
            <div className="prize-row">🥇 <span>{fmtMoney(pot * .5)}</span></div>
            <div className="prize-row">🥈 <span>{fmtMoney(pot * .3)}</span></div>
            <div className="prize-row">🥉 <span>{fmtMoney(pot * .2)}</span></div>
          </div>
        </div>
      )}

      {/* Closed month winners */}
      {monthClosed && mode === 'month' && (
        <div className="month-winner">
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: 2,
            color: '#444',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            🏁 Mes cerrado · Ganadores oficiales
          </div>
          {[
            { id: monthClosed.winner1_id, pts: monthClosed.winner1_pts, prize: monthClosed.prize1, medal: '🥇' },
            { id: monthClosed.winner2_id, pts: monthClosed.winner2_pts, prize: monthClosed.prize2, medal: '🥈' },
            { id: monthClosed.winner3_id, pts: monthClosed.winner3_pts, prize: monthClosed.prize3, medal: '🥉' },
          ].filter(w => w.id).map(w => {
            const u = leaders.find(l => l.id === w.id) || {}
            return (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 18 }}>{w.medal}</span>
                <span style={{ fontSize: 16 }}>{u.avatar}</span>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 14, color: '#CCC', flex: 1 }}>
                  {u.display_name}
                </span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#FFD700' }}>
                  {fmtMoney(w.prize)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Rankings */}
      {leaders.length === 0
        ? <div className="empty">No hay apuestas resueltas este mes aún</div>
        : leaders.map((u, i) => {
          const rank = i + 1
          return (
            <div
              key={u.id}
              className={`lb-row ${rank === 1 ? 'r1' : rank === 2 ? 'r2' : rank === 3 ? 'r3' : ''}`}
            >
              <div className={`lb-rk ${rank === 1 ? 'k1' : rank === 2 ? 'k2' : rank === 3 ? 'k3' : 'kx'}`}>
                {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : rank}
              </div>
              <div className="lb-av">{u.avatar}</div>
              <div className="lb-inf">
                <div className="lb-nm">
                  {u.display_name}
                  {u.id === user.id && <span className="me-bx">YO</span>}
                </div>
                <div className="lb-st">
                  {u.exact} exactas · {u.correct} correctas
                </div>
              </div>
              <div>
                <div className="lb-pts">{u.pts}</div>
                <div className="lb-pl">pts</div>
              </div>
            </div>
          )
        })}
    </div>
  )
}
