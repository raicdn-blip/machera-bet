import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SPORTS, AVATARS, getSport, fmtDate, fmtMoney, calcPoints, MONTHS_ES } from '../constants'

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
function AdminUsers({ notify }) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving]   = useState(false)
  const [showPws, setShowPws] = useState({})

  const load = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const createUser = async () => {
    if (!name.trim() || !username.trim() || !password.trim()) {
      notify('Completa todos los campos', 'er'); return
    }
    const active = users.filter(u => !u.is_admin && u.is_active)
    if (active.length >= 100) { notify('Máximo 100 jugadores', 'er'); return }
    setSaving(true)
    const uname = username.trim().toLowerCase().replace(/\s+/g, '_')
    const { error } = await supabase.from('users').insert({
      display_name: name.trim(),
      username: uname,
      password: password.trim(),
      avatar: AVATARS[users.length % AVATARS.length],
      is_admin: false,
      is_active: true,
    })
    if (error) {
      notify(error.message.includes('unique') ? 'Usuario ya existe' : 'Error al crear usuario', 'er')
    } else {
      notify(`✅ ${name} creado · user: ${uname}`)
      setName(''); setUsername(''); setPassword('')
      load()
    }
    setSaving(false)
  }

  const toggleActive = async (u) => {
    await supabase.from('users').update({ is_active: !u.is_active }).eq('id', u.id)
    load()
    notify(u.is_active ? 'Usuario desactivado' : 'Usuario activado')
  }

  const resetPw = async (u, newPw) => {
    if (!newPw.trim()) return
    await supabase.from('users').update({ password: newPw.trim() }).eq('id', u.id)
    load()
    notify('Contraseña actualizada')
  }

  const activeCount = users.filter(u => !u.is_admin && u.is_active).length

  return (
    <div className="adm-sec">
      <div className="adm-tit">
        Jugadores
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, color: '#444' }}>
          {activeCount}/100
        </span>
      </div>

      {/* Create form */}
      <div className="fstack" style={{ marginBottom: 16 }}>
        <div className="fg">
          <div>
            <label className="fl-lbl">Nombre visible</label>
            <input className="inp" placeholder="Juan Pérez" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="fl-lbl">Usuario (login)</label>
            <input className="inp" placeholder="juanp" value={username} onChange={e => setUsername(e.target.value)} autoCapitalize="none" />
          </div>
        </div>
        <div className="frow">
          <div className="fl1">
            <label className="fl-lbl">Contraseña</label>
            <input className="inp" placeholder="clave123" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button className="btn bt-gd" onClick={createUser} disabled={saving} style={{ whiteSpace: 'nowrap' }}>
              + Crear
            </button>
          </div>
        </div>
      </div>

      {/* Users list */}
      {loading ? <div className="empty">Cargando...</div> : users.filter(u => !u.is_admin).map(u => (
        <UserRow
          key={u.id}
          u={u}
          showPw={showPws[u.id]}
          onTogglePw={() => setShowPws(p => ({ ...p, [u.id]: !p[u.id] }))}
          onToggleActive={() => toggleActive(u)}
          onResetPw={(pw) => resetPw(u, pw)}
          notify={notify}
        />
      ))}
    </div>
  )
}

function UserRow({ u, showPw, onTogglePw, onToggleActive, onResetPw, notify }) {
  const [editPw, setEditPw] = useState('')
  const [editing, setEditing] = useState(false)
  return (
    <div className="aec">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18, opacity: u.is_active ? 1 : .4 }}>{u.avatar}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            color: u.is_active ? '#CCC' : '#383838',
          }}>
            {u.display_name}
          </div>
          <div style={{ fontSize: 11, color: '#333', fontFamily: "'Barlow Condensed', sans-serif" }}>
            @{u.username}
            {!u.is_active && <span style={{ color: '#EF4444', marginLeft: 6 }}>INACTIVO</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button className="btn bt-ol-sm" onClick={onTogglePw}>
            {showPw ? 'Ocultar' : '🔑 Clave'}
          </button>
          <button
            className={`btn ${u.is_active ? 'bt-rd-ol' : 'bt-grn-ol'}`}
            onClick={onToggleActive}
          >
            {u.is_active ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      {showPw && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #161616' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span className="pw-badge">{u.password}</span>
            <button
              className="btn bt-ol-sm"
              onClick={() => { navigator.clipboard.writeText(u.password); notify('Clave copiada') }}
            >
              Copiar
            </button>
          </div>
          {editing ? (
            <div className="frow" style={{ gap: 6 }}>
              <input
                className="inp fl1"
                placeholder="Nueva contraseña"
                value={editPw}
                onChange={e => setEditPw(e.target.value)}
                style={{ fontSize: 13 }}
              />
              <button className="btn bt-gd-sm" onClick={() => { onResetPw(editPw); setEditing(false); setEditPw('') }}>
                Guardar
              </button>
              <button className="btn bt-ol-sm" onClick={() => setEditing(false)}>✕</button>
            </div>
          ) : (
            <button className="btn bt-ol-sm" onClick={() => setEditing(true)}>✏️ Cambiar clave</button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── SINGLE EVENT ─────────────────────────────────────────────────────────────
function AdminEventSingle({ notify, onCreated }) {
  const [form, setForm] = useState({
    sport: 'liga_chilena', home: '', away: '', date: '', time: '', note: ''
  })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const now = new Date()

  const save = async () => {
    if (!form.home.trim() || !form.away.trim() || !form.date || !form.time) {
      notify('Completa los campos obligatorios', 'er'); return
    }
    setSaving(true)
    const startDt = new Date(`${form.date}T${form.time}:00`)
    const closeDt = new Date(startDt.getTime() - 5 * 60 * 1000)
    const evMonth = startDt.getMonth() + 1
    const evYear  = startDt.getFullYear()

    const { error } = await supabase.from('events').insert({
      sport:       form.sport,
      home:        form.home.trim(),
      away:        form.away.trim(),
      event_date:  form.date,
      event_time:  `${form.time}:00`,
      close_at:    closeDt.toISOString(),
      note:        form.note.trim(),
      event_month: evMonth,
      event_year:  evYear,
      status:      'upcoming',
    })
    if (error) notify('Error al crear evento', 'er')
    else {
      notify('✅ Evento creado')
      setForm({ sport: 'liga_chilena', home: '', away: '', date: '', time: '', note: '' })
      onCreated()
    }
    setSaving(false)
  }

  return (
    <div className="fstack">
      <div>
        <label className="fl-lbl">Liga / Deporte</label>
        <select className="sel" value={form.sport} onChange={e => set('sport', e.target.value)}>
          {SPORTS.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
        </select>
      </div>
      <div className="fg">
        <div>
          <label className="fl-lbl">
            {['formula1','ufc'].includes(form.sport) ? 'Participante 1' : 'Local'}
          </label>
          <input className="inp" placeholder="ej. Colo-Colo" value={form.home} onChange={e => set('home', e.target.value)} />
        </div>
        <div>
          <label className="fl-lbl">
            {['formula1','ufc'].includes(form.sport) ? 'Participante 2' : 'Visita'}
          </label>
          <input className="inp" placeholder="ej. La U" value={form.away} onChange={e => set('away', e.target.value)} />
        </div>
      </div>
      <div className="fg">
        <div>
          <label className="fl-lbl">Fecha *</label>
          <input className="inp" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <label className="fl-lbl">Hora *</label>
          <input className="inp" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="fl-lbl">Nota (ej. Fecha 10, Anfield, GP Monaco…)</label>
        <input className="inp" placeholder="Opcional" value={form.note} onChange={e => set('note', e.target.value)} />
      </div>
      <div style={{ fontSize: 10, color: '#2A2A2A', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: .5 }}>
        ⏱ Las apuestas se cierran automáticamente 5 minutos antes de la hora ingresada
      </div>
      <button className="btn bt-gd bt-blk" onClick={save} disabled={saving}>
        {saving ? 'Creando...' : '+ Crear Evento'}
      </button>
    </div>
  )
}

// ─── BULK EVENT (TOURNAMENT) ──────────────────────────────────────────────────
function AdminEventBulk({ notify, onCreated }) {
  const [tname, setTname] = useState('')
  const [sport, setSport] = useState('liga_chilena')
  const [rows, setRows]   = useState([{ home: '', away: '', date: '', time: '' }])
  const [saving, setSaving] = useState(false)

  const addRow = () => setRows(p => [...p, { home: '', away: '', date: '', time: '' }])
  const removeRow = (i) => setRows(p => p.filter((_, j) => j !== i))
  const setRow = (i, k, v) => setRows(p => p.map((r, j) => j === i ? { ...r, [k]: v } : r))

  const save = async () => {
    if (!tname.trim()) { notify('Ingresa el nombre del torneo', 'er'); return }
    const valid = rows.filter(r => r.home.trim() && r.away.trim() && r.date && r.time)
    if (!valid.length) { notify('Agrega al menos un partido completo', 'er'); return }
    setSaving(true)

    // Create tournament
    const { data: tour } = await supabase
      .from('tournaments')
      .insert({ name: tname.trim(), sport })
      .select()
      .single()

    const eventsToInsert = valid.map(r => {
      const startDt = new Date(`${r.date}T${r.time}:00`)
      const closeDt = new Date(startDt.getTime() - 5 * 60 * 1000)
      return {
        sport,
        home:          r.home.trim(),
        away:          r.away.trim(),
        event_date:    r.date,
        event_time:    `${r.time}:00`,
        close_at:      closeDt.toISOString(),
        note:          tname.trim(),
        event_month:   startDt.getMonth() + 1,
        event_year:    startDt.getFullYear(),
        status:        'upcoming',
        tournament_id: tour?.id || null,
      }
    })

    const { error } = await supabase.from('events').insert(eventsToInsert)
    if (error) notify('Error al crear partidos', 'er')
    else {
      notify(`✅ ${valid.length} eventos creados`)
      setTname(''); setRows([{ home: '', away: '', date: '', time: '' }])
      onCreated()
    }
    setSaving(false)
  }

  return (
    <div className="fstack">
      <div className="fg">
        <div>
          <label className="fl-lbl">Nombre Torneo / Fecha</label>
          <input className="inp" placeholder="ej. Fecha 12 Liga Chilena" value={tname} onChange={e => setTname(e.target.value)} />
        </div>
        <div>
          <label className="fl-lbl">Liga / Deporte</label>
          <select className="sel" value={sport} onChange={e => setSport(e.target.value)}>
            {SPORTS.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ fontSize: 10, color: '#2E2E2E', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: .5 }}>
        Agrega todos los partidos del torneo:
      </div>

      {rows.map((r, i) => (
        <div key={i} className="bulk-row">
          <div>
            {i === 0 && <label className="fl-lbl">Local / P1</label>}
            <input className="inp" placeholder="Local" value={r.home} onChange={e => setRow(i, 'home', e.target.value)} style={{ fontSize: 13 }} />
          </div>
          <div>
            {i === 0 && <label className="fl-lbl">Visita / P2</label>}
            <input className="inp" placeholder="Visita" value={r.away} onChange={e => setRow(i, 'away', e.target.value)} style={{ fontSize: 13 }} />
          </div>
          <div>
            {i === 0 && <label className="fl-lbl">Fecha</label>}
            <input className="inp" type="date" value={r.date} onChange={e => setRow(i, 'date', e.target.value)} style={{ fontSize: 13 }} />
          </div>
          <div>
            {i === 0 && <label className="fl-lbl">Hora</label>}
            <input className="inp" type="time" value={r.time} onChange={e => setRow(i, 'time', e.target.value)} style={{ fontSize: 13 }} />
          </div>
          <div style={{ alignSelf: i === 0 ? 'flex-end' : 'center' }}>
            {rows.length > 1 && (
              <button className="btn bt-rd" onClick={() => removeRow(i)}>✕</button>
            )}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn bt-ol-sm fl1" onClick={addRow}>+ Partido</button>
        <button className="btn bt-gd" onClick={save} disabled={saving} style={{ flex: 2 }}>
          {saving ? 'Creando...' : `🚀 Crear ${rows.filter(r => r.home && r.away && r.date && r.time).length} eventos`}
        </button>
      </div>
    </div>
  )
}

// ─── EVENT LIST + RESULTS ────────────────────────────────────────────────────
function AdminEventList({ notify }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [resEv, setResEv]   = useState(null)
  const [resHome, setResHome] = useState('')
  const [resAway, setResAway] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .order('event_time', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (ev, status) => {
    await supabase.from('events').update({ status }).eq('id', ev.id)
    load()
    notify(`Estado: ${status}`)
  }

  const deleteEvent = async (ev) => {
    if (!window.confirm(`¿Eliminar ${ev.home} vs ${ev.away}?`)) return
    await supabase.from('events').delete().eq('id', ev.id)
    load()
    notify('Evento eliminado')
  }

  const openResult = (ev) => {
    setResHome(ev.result_home ?? '')
    setResAway(ev.result_away ?? '')
    setResEv(ev)
  }

  const saveResult = async () => {
    if (resHome === '' || resAway === '') { notify('Ingresa el resultado', 'er'); return }
    setSaving(true)
    const rh = parseFloat(resHome), ra = parseFloat(resAway)
    // Save result and mark finished
    await supabase.from('events')
      .update({ result_home: rh, result_away: ra, status: 'finished' })
      .eq('id', resEv.id)

    // Calculate and update points for all bets on this event
    const { data: bets } = await supabase
      .from('bets')
      .select('id, home_pred, away_pred')
      .eq('event_id', resEv.id)

    for (const bet of (bets || [])) {
      const pts = calcPoints(bet.home_pred, bet.away_pred, rh, ra)
      await supabase.from('bets').update({ points: pts }).eq('id', bet.id)
    }

    setSaving(false)
    setResEv(null)
    load()
    notify(`✅ Resultado guardado · ${bets?.length || 0} apuestas calculadas`)
  }

  const Badge = ({ status }) => {
    if (status === 'live')     return <span className="bdg bdg-lv"><span className="dot" />EN VIVO</span>
    if (status === 'upcoming') return <span className="bdg bdg-op">ABIERTO</span>
    if (status === 'closed')   return <span className="bdg bdg-cl">CERRADO</span>
    return <span className="bdg bdg-dn">FINALIZADO</span>
  }

  if (loading) return <div className="empty">Cargando eventos...</div>

  return (
    <>
      {events.length === 0
        ? <div className="empty">No hay eventos creados</div>
        : events.map(ev => {
          const sp = getSport(ev.sport)
          return (
            <div key={ev.id} className="aec">
              <div className="aec-tp">
                <div>
                  <div style={{ fontSize: 10, color: '#333', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: .5, marginBottom: 2 }}>
                    {sp.emoji} {sp.name}{ev.note ? ` · ${ev.note}` : ''}
                  </div>
                  <div className="aec-mt">{ev.home} vs {ev.away}</div>
                  <div style={{ fontSize: 10, color: '#272727', marginTop: 1, fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {fmtDate(ev.event_date)}{ev.event_time ? ` ${ev.event_time.slice(0,5)}` : ''}
                  </div>
                </div>
                <Badge status={ev.status} />
              </div>

              {ev.result_home != null && (
                <div style={{
                  background: 'rgba(255,215,0,.04)',
                  border: '1px solid rgba(255,215,0,.1)',
                  borderRadius: 5,
                  padding: '4px 10px',
                  marginBottom: 7,
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 16,
                  color: '#FFD700',
                  textAlign: 'center',
                }}>
                  Resultado: {ev.result_home} – {ev.result_away}
                </div>
              )}

              <div className="aec-ac">
                {ev.status === 'upcoming' && (
                  <button className="btn bt-grn-ol" onClick={() => updateStatus(ev, 'live')}>▶ EN VIVO</button>
                )}
                {ev.status === 'live' && (
                  <button className="btn bt-ol-gd" onClick={() => updateStatus(ev, 'upcoming')}>⏸ PAUSAR</button>
                )}
                {(ev.status === 'upcoming' || ev.status === 'live') && (
                  <button className="btn bt-rd-ol" onClick={() => updateStatus(ev, 'closed')}>🔒 CERRAR</button>
                )}
                {ev.status !== 'upcoming' && (
                  <button className="btn bt-gd-sm" onClick={() => openResult(ev)}>
                    {ev.result_home != null ? '✏️ Editar Resultado' : '🏁 Ingresar Resultado'}
                  </button>
                )}
                <button className="btn bt-rd" onClick={() => deleteEvent(ev)}>🗑</button>
              </div>
            </div>
          )
        })}

      {/* Result modal */}
      {resEv && (
        <div className="mb-bg" onClick={e => e.target === e.currentTarget && setResEv(null)}>
          <div className="mb-sh">
            <div className="mb-hdl" />
            <div className="mb-tit">Ingresar Resultado</div>
            <div className="mb-sub">{resEv.home} vs {resEv.away}</div>
            <div className="sc-row">
              <div>
                <div className="sc-lbl">{resEv.home}</div>
                <input className="sc-inp" type="number" min="0" placeholder="–" value={resHome} onChange={e => setResHome(e.target.value)} />
              </div>
              <div className="sc-sep">–</div>
              <div>
                <div className="sc-lbl">{resEv.away}</div>
                <input className="sc-inp" type="number" min="0" placeholder="–" value={resAway} onChange={e => setResAway(e.target.value)} />
              </div>
            </div>
            <div className="info-box" style={{ fontSize: 10 }}>
              Se calculan automáticamente los puntos de todas las apuestas para este evento.
            </div>
            <button className="btn bt-gr bt-blk" onClick={saveResult} disabled={saving} style={{ marginBottom: 8 }}>
              {saving ? 'Calculando...' : 'Confirmar y Calcular Puntos 🏁'}
            </button>
            <button className="btn bt-ol bt-blk" onClick={() => setResEv(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── MONTHLY CLOSE ────────────────────────────────────────────────────────────
function AdminMonthly({ notify }) {
  const [leaders, setLeaders]     = useState([])
  const [playerCount, setPlayerCount] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [closing, setClosing]     = useState(false)
  const [period, setPeriod]       = useState(null)

  const now = new Date()
  const curMonth = now.getMonth() + 1
  const curYear  = now.getFullYear()

  useEffect(() => {
    let mounted = true
    const load = async () => {
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

      const { data: bets } = await supabase
        .from('bets')
        .select('user_id, points, events!inner(event_month, event_year)')
        .eq('events.event_month', curMonth)
        .eq('events.event_year', curYear)
        .not('points', 'is', null)

      const { data: per } = await supabase
        .from('monthly_periods')
        .select('*')
        .eq('period_month', curMonth)
        .eq('period_year', curYear)
        .maybeSingle()

      if (!mounted) return

      const ptsMap = {}
      ;(bets || []).forEach(b => { ptsMap[b.user_id] = (ptsMap[b.user_id] || 0) + (b.points || 0) })

      const ranked = (users || [])
        .map(u => ({ ...u, pts: ptsMap[u.id] || 0 }))
        .sort((a, b) => b.pts - a.pts)

      setLeaders(ranked)
      setPlayerCount(count || 0)
      setPeriod(per)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [curMonth, curYear])

  const pot = playerCount * 10000

  const closeMonth = async () => {
    if (!window.confirm(`¿Cerrar ${MONTHS_ES[curMonth - 1]} ${curYear} y distribuir premios?`)) return
    setClosing(true)
    const [w1, w2, w3] = leaders

    const { error } = await supabase.from('monthly_periods').upsert({
      period_month: curMonth,
      period_year:  curYear,
      player_count: playerCount,
      pot_amount:   pot,
      winner1_id:   w1?.id || null,
      winner2_id:   w2?.id || null,
      winner3_id:   w3?.id || null,
      winner1_pts:  w1?.pts || 0,
      winner2_pts:  w2?.pts || 0,
      winner3_pts:  w3?.pts || 0,
      prize1:       Math.round(pot * 0.5),
      prize2:       Math.round(pot * 0.3),
      prize3:       Math.round(pot * 0.2),
      is_closed:    true,
      closed_at:    new Date().toISOString(),
    }, { onConflict: 'period_month,period_year' })

    if (error) notify('Error al cerrar el mes', 'er')
    else notify(`🏆 ${MONTHS_ES[curMonth - 1]} cerrado`)
    setClosing(false)
    // Reload
    const { data: per } = await supabase
      .from('monthly_periods')
      .select('*')
      .eq('period_month', curMonth)
      .eq('period_year', curYear)
      .single()
    setPeriod(per)
  }

  if (loading) return <div className="empty">Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-n">{fmtMoney(pot)}</div>
          <div className="stat-l">Pozo {MONTHS_ES[curMonth - 1]}</div>
        </div>
        <div className="stat-card green" style={{ flex: 1 }}>
          <div className="stat-n">{playerCount}</div>
          <div className="stat-l">Jugadores activos</div>
        </div>
      </div>

      <div className="info-box">
        🥇 {fmtMoney(pot * .5)} &nbsp;·&nbsp; 🥈 {fmtMoney(pot * .3)} &nbsp;·&nbsp; 🥉 {fmtMoney(pot * .2)}
      </div>

      {period?.is_closed && (
        <div style={{
          background: 'rgba(34,197,94,.05)',
          border: '1px solid rgba(34,197,94,.2)',
          borderRadius: 8,
          padding: '10px 13px',
          marginBottom: 12,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 12,
          color: '#22C55E',
        }}>
          ✅ Mes cerrado · Ganadores registrados
        </div>
      )}

      {leaders.slice(0, 10).map((u, i) => (
        <div key={u.id} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          background: i < 3 ? 'rgba(255,215,0,.03)' : '#111',
          border: `1px solid ${i < 3 ? 'rgba(255,215,0,.14)' : '#1A1A1A'}`,
          borderRadius: 8,
          marginBottom: 5,
        }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18,
            minWidth: 24,
            color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#2A2A2A',
          }}>
            {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
          </div>
          <span style={{ fontSize: 16 }}>{u.avatar}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: 13, color: '#CCC' }}>
              {u.display_name}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#FFD700' }}>{u.pts}</div>
            {i < 3 && (
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, color: '#444' }}>
                {fmtMoney([pot*.5, pot*.3, pot*.2][i])}
              </div>
            )}
          </div>
        </div>
      ))}

      {!period?.is_closed && leaders.length > 0 && (
        <button
          className="btn bt-gr bt-blk"
          style={{ marginTop: 12 }}
          onClick={closeMonth}
          disabled={closing}
        >
          {closing ? 'Cerrando...' : `🏁 Cerrar ${MONTHS_ES[curMonth - 1]} y Declarar Ganadores`}
        </button>
      )}
    </div>
  )
}

// ─── MAIN ADMIN ───────────────────────────────────────────────────────────────
export default function AdminPage({ notify }) {
  const [section, setSection] = useState('events')
  const [evTab, setEvTab]     = useState('single')
  const [evKey, setEvKey]     = useState(0) // force re-render event list

  return (
    <div>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 14,
        letterSpacing: 3,
        color: '#2A2A2A',
        marginBottom: 14,
        textAlign: 'center',
      }}>
        PANEL ADMINISTRADOR
      </div>

      {/* Section nav */}
      <div className="tabs">
        {[['events','🎯 Eventos'],['users','👥 Jugadores'],['monthly','🏆 Premios']].map(([k, l]) => (
          <button key={k} className={`tab ${section === k ? 'on' : ''}`} onClick={() => setSection(k)}>{l}</button>
        ))}
      </div>

      {section === 'events' && (
        <>
          <div className="adm-sec">
            <div className="adm-tit">Crear Evento</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button className={`btn ${evTab === 'single' ? 'bt-ol-gd' : 'bt-ol-sm'}`} onClick={() => setEvTab('single')}>
                Individual
              </button>
              <button className={`btn ${evTab === 'bulk' ? 'bt-ol-gd' : 'bt-ol-sm'}`} onClick={() => setEvTab('bulk')}>
                Masivo / Torneo
              </button>
            </div>
            {evTab === 'single'
              ? <AdminEventSingle notify={notify} onCreated={() => setEvKey(k => k + 1)} />
              : <AdminEventBulk   notify={notify} onCreated={() => setEvKey(k => k + 1)} />}
          </div>

          <div className="adm-sec">
            <div className="adm-tit">Todos los Eventos</div>
            <AdminEventList key={evKey} notify={notify} />
          </div>
        </>
      )}

      {section === 'users'   && <AdminUsers   notify={notify} />}
      {section === 'monthly' && <AdminMonthly notify={notify} />}
    </div>
  )
}
