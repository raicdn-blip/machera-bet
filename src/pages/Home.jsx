import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getSport, fmtDate, fmtMoney, MONTHS_ES, calcPoints } from '../constants'

function useCountdown(target) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target) - new Date()
      if (diff <= 0) { setLabel('CERRADO'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 48) setLabel(`${Math.floor(h / 24)}d ${h % 24}h`)
      else if (h > 0) setLabel(`${h}h ${m}m`)
      else setLabel(`${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [target])
  return label
}

function CarouselSlide({ ev }) {
  const sport = getSport(ev.sport)
  const cd    = useCountdown(ev.close_at)
  return (
    <div
      className="carousel-slide"
      style={{ background: sport.bg }}
    >
      <span className="cs-deco">{sport.emoji}</span>
      <div className="cs-sport">{sport.emoji} {sport.name}{ev.note ? ` · ${ev.note}` : ''}</div>
      <div className="cs-teams">
        <div className="cs-tm" style={{ color: sport.accent, textAlign: 'left' }}>{ev.home}</div>
        <div className="cs-vs">VS</div>
        <div className="cs-tm" style={{ color: '#E5E5E5', textAlign: 'right' }}>{ev.away}</div>
      </div>
      <div className="cs-bot">
        <div className="cs-dt">{fmtDate(ev.event_date)}{ev.event_time ? ` · ${ev.event_time.slice(0,5)}` : ''}</div>
        <div className="cs-cd" style={{ color: sport.accent }}>
          {ev.status === 'live' ? '🔴 EN VIVO' : `⏱ ${cd}`}
        </div>
      </div>
    </div>
  )
}

function Carousel({ events }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)

  const go = (i) => {
    setIdx((i + events.length) % events.length)
  }

  useEffect(() => {
    if (events.length <= 1) return
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % events.length), 4500)
    return () => clearInterval(timerRef.current)
  }, [events.length])

  if (!events.length) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="carousel-wrap" onClick={() => go(idx + 1)}>
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {events.map(ev => <CarouselSlide key={ev.id} ev={ev} />)}
        </div>
      </div>
      {events.length > 1 && (
        <div className="carousel-dots">
          {events.map((_, i) => (
            <div
              key={i}
              className={`cdot ${i === idx ? 'on' : ''}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TopThree({ leaders }) {
  if (!leaders.length) return null
  const medals = ['🥇', '🥈', '🥉']
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 14, justifyContent: 'center' }}>
      {leaders.slice(0, 3).map((u, i) => (
        <div
          key={u.id}
          style={{
            flex: 1,
            background: i === 0 ? 'rgba(255,215,0,.06)' : '#111',
            border: `1px solid ${i === 0 ? 'rgba(255,215,0,.2)' : '#1A1A1A'}`,
            borderRadius: 10,
            padding: '10px 6px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 18, marginBottom: 3 }}>{medals[i]}</div>
          <div style={{ fontSize: 16 }}>{u.avatar}</div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            color: '#CCC',
            marginTop: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>{u.display_name}</div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 20,
            color: i === 0 ? '#FFD700' : '#888',
            marginTop: 2,
          }}>{u.monthPts}</div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 9,
            color: '#2E2E2E',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}>pts este mes</div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage({ user, setPage }) {
  const [loading, setLoading]       = useState(true)
  const [upcoming, setUpcoming]     = useState([])
  const [playerCount, setPlayerCount] = useState(0)
  const [leaders, setLeaders]       = useState([])
  const [myMonthPts, setMyMonthPts] = useState(0)
  const [myRank, setMyRank]         = useState(null)

  const now = new Date()
  const curMonth = now.getMonth() + 1
  const curYear  = now.getFullYear()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      // Upcoming + live events for carousel
      const { data: evs } = await supabase
        .from('events')
        .select('*')
        .in('status', ['upcoming', 'live'])
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(10)

      // Active users count
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('is_active', true)
        .eq('is_admin', false)

      // Monthly leaderboard: bets joined with events filtered by current month
      const { data: monthBets } = await supabase
        .from('bets')
        .select('user_id, points, events!inner(event_month, event_year)')
        .eq('events.event_month', curMonth)
        .eq('events.event_year', curYear)
        .not('points', 'is', null)

      // Users
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, avatar')
        .eq('is_active', true)
        .eq('is_admin', false)

      if (!mounted) return

      // Build monthly rankings
      const ptsMap = {}
      ;(monthBets || []).forEach(b => {
        ptsMap[b.user_id] = (ptsMap[b.user_id] || 0) + (b.points || 0)
      })

      const ranked = (users || [])
        .map(u => ({ ...u, monthPts: ptsMap[u.id] || 0 }))
        .sort((a, b) => b.monthPts - a.monthPts)

      const myIdx = ranked.findIndex(u => u.id === user.id)

      setUpcoming(evs || [])
      setPlayerCount(count || 0)
      setLeaders(ranked)
      setMyMonthPts(ptsMap[user.id] || 0)
      setMyRank(myIdx >= 0 ? myIdx + 1 : null)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [user.id, curMonth, curYear])

  const pot = playerCount * 10000

  if (loading) return (
    <div className="empty" style={{ paddingTop: 60 }}>Cargando...</div>
  )

  return (
    <div>
      {/* Carousel */}
      {upcoming.length > 0
        ? <Carousel events={upcoming} />
        : (
          <div style={{
            background: 'linear-gradient(135deg,#141000 0%,#332a00 100%)',
            borderRadius: 14,
            padding: '28px 18px',
            textAlign: 'center',
            marginBottom: 16,
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#FFD700', letterSpacing: 2 }}>
              MACHERA BET
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, color: 'rgba(255,215,0,.4)', letterSpacing: 2, marginTop: 4 }}>
              PRÓXIMOS EVENTOS PRONTO
            </div>
          </div>
        )}

      {/* Prize pot */}
      <div className="prize-card">
        <div>
          <div className="prize-l">Pozo del Mes · {MONTHS_ES[curMonth - 1]}</div>
          <div className="prize-n">{fmtMoney(pot)}</div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 10,
            color: '#333',
            marginTop: 2,
          }}>{playerCount} jugadores × $10.000</div>
        </div>
        <div className="prize-dist">
          <div className="prize-row">🥇 1º <span>{fmtMoney(pot * 0.5)}</span></div>
          <div className="prize-row">🥈 2º <span>{fmtMoney(pot * 0.3)}</span></div>
          <div className="prize-row">🥉 3º <span>{fmtMoney(pot * 0.2)}</span></div>
        </div>
      </div>

      {/* My stats */}
      <div className="stat-row">
        <div className="stat-card green">
          <div className="stat-n">{myMonthPts}</div>
          <div className="stat-l">Mis pts este mes</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-n" style={{ fontSize: 28 }}>
            {myRank ? `#${myRank}` : '—'}
          </div>
          <div className="stat-l">Mi posición</div>
        </div>
      </div>

      {/* Top 3 this month */}
      {leaders.length > 0 && (
        <>
          <div className="sec-title">🏆 Líderes del mes</div>
          <TopThree leaders={leaders} />
        </>
      )}

      {/* Upcoming events mini-list */}
      {upcoming.length > 0 && (
        <>
          <div className="sec-title" style={{ marginTop: 6 }}>⚡ Próximos eventos</div>
          {upcoming.slice(0, 4).map(ev => {
            const sp = getSport(ev.sport)
            return (
              <div
                key={ev.id}
                style={{
                  background: '#111',
                  border: '1px solid #1A1A1A',
                  borderRadius: 8,
                  padding: '9px 12px',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                }}
                onClick={() => setPage('events')}
              >
                <span style={{ fontSize: 16 }}>{sp.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#CCC',
                  }}>
                    {ev.home} vs {ev.away}
                  </div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 11,
                    color: '#383838',
                    marginTop: 1,
                  }}>
                    {fmtDate(ev.event_date)}{ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ''}
                  </div>
                </div>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 11,
                  color: sp.accent,
                  fontWeight: 700,
                }}>
                  Apostar →
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
