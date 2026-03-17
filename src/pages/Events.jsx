import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getSport, fmtDate, calcPoints, isBettingOpen } from '../constants'

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

const Badge = ({ status }) => {
  if (status === 'live')     return <span className="bdg bdg-lv"><span className="dot" />EN VIVO</span>
  if (status === 'upcoming') return <span className="bdg bdg-op">ABIERTO</span>
  if (status === 'closed')   return <span className="bdg bdg-cl">CERRADO</span>
  return <span className="bdg bdg-dn">FINALIZADO</span>
}

function EventCard({ ev, myBet, onBet }) {
  const sp    = getSport(ev.sport)
  const open  = isBettingOpen(ev)
  const cd    = useCountdown(ev.close_at)
  const pts   = myBet && ev.result_home != null
    ? calcPoints(myBet.home_pred, myBet.away_pred, ev.result_home, ev.result_away)
    : null

  return (
    <div className={`ec ${ev.status === 'live' ? 'lv' : ''} ${ev.status === 'finished' ? 'fn' : ''} ${ev.status === 'closed' ? 'cl' : ''}`}>
      <div className="ec-hd">
        <div className="ec-lg">
          <span style={{ fontSize: 12 }}>{sp.emoji}</span>
          {sp.name}
          {ev.note ? ` · ${ev.note}` : ''}
        </div>
        <Badge status={ev.status} />
      </div>

      <div className="ec-teams">
        <div className="ec-tm h">{ev.home}</div>
        {ev.result_home != null
          ? <div className="ec-res">{ev.result_home} – {ev.result_away}</div>
          : <div className="ec-vs">VS</div>}
        <div className="ec-tm a">{ev.away}</div>
      </div>

      {ev.event_date && (
        <div className="ec-dt">
          {fmtDate(ev.event_date)}
          {ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ''}
        </div>
      )}

      <div className="ec-br">
        <div>
          {myBet ? (
            <div className="ec-pr">
              Predicción: <b>{myBet.home_pred} – {myBet.away_pred}</b>
            </div>
          ) : open ? (
            <div className="ec-cd" style={{ color: sp.accent }}>⏱ {cd}</div>
          ) : (
            <div className="ec-pr" style={{ color: '#222' }}>Sin predicción</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pts !== null && (
            <span className={`pp ${pts === 3 ? 'gd' : pts === 1 ? 'gr' : 'gy'}`}>
              {pts === 3 ? '⭐' : pts === 1 ? '✓' : '✗'} {pts}pts
            </span>
          )}
          {(open || ev.status === 'live') && (
            <button className="btn bt-gd-sm" onClick={() => onBet(ev)}>
              {myBet ? 'Editar' : 'Apostar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BetModal({ ev, existingBet, onClose, onSave, notify }) {
  const sp = getSport(ev.sport)
  const [home, setHome] = useState(existingBet?.home_pred ?? '')
  const [away, setAway] = useState(existingBet?.away_pred ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (home === '' || away === '') { notify('Completa la predicción', 'er'); return }
    setSaving(true)
    await onSave(ev.id, home, away)
    setSaving(false)
  }

  return (
    <div className="mb-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="mb-sh">
        <div className="mb-hdl" />
        <div className="mb-tit">Tu Predicción</div>
        <div className="mb-sub">
          <span style={{ fontSize: 13 }}>{sp.emoji}</span> {ev.home} vs {ev.away}
        </div>

        <div style={{
          fontSize: 10,
          color: '#2A2A2A',
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 14,
        }}>
          {ev.sport === 'formula1' || ev.sport === 'ufc'
            ? 'Predice la posición / resultado final'
            : 'Predice el marcador al final del partido'}
        </div>

        <div className="sc-row">
          <div>
            <div className="sc-lbl">{ev.home}</div>
            <input
              className="sc-inp"
              type="number" min="0" placeholder="–"
              value={home}
              onChange={e => setHome(e.target.value)}
            />
          </div>
          <div className="sc-sep">–</div>
          <div>
            <div className="sc-lbl">{ev.away}</div>
            <input
              className="sc-inp"
              type="number" min="0" placeholder="–"
              value={away}
              onChange={e => setAway(e.target.value)}
            />
          </div>
        </div>

        <div className="info-box">
          ⭐ Resultado exacto = 3 pts &nbsp;·&nbsp; ✓ Ganador correcto = 1 pt &nbsp;·&nbsp; ✗ Error = 0 pts
        </div>

        <button className="btn bt-gd bt-blk" onClick={save} disabled={saving} style={{ marginBottom: 8 }}>
          {saving ? 'Guardando...' : existingBet ? 'Actualizar Predicción ✏️' : 'Confirmar Apuesta 🎯'}
        </button>
        <button className="btn bt-ol bt-blk" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}

export default function EventsPage({ user, notify }) {
  const [tab, setTab]       = useState('open')
  const [events, setEvents] = useState([])
  const [myBets, setMyBets] = useState({})
  const [loading, setLoading] = useState(true)
  const [betEv, setBetEv]   = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data: evs } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })

      const { data: bets } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)

      if (!mounted) return
      setEvents(evs || [])
      const bm = {}
      ;(bets || []).forEach(b => { bm[b.event_id] = b })
      setMyBets(bm)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [user.id])

  const filtered = events.filter(e => {
    if (tab === 'open')     return e.status === 'upcoming' || e.status === 'live'
    if (tab === 'closed')   return e.status === 'closed'
    return e.status === 'finished'
  })

  const handleSaveBet = async (eventId, home, away) => {
    const existing = myBets[eventId]
    if (existing) {
      const { data } = await supabase
        .from('bets')
        .update({ home_pred: parseFloat(home), away_pred: parseFloat(away) })
        .eq('id', existing.id)
        .select()
        .single()
      if (data) setMyBets(prev => ({ ...prev, [eventId]: data }))
    } else {
      const { data } = await supabase
        .from('bets')
        .insert({ user_id: user.id, event_id: eventId, home_pred: parseFloat(home), away_pred: parseFloat(away) })
        .select()
        .single()
      if (data) setMyBets(prev => ({ ...prev, [eventId]: data }))
    }
    setBetEv(null)
    notify('¡Predicción guardada! 🎯')
  }

  if (loading) return <div className="empty" style={{ paddingTop: 60 }}>Cargando eventos...</div>

  return (
    <div>
      <div className="tabs">
        {[['open','Abiertos'], ['closed','Cerrados'], ['finished','Resultados']].map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {filtered.length === 0
        ? <div className="empty">No hay eventos en esta sección</div>
        : filtered.map(ev => (
          <EventCard
            key={ev.id}
            ev={ev}
            myBet={myBets[ev.id]}
            onBet={setBetEv}
          />
        ))}

      {betEv && (
        <BetModal
          ev={betEv}
          existingBet={myBets[betEv.id]}
          onClose={() => setBetEv(null)}
          onSave={handleSaveBet}
          notify={notify}
        />
      )}
    </div>
  )
}
