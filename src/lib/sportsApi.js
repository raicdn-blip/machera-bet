// ─── TheSportsDB API (free, no key required) ─────────────────────────────────
const BASE = 'https://www.thesportsdb.com/api/v1/json/3'

export const LEAGUE_IDS = {
  liga_chilena: '4627',   // Chile Primera Division
  premier:      '4328',   // Premier League
  champions:    '4480',   // UEFA Champions League
  nba:          '4387',   // NBA
  nfl:          '4391',   // NFL
  mundial:      '4429',   // FIFA World Cup
  formula1:     '4370',   // Formula 1
}

export async function fetchUpcomingEvents(leagueId) {
  const now = new Date()
  let all = []
  // Season endpoint devuelve todos los partidos de la temporada
  try {
    const season = now.getFullYear().toString()
    const r = await fetch(`${BASE}/eventsseason.php?id=${leagueId}&s=${season}`)
    const d = await r.json()
    if (d.events?.length) {
      all = d.events.filter(e =>
        e.strHomeTeam && e.strAwayTeam && e.dateEvent &&
        new Date(e.dateEvent) >= now
      )
    }
  } catch (_) {}
  // Fallback
  if (!all.length) {
    try {
      const r = await fetch(`${BASE}/eventsnextleague.php?id=${leagueId}`)
      const d = await r.json()
      all = (d.events || []).filter(e => e.strHomeTeam && e.strAwayTeam)
    } catch (_) {}
  }
  return all.sort((a, b) => new Date(a.dateEvent) - new Date(b.dateEvent)).slice(0, 40)
}

export async function fetchRecentEvents(leagueId) {
  try {
    const r = await fetch(`${BASE}/eventspastleague.php?id=${leagueId}`)
    const d = await r.json()
    return d.events || []
  } catch { return [] }
}

export function leaguesForSport(sport) {
  return ({ liga_chilena:[LEAGUE_IDS.liga_chilena], premier:[LEAGUE_IDS.premier], champions:[LEAGUE_IDS.champions], nba:[LEAGUE_IDS.nba], nfl:[LEAGUE_IDS.nfl], mundial:[LEAGUE_IDS.mundial], formula1:[LEAGUE_IDS.formula1] })[sport] || []
}

export async function autoFetchResult(event) {
  for (const lid of leaguesForSport(event.sport)) {
    const recent = await fetchRecentEvents(lid)
    for (const e of recent) {
      if (!isFinished(e)) continue
      const score = getScore(e)
      if (score && matchScore(e, event.home, event.away) >= 1) return score
    }
  }
  return null
}

export const isFinished = e =>
  e.strStatus === 'Match Finished' || e.strStatus === 'FT' ||
  e.strStatus === 'AET' || e.intHomeScore !== null

export function getScore(e) {
  const h = parseInt(e.intHomeScore), a = parseInt(e.intAwayScore)
  return isNaN(h) || isNaN(a) ? null : { home: h, away: a }
}

export function matchScore(apiEv, lh, la) {
  const ah = (apiEv.strHomeTeam || '').toLowerCase()
  const aa = (apiEv.strAwayTeam || '').toLowerCase()
  const ow = (a, b) => a.split(/\s+/).filter(w => w.length > 2 && b.split(/\s+/).some(x => x.includes(w) || w.includes(x))).length
  return ow(ah, lh.toLowerCase()) + ow(aa, la.toLowerCase())
}

// ─── LIGA CHILENA 2026 — FIXTURE COMPLETO ANFP ───────────────────────────────
export const LIGA_CHILENA_2026 = [
  { fecha: 8, partidos: [
    { home: 'Deportes Concepción',      away: 'Colo Colo',                  date: '2026-04-08', time: '18:00' },
    { home: 'Coquimbo Unido',           away: 'Cobresal',                   date: '2026-04-08', time: '18:00' },
    { home: 'Universidad de Chile',     away: 'Deportes La Serena',         date: '2026-04-08', time: '18:00' },
    { home: 'Deportes Limache',         away: 'Unión La Calera',            date: '2026-04-09', time: '18:00' },
    { home: "O'Higgins",                away: 'Audax Italiano',             date: '2026-04-09', time: '18:00' },
    { home: 'Universidad Católica',     away: 'Palestino',                  date: '2026-04-09', time: '20:30' },
    { home: 'Everton',                  away: 'Ñublense',                   date: '2026-04-09', time: '20:30' },
    { home: 'Huachipato',               away: 'Universidad de Concepción',  date: '2026-04-09', time: '20:30' },
  ]},
  { fecha: 9, partidos: [
    { home: 'Palestino',                away: 'Deportes Concepción',        date: '2026-04-12', time: '18:00' },
    { home: 'Audax Italiano',           away: 'Universidad de Chile',       date: '2026-04-12', time: '18:00' },
    { home: 'Cobresal',                 away: "O'Higgins",                  date: '2026-04-12', time: '18:00' },
    { home: 'Deportes La Serena',       away: 'Everton',                    date: '2026-04-12', time: '18:00' },
    { home: 'Unión La Calera',          away: 'Universidad Católica',       date: '2026-04-13', time: '18:00' },
    { home: 'Colo Colo',                away: 'Coquimbo Unido',             date: '2026-04-13', time: '20:30' },
    { home: 'Universidad de Concepción',away: 'Deportes Limache',           date: '2026-04-13', time: '18:00' },
    { home: 'Ñublense',                 away: 'Huachipato',                 date: '2026-04-13', time: '20:30' },
  ]},
  { fecha: 10, partidos: [
    { home: 'Coquimbo Unido',           away: 'Deportes La Serena',         date: '2026-04-19', time: '18:00' },
    { home: 'Universidad de Chile',     away: 'Palestino',                  date: '2026-04-19', time: '18:00' },
    { home: 'Deportes Concepción',      away: 'Cobresal',                   date: '2026-04-19', time: '18:00' },
    { home: 'Huachipato',               away: 'Deportes Limache',           date: '2026-04-19', time: '18:00' },
    { home: "O'Higgins",                away: 'Ñublense',                   date: '2026-04-20', time: '18:00' },
    { home: 'Everton',                  away: 'Unión La Calera',            date: '2026-04-20', time: '18:00' },
    { home: 'Universidad Católica',     away: 'Colo Colo',                  date: '2026-04-20', time: '20:30' },
    { home: 'Audax Italiano',           away: 'Universidad de Concepción',  date: '2026-04-20', time: '18:00' },
  ]},
  { fecha: 11, partidos: [
    { home: 'Colo Colo',                away: 'Audax Italiano',             date: '2026-04-26', time: '18:00' },
    { home: 'Palestino',                away: "O'Higgins",                  date: '2026-04-26', time: '18:00' },
    { home: 'Cobresal',                 away: 'Ñublense',                   date: '2026-04-26', time: '18:00' },
    { home: 'Deportes La Serena',       away: 'Huachipato',                 date: '2026-04-26', time: '18:00' },
    { home: 'Unión La Calera',          away: 'Deportes Concepción',        date: '2026-04-27', time: '18:00' },
    { home: 'Universidad de Concepción',away: 'Everton',                    date: '2026-04-27', time: '18:00' },
    { home: 'Deportes Limache',         away: 'Coquimbo Unido',             date: '2026-04-27', time: '18:00' },
    { home: 'Universidad de Chile',     away: 'Universidad Católica',       date: '2026-04-27', time: '20:30' }, // Clásico
  ]},
  { fecha: 12, partidos: [
    { home: "O'Higgins",                away: 'Colo Colo',                  date: '2026-05-03', time: '18:00' },
    { home: 'Audax Italiano',           away: 'Palestino',                  date: '2026-05-03', time: '18:00' },
    { home: 'Ñublense',                 away: 'Universidad de Chile',       date: '2026-05-03', time: '18:00' },
    { home: 'Huachipato',               away: 'Cobresal',                   date: '2026-05-03', time: '18:00' },
    { home: 'Deportes Concepción',      away: 'Deportes La Serena',         date: '2026-05-04', time: '18:00' },
    { home: 'Coquimbo Unido',           away: 'Unión La Calera',            date: '2026-05-04', time: '18:00' },
    { home: 'Everton',                  away: 'Deportes Limache',           date: '2026-05-04', time: '18:00' },
    { home: 'Universidad Católica',     away: 'Universidad de Concepción',  date: '2026-05-04', time: '20:30' },
  ]},
  { fecha: 13, partidos: [
    { home: 'Colo Colo',                away: 'Universidad Católica',       date: '2026-05-10', time: '20:30' }, // Clásico
    { home: 'Palestino',                away: 'Ñublense',                   date: '2026-05-10', time: '18:00' },
    { home: 'Cobresal',                 away: 'Audax Italiano',             date: '2026-05-10', time: '18:00' },
    { home: 'Deportes La Serena',       away: "O'Higgins",                  date: '2026-05-10', time: '18:00' },
    { home: 'Unión La Calera',          away: 'Huachipato',                 date: '2026-05-11', time: '18:00' },
    { home: 'Universidad de Chile',     away: 'Coquimbo Unido',             date: '2026-05-11', time: '20:30' },
    { home: 'Deportes Limache',         away: 'Deportes Concepción',        date: '2026-05-11', time: '18:00' },
    { home: 'Universidad de Concepción',away: 'Everton',                    date: '2026-05-11', time: '18:00' },
  ]},
  { fecha: 14, partidos: [
    { home: 'Audax Italiano',           away: 'Colo Colo',                  date: '2026-05-17', time: '18:00' },
    { home: "O'Higgins",                away: 'Cobresal',                   date: '2026-05-17', time: '18:00' },
    { home: 'Ñublense',                 away: 'Palestino',                  date: '2026-05-17', time: '18:00' },
    { home: 'Huachipato',               away: 'Deportes La Serena',         date: '2026-05-17', time: '18:00' },
    { home: 'Deportes Concepción',      away: 'Unión La Calera',            date: '2026-05-18', time: '18:00' },
    { home: 'Coquimbo Unido',           away: 'Universidad de Chile',       date: '2026-05-18', time: '20:30' },
    { home: 'Deportes Limache',         away: 'Everton',                    date: '2026-05-18', time: '18:00' },
    { home: 'Universidad de Concepción',away: 'Universidad Católica',       date: '2026-05-18', time: '18:00' },
  ]},
  { fecha: 15, partidos: [
    { home: 'Colo Colo',                away: 'Deportes La Serena',         date: '2026-05-24', time: '20:30' },
    { home: 'Universidad Católica',     away: 'Huachipato',                 date: '2026-05-24', time: '18:00' },
    { home: 'Palestino',                away: 'Audax Italiano',             date: '2026-05-24', time: '18:00' },
    { home: 'Cobresal',                 away: 'Deportes Concepción',        date: '2026-05-24', time: '18:00' },
    { home: 'Unión La Calera',          away: 'Coquimbo Unido',             date: '2026-05-25', time: '18:00' },
    { home: 'Everton',                  away: "O'Higgins",                  date: '2026-05-25', time: '18:00' },
    { home: 'Universidad de Chile',     away: 'Ñublense',                   date: '2026-05-25', time: '20:30' },
    { home: 'Deportes Limache',         away: 'Universidad de Concepción',  date: '2026-05-25', time: '18:00' },
  ]},
]
