export const SPORTS = [
  { id: 'liga_chilena', name: 'Liga Chilena',   emoji: '🇨🇱', bg: 'linear-gradient(135deg,#071a0f 0%,#0d3320 100%)', accent: '#22c55e' },
  { id: 'formula1',    name: 'Fórmula 1',       emoji: '🏎️',  bg: 'linear-gradient(135deg,#1a0000 0%,#3d0a0a 100%)', accent: '#ef4444' },
  { id: 'premier',     name: 'Premier League',  emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', bg: 'linear-gradient(135deg,#080018 0%,#180040 100%)', accent: '#818cf8' },
  { id: 'champions',   name: 'Champions',       emoji: '⭐',  bg: 'linear-gradient(135deg,#141000 0%,#332a00 100%)', accent: '#ffd700' },
  { id: 'nba',         name: 'NBA',             emoji: '🏀',  bg: 'linear-gradient(135deg,#140500 0%,#3d1200 100%)', accent: '#f97316' },
  { id: 'nfl',         name: 'NFL',             emoji: '🏈',  bg: 'linear-gradient(135deg,#000d03 0%,#002b0e 100%)', accent: '#4ade80' },
  { id: 'mundial',     name: 'Mundial FIFA',    emoji: '🌍',  bg: 'linear-gradient(135deg,#000d18 0%,#002240 100%)', accent: '#38bdf8' },
  { id: 'ufc',         name: 'UFC / Boxeo',     emoji: '🥊',  bg: 'linear-gradient(135deg,#180000 0%,#3d0000 100%)', accent: '#f87171' },
  { id: 'other',       name: 'Otro',            emoji: '🏆',  bg: 'linear-gradient(135deg,#080808 0%,#181818 100%)', accent: '#ffd700' },
]

export const AVATARS = [
  '🦁','🐯','🦊','🐺','🦅','🐉','⚡','🔥','💎','🚀',
  '🌟','👑','🎯','🎲','🏆','⚽','🐬','🦋','🔮','🎳',
]

export const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

export function getSport(id) {
  return SPORTS.find(s => s.id === id) || SPORTS[SPORTS.length - 1]
}

export function calcPoints(hp, ap, rh, ra) {
  const h = parseFloat(hp), a = parseFloat(ap)
  const rH = parseFloat(rh), rA = parseFloat(ra)
  if (isNaN(h) || isNaN(a) || isNaN(rH) || isNaN(rA)) return null
  if (h === rH && a === rA) return 3
  const bo = h > a ? 1 : h < a ? -1 : 0
  const ro = rH > rA ? 1 : rH < rA ? -1 : 0
  return bo === ro ? 1 : 0
}

export function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('es-CL', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export function fmtMoney(n) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency', currency: 'CLP', minimumFractionDigits: 0,
  }).format(n)
}

export function nowCL() {
  return new Date()
}

export function isBettingOpen(event) {
  if (event.status !== 'upcoming') return false
  return new Date(event.close_at) > new Date()
}
