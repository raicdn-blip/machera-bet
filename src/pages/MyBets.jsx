import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getSport, calcPoints, MONTHS_ES } from '../constants'

export default function MyBetsPage({ user }) {
  const [bets, setBets]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const now = new Date()
  const curMonth = now.getMonth() + 1
  const curYear  = now.getFullYear()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data } = await supabase
        .from('bets')
        .select(`
          *,
          events (
            id, home, away, sport, note, event_date, event_time,
            result_home, result_away, status, event_month, event_year
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (mounted) {
        setBets(data || [])
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user.id])

  // Calculate points for bets that have results
  const betsWithPts = bets.map(b => {
    const ev = b.events
    if (!ev) return { ...b, pts: null }
    const pts = ev.result_home != null
      ? calcPoints(b.home_pred, b.away_pred, ev.result_home, ev.result_away)
      : null
    return { ...b, pts }
  })

  const allTimePts = betsWithPts.reduce((s, b) => s + (b.pts ?? 0), 0)
  const monthPts   = betsWithPts
    .filter(b => b.events?.event_month === curMonth && b.events?.event_year === curYear)
    .reduce((s, b) => s + (b.pts ?? 0), 0)

  const exact   = betsWithPts.filter(b => b.pts === 3).length
  const correct = betsWithPts.filter(b => b.pts >= 1).length
  const total   = betsWithPts.filter(b => b.pts !== null).length

  const filtered = filter === 'all'     ? betsWithPts
    : filter === 'month'   ? betsWithPts.filter(b => b.events?.event_month === curMonth && b.events?.event_year === curYear)
    : filter === 'pending' ? betsWithPts.filter(b => b.pts === null)
    : betsWithPts.filter(b => b.pts !== null)

  if (loading) return <div className="empty" style={{ paddingTop: 60 }}>Cargando apuestas...</div>

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-n">{allTimePts}</div>
          <div className="stat-l">Puntos Totales</div>
        </div>
        <div className="stat-card green">
          <div className="stat-n">{monthPts}</div>
          <div className="stat-l">{MONTHS_ES[curMonth - 1]}</div>
        </div>
      </div>

      {total > 0 && (
        <div className="info-box">
          ⭐ Exactas: {exact} &nbsp;·&nbsp; ✓ Correctas: {correct} &nbsp;·&nbsp; Total resueltas: {total}
          &nbsp;·&nbsp; Precisión: {total ? Math.round(correct / total * 100) : 0}%
        </div>
      )}

      {/* Filter */}
      <div className="tabs">
        {[['all','Todas'],['month','Este Mes'],['pending','Pendientes'],['resolved','Resueltas']].map(([k, l]) => (
          <button key={k} className={`tab ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      {filtered.length === 0
        ? <div className="empty">No hay apuestas aquí todavía</div>
        : filtered.map(b => {
          const ev = b.events
          if (!ev) return null
          const sp = getSport(ev.sport)
          return (
            <div key={b.id} className="bt-row">
              <div className="bt-top">
                <div>
                  <div style={{
                    fontSize: 10,
                    color: '#333',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    letterSpacing: .5,
                    marginBottom: 2,
                  }}>
                    {sp.emoji} {sp.name}{ev.note ? ` · ${ev.note}` : ''}
                  </div>
                  <div className="bt-mt">{ev.home} vs {ev.away}</div>
                  <div style={{ fontSize: 10, color: '#272727', fontFamily: "'Barlow Condensed', sans-serif", marginTop: 1 }}>
                    {MONTHS_ES[ev.event_month - 1]} {ev.event_year}
                  </div>
                </div>
                {b.pts !== null
                  ? <span className={`pp ${b.pts === 3 ? 'gd' : b.pts === 1 ? 'gr' : 'gy'}`} style={{ fontSize: 20 }}>
                      {b.pts === 3 ? '⭐' : b.pts === 1 ? '✓' : '✗'} {b.pts}
                    </span>
                  : <span style={{ fontSize: 10, color: '#252525', fontFamily: "'Barlow Condensed', sans-serif" }}>PENDIENTE</span>}
              </div>
              <div className="bt-bot">
                <div className="bt-pd">
                  Mi predicción: <b>{b.home_pred} – {b.away_pred}</b>
                </div>
                {ev.result_home != null && (
                  <div style={{ fontSize: 11, color: '#3A3A3A', fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Real: {ev.result_home}–{ev.result_away}
                  </div>
                )}
              </div>
            </div>
          )
        })}
    </div>
  )
}
