// ─── TheSportsDB API (free, no key required) ─────────────────────────────────
// Docs: https://www.thesportsdb.com/api.php
// Limit: ~200 req/day free tier

const BASE = 'https://www.thesportsdb.com/api/v1/json/3'

// Liga IDs en TheSportsDB
export const LEAGUE_IDS = {
  liga_chilena: '4406',   // Primera División de Chile
  premier:      '4328',   // Premier League
  champions:    '4480',   // UEFA Champions League
  nba:          '4387',   // NBA
  nfl:          '4391',   // NFL
  mundial:      '4429',   // FIFA World Cup
  formula1:     '4370',   // Formula 1
}

// Trae los últimos eventos de una liga
export async function fetchRecentEvents(leagueId) {
  try {
    const r = await fetch(`${BASE}/eventspastleague.php?id=${leagueId}`)
    const d = await r.json()
    return d.events || []
  } catch { return [] }
}

// Trae los próximos eventos de una liga
export async function fetchUpcomingEvents(leagueId) {
  try {
    const r = await fetch(`${BASE}/eventsnextleague.php?id=${leagueId}`)
    const d = await r.json()
    return d.events || []
  } catch { return [] }
}

// Busca un evento específico por nombre de equipos
export async function searchEvent(home, away) {
  try {
    const query = encodeURIComponent(`${home} vs ${away}`)
    const r = await fetch(`${BASE}/searchevents.php?e=${query}`)
    const d = await r.json()
    return d.event || []
  } catch { return [] }
}

// Trae eventos en vivo (requiere Patreon en TheSportsDB, usamos fallback)
export async function fetchLiveEvents() {
  try {
    const r = await fetch(`${BASE}/livescore.php`)
    const d = await r.json()
    return d.events || []
  } catch { return [] }
}

// ─── Busca resultado de un evento específico ──────────────────────────────────
// Compara nombre de equipos del evento local con los de la API
export function matchScore(apiEvent, localHome, localAway) {
  const ah = (apiEvent.strHomeTeam || '').toLowerCase()
  const aa = (apiEvent.strAwayTeam || '').toLowerCase()
  const lh = localHome.toLowerCase()
  const la = localAway.toLowerCase()
  const score = wordOverlap(ah, lh) + wordOverlap(aa, la)
  return score
}

function wordOverlap(a, b) {
  const wa = a.split(/\s+/)
  const wb = b.split(/\s+/)
  return wa.filter(w => w.length > 2 && wb.some(x => x.includes(w) || w.includes(x))).length
}

// ─── Match finished + has score ──────────────────────────────────────────────
export function isFinished(apiEvent) {
  return (
    apiEvent.strStatus === 'Match Finished' ||
    apiEvent.strStatus === 'FT' ||
    apiEvent.strStatus === 'AET' ||
    apiEvent.intHomeScore !== null
  )
}

export function getScore(apiEvent) {
  const h = parseInt(apiEvent.intHomeScore)
  const a = parseInt(apiEvent.intAwayScore)
  if (isNaN(h) || isNaN(a)) return null
  return { home: h, away: a }
}

// ─── Map sport ID to league IDs to search ────────────────────────────────────
export function leaguesForSport(sport) {
  const map = {
    liga_chilena: [LEAGUE_IDS.liga_chilena],
    premier:      [LEAGUE_IDS.premier],
    champions:    [LEAGUE_IDS.champions],
    nba:          [LEAGUE_IDS.nba],
    nfl:          [LEAGUE_IDS.nfl],
    mundial:      [LEAGUE_IDS.mundial],
    formula1:     [LEAGUE_IDS.formula1],
  }
  return map[sport] || []
}

// ─── Main: try to auto-resolve result for an event ───────────────────────────
export async function autoFetchResult(event) {
  const leagueIds = leaguesForSport(event.sport)
  if (!leagueIds.length) return null

  for (const lid of leagueIds) {
    const recent = await fetchRecentEvents(lid)
    for (const apiEv of recent) {
      if (!isFinished(apiEv)) continue
      const score = getScore(apiEv)
      if (!score) continue
      if (matchScore(apiEv, event.home, event.away) >= 1) {
        return score
      }
    }
  }
  return null
}
