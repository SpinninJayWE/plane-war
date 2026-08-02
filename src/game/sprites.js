function make(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = Math.max(2, Math.round(w * 2))
  c.height = Math.max(2, Math.round(h * 2))
  const g = c.getContext('2d')
  g.scale(2, 2)
  g.translate(w / 2, h / 2)
  draw(g, w, h)
  return c
}

function glow(g, r, inner, outer) {
  const gr = g.createRadialGradient(0, 0, r * 0.2, 0, 0, r)
  gr.addColorStop(0, inner)
  gr.addColorStop(1, outer)
  g.fillStyle = gr
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.fill()
}

function poly(g, pts) {
  g.beginPath()
  g.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1])
  g.closePath()
  g.fill()
}

function liner(g, x1, y1, x2, y2, stops) {
  const gr = g.createLinearGradient(x1, y1, x2, y2)
  for (const [p, c] of stops) gr.addColorStop(p, c)
  g.fillStyle = gr
}

function player(w, h) {
  return make(w, h, (g) => {
    const top = -h / 2 + 1
    const bot = h / 2 - 1
    glow(g, 30, 'rgba(56,189,248,0.30)', 'rgba(56,189,248,0)')
    g.fillStyle = '#0c4a6e'
    poly(g, [[-2, bot - 4], [-17, bot - 16], [-9, bot - 17], [-2, bot - 10]])
    poly(g, [[2, bot - 4], [17, bot - 16], [9, bot - 17], [2, bot - 10]])
    liner(g, 0, top, 0, bot, [[0, '#e0f2fe'], [0.45, '#38bdf8'], [1, '#1d4ed8']])
    poly(g, [[0, top], [-14, bot - 15], [-6, bot - 15], [-6, bot - 3], [6, bot - 3], [6, bot - 15], [14, bot - 15]])
    g.fillStyle = 'rgba(255,255,255,0.5)'
    g.beginPath()
    g.moveTo(0, top + 1)
    g.lineTo(-3.4, bot - 18)
    g.lineTo(-2, bot - 18)
    g.closePath()
    g.fill()
    g.fillStyle = '#0f172a'
    g.beginPath()
    g.ellipse(0, -4, 4.6, 7.5, 0, 0, Math.PI * 2)
    g.fill()
    const cg = g.createLinearGradient(0, -11, 0, 3)
    cg.addColorStop(0, '#f0f9ff')
    cg.addColorStop(0.5, '#7dd3fc')
    cg.addColorStop(1, '#0c4a6e')
    g.fillStyle = cg
    g.beginPath()
    g.ellipse(0, -4, 3, 5.5, 0, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(255,255,255,0.85)'
    g.beginPath()
    g.ellipse(-0.8, -6.2, 1.1, 2.2, -0.4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#22d3ee'
    g.beginPath()
    g.arc(0, -h / 2 + 3, 1.6, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#f87171'
    g.beginPath()
    g.arc(-13, bot - 16, 1.7, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#4ade80'
    g.beginPath()
    g.arc(13, bot - 16, 1.7, 0, Math.PI * 2)
    g.fill()
    const eg = g.createRadialGradient(0, bot - 2, 1, 0, bot - 2, 7)
    eg.addColorStop(0, 'rgba(255,220,140,0.95)')
    eg.addColorStop(1, 'rgba(255,140,40,0)')
    g.fillStyle = eg
    g.beginPath()
    g.arc(0, bot - 2, 7, 0, Math.PI * 2)
    g.fill()
  })
}

function grunt(w, h) {
  return make(w, h, (g) => {
    glow(g, 22, 'rgba(229,72,77,0.35)', 'rgba(229,72,77,0)')
    liner(g, 0, -h / 2, 0, h / 2, [[0, '#ff8080'], [0.5, '#e5484d'], [1, '#7f1d1d']])
    poly(g, [[0, h / 2 - 1], [11, -h / 2 + 8], [5, -h / 2 + 8], [0, -h / 2 + 12], [-5, -h / 2 + 8], [-11, -h / 2 + 8]])
    g.fillStyle = 'rgba(255,255,255,0.35)'
    g.beginPath()
    g.moveTo(0, h / 2 - 3)
    g.lineTo(7, -h / 2 + 9)
    g.lineTo(2.5, -h / 2 + 9)
    g.closePath()
    g.fill()
    const cg = g.createRadialGradient(0, -2, 0.5, 0, -2, 3.4)
    cg.addColorStop(0, '#fff1f2')
    cg.addColorStop(1, '#881337')
    g.fillStyle = cg
    g.beginPath()
    g.arc(0, -2, 3.4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(255,255,255,0.9)'
    g.beginPath()
    g.arc(-0.8, -3, 1, 0, Math.PI * 2)
    g.fill()
  })
}

function weaver(w, h) {
  return make(w, h, (g) => {
    glow(g, 24, 'rgba(167,139,250,0.35)', 'rgba(167,139,250,0)')
    g.fillStyle = '#4c1d95'
    poly(g, [[0, -h / 2 + 6], [-13, -h / 2 + 6], [-13, h / 2 - 2], [0, -h / 2 + 12]])
    poly(g, [[0, -h / 2 + 6], [13, -h / 2 + 6], [13, h / 2 - 2], [0, -h / 2 + 12]])
    liner(g, 0, -h / 2, 0, h / 2, [[0, '#d8b4fe'], [0.55, '#a78bfa'], [1, '#5b21b6']])
    poly(g, [[0, h / 2 - 1], [13, -h / 2 + 7], [13, -h / 2 + 2], [0, -h / 2 + 10], [-13, -h / 2 + 2], [-13, -h / 2 + 7]])
    glow(g, 5, 'rgba(240,220,255,0.95)', 'rgba(216,180,254,0)')
    g.beginPath()
    g.arc(0, 2, 5, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#f5f3ff'
    g.beginPath()
    g.arc(0, 2, 1.8, 0, Math.PI * 2)
    g.fill()
  })
}

function mini(w, h) {
  return make(w, h, (g) => {
    glow(g, 18, 'rgba(251,146,60,0.4)', 'rgba(251,146,60,0)')
    liner(g, 0, -h / 2, 0, h / 2, [[0, '#fdba74'], [0.6, '#fb923c'], [1, '#9a3412']])
    poly(g, [[0, h / 2 - 1], [7, -h / 2 + 7], [0, -h / 2 + 10], [-7, -h / 2 + 7]])
    g.strokeStyle = '#fed7aa'
    g.lineWidth = 1.4
    g.beginPath()
    g.moveTo(0, h / 2 - 2)
    g.lineTo(0, -h / 2 + 7)
    g.stroke()
    g.fillStyle = '#fff7ed'
    g.beginPath()
    g.arc(0, -h / 2 + 6.4, 1.3, 0, Math.PI * 2)
    g.fill()
    glow(g, 4, 'rgba(255,220,150,0.9)', 'rgba(255,170,60,0)')
    g.beginPath()
    g.arc(0, h / 2 - 2, 4, 0, Math.PI * 2)
    g.fill()
  })
}

function diver(w, h) {
  return make(w, h, (g) => {
    glow(g, 22, 'rgba(251,191,36,0.35)', 'rgba(251,191,36,0)')
    g.fillStyle = '#78350f'
    poly(g, [[-3, h / 2 - 2], [-13, h / 2 - 12], [-6, h / 2 - 13], [-3, h / 2 - 7]])
    poly(g, [[3, h / 2 - 2], [13, h / 2 - 12], [6, h / 2 - 13], [3, h / 2 - 7]])
    liner(g, 0, -h / 2, 0, h / 2, [[0, '#fde68a'], [0.5, '#fbbf24'], [1, '#92400e']])
    poly(g, [[0, h / 2 - 1], [9, -h / 2 + 8], [0, -h / 2 + 12], [-9, -h / 2 + 8]])
    g.fillStyle = 'rgba(255,255,255,0.4)'
    g.beginPath()
    g.moveTo(0, h / 2 - 3)
    g.lineTo(5, -h / 2 + 9)
    g.lineTo(2, -h / 2 + 9)
    g.closePath()
    g.fill()
    glow(g, 4, 'rgba(255,240,180,0.95)', 'rgba(253,230,138,0)')
    g.beginPath()
    g.arc(0, 1, 4, 0, Math.PI * 2)
    g.fill()
  })
}

function sniper(w, h) {
  return make(w, h, (g) => {
    glow(g, 26, 'rgba(56,189,248,0.3)', 'rgba(56,189,248,0)')
    g.fillStyle = '#083344'
    poly(g, [[0, -h / 2 + 2], [-15, -h / 2 + 6], [-15, -h / 2 + 1], [0, -h / 2 + 7]])
    poly(g, [[0, -h / 2 + 2], [15, -h / 2 + 6], [15, -h / 2 + 1], [0, -h / 2 + 7]])
    liner(g, 0, -h / 2, 0, h / 2, [[0, '#bae6fd'], [0.5, '#38bdf8'], [1, '#075985']])
    poly(g, [[0, h / 2 - 1], [7, h / 2 - 11], [15, -h / 2 + 4], [15, -h / 2 - 3], [0, -h / 2 + 7], [-15, -h / 2 - 3], [-15, -h / 2 + 4], [-7, h / 2 - 11]])
    g.fillStyle = '#0c4a6e'
    g.beginPath()
    g.arc(0, -2, 5.5, 0, Math.PI * 2)
    g.fill()
    const bg = g.createRadialGradient(0, -2, 0.5, 0, -2, 4)
    bg.addColorStop(0, '#f0f9ff')
    bg.addColorStop(1, '#075985')
    g.fillStyle = bg
    g.beginPath()
    g.arc(0, -2, 4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fbbf24'
    g.fillRect(-2.4, -2.2, 1.6, 1.6)
    g.fillRect(0.8, -2.2, 1.6, 1.6)
    const tg = g.createLinearGradient(-15, 0, 15, 0)
    tg.addColorStop(0, 'rgba(251,191,36,0)')
    tg.addColorStop(0.5, 'rgba(251,191,36,0.75)')
    tg.addColorStop(1, 'rgba(251,191,36,0)')
    g.fillStyle = tg
    g.fillRect(-8, h / 2 - 13, 16, 2)
  })
}

function tank(w, h) {
  return make(w, h, (g) => {
    glow(g, 30, 'rgba(74,222,128,0.3)', 'rgba(74,222,128,0)')
    liner(g, 0, -h / 2, 0, h / 2, [[0, '#bbf7d0'], [0.5, '#4ade80'], [1, '#14532d']])
    poly(g, [[0, -h / 2 + 2], [22, -h / 2 + 14], [22, -h / 2 + 20], [14, h / 2 - 1], [-14, h / 2 - 1], [-22, -h / 2 + 20], [-22, -h / 2 + 14]])
    g.fillStyle = 'rgba(255,255,255,0.25)'
    g.beginPath()
    g.moveTo(0, -h / 2 + 5)
    g.lineTo(-14, -h / 2 + 17)
    g.lineTo(-6, -h / 2 + 17)
    g.closePath()
    g.fill()
    g.fillStyle = '#052e16'
    g.beginPath()
    g.arc(0, -2, 7.5, 0, Math.PI * 2)
    g.fill()
    const cg = g.createRadialGradient(0, -2, 0.5, 0, -2, 5.4)
    cg.addColorStop(0, '#dcfce7')
    cg.addColorStop(1, '#166534')
    g.fillStyle = cg
    g.beginPath()
    g.arc(0, -2, 5.4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#065f46'
    g.fillRect(-16, -h / 2 + 4, 32, 3)
    g.fillStyle = 'rgba(2,6,23,0.55)'
    g.fillRect(-16, -h / 2 + 7, 32, 3)
    g.fillStyle = '#bbf7d0'
    g.fillRect(-16, -h / 2 + 7, 32, 3)
    g.fillStyle = '#052e16'
    g.fillRect(-14, h / 2 - 12, 6, 11)
    g.fillRect(8, h / 2 - 12, 6, 11)
    glow(g, 3.4, 'rgba(255,200,120,0.9)', 'rgba(255,160,60,0)')
    g.beginPath()
    g.arc(-11, h / 2 - 8, 3.4, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.arc(11, h / 2 - 8, 3.4, 0, Math.PI * 2)
    g.fill()
  })
}

function boss(w, h, body, dark, glowC) {
  return make(w, h, (g) => {
    glow(g, 52, hexA(glowC, 0.35), hexA(glowC, 0))
    liner(g, 0, -h / 2, 0, h / 2, [[0, glowC], [0.5, body], [1, dark]])
    poly(g, [[0, -h / 2 + 2], [40, -h / 2 + 22], [44, h / 2 - 12], [30, h / 2 - 4], [-30, h / 2 - 4], [-44, h / 2 - 12], [-40, -h / 2 + 22]])
    g.fillStyle = 'rgba(255,255,255,0.18)'
    g.beginPath()
    g.moveTo(0, -h / 2 + 5)
    g.lineTo(-26, -h / 2 + 24)
    g.lineTo(-8, -h / 2 + 24)
    g.closePath()
    g.fill()
    g.fillStyle = 'rgba(2,6,23,0.5)'
    for (let i = -2; i <= 2; i++) g.fillRect(i * 12 - 4, -h / 2 + 16, 8, 2)
    g.fillStyle = dark
    g.fillRect(-30, 4, 9, 22)
    g.fillRect(21, 4, 9, 22)
    g.fillRect(-13, 14, 26, 6)
    glow(g, 14, hexA(glowC, 0.9), hexA(glowC, 0))
    g.beginPath()
    g.arc(0, -6, 14, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#0f172a'
    g.beginPath()
    g.arc(0, -6, 6.2, 0, Math.PI * 2)
    g.fill()
    const cg = g.createRadialGradient(0, -6, 0.5, 0, -6, 4)
    cg.addColorStop(0, '#ffffff')
    cg.addColorStop(1, hexA(glowC, 0.6))
    g.fillStyle = cg
    g.beginPath()
    g.arc(0, -6, 4, 0, Math.PI * 2)
    g.fill()
    glow(g, 6, hexA(glowC, 0.9), hexA(glowC, 0))
    g.beginPath()
    g.arc(-26, 18, 6, 0, Math.PI * 2)
    g.fill()
    g.beginPath()
    g.arc(26, 18, 6, 0, Math.PI * 2)
    g.fill()
  })
}

function bullet(w, h) {
  return make(w, h, (g) => {
    glow(g, w / 2, 'rgba(250,204,21,0.4)', 'rgba(250,204,21,0)')
    const bg = g.createRadialGradient(0, 0, 0.5, 0, 0, w / 2 - 3)
    bg.addColorStop(0, '#ffffff')
    bg.addColorStop(0.4, '#fef9c3')
    bg.addColorStop(1, '#f59e0b')
    g.fillStyle = bg
    g.beginPath()
    g.arc(0, 0, w / 2 - 3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fffbe6'
    g.beginPath()
    g.arc(-0.8, -0.8, (w / 2 - 3) * 0.35, 0, Math.PI * 2)
    g.fill()
  })
}

function ebullet(w, h) {
  return make(w, h, (g) => {
    glow(g, w / 2, 'rgba(248,113,113,0.5)', 'rgba(248,113,113,0)')
    const bg = g.createRadialGradient(0, 0, 0.5, 0, 0, w / 2 - 2)
    bg.addColorStop(0, '#fff1f2')
    bg.addColorStop(0.45, '#fda4af')
    bg.addColorStop(1, '#e11d48')
    g.fillStyle = bg
    g.beginPath()
    g.arc(0, 0, w / 2 - 2, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = 'rgba(255,255,255,0.9)'
    g.beginPath()
    g.arc(-0.7, -0.7, (w / 2 - 2) * 0.3, 0, Math.PI * 2)
    g.fill()
  })
}

function pup(w, h, letter, bodyC, glowC) {
  return make(w, h, (g) => {
    glow(g, w / 2, hexA(glowC, 0.45), hexA(glowC, 0))
    const gd = g.createRadialGradient(0, 0, 0.5, 0, 0, w / 2 - 3)
    gd.addColorStop(0, '#ffffff')
    gd.addColorStop(0.35, bodyC)
    gd.addColorStop(1, hexA(bodyC, 0.55))
    g.fillStyle = gd
    g.beginPath()
    g.arc(0, 0, w / 2 - 3, 0, Math.PI * 2)
    g.fill()
    if (letter) {
      g.fillStyle = 'rgba(2,6,23,0.85)'
      g.font = 'bold 11px system-ui, sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(letter, 0, 1)
    }
  })
}

function gem(w, h) {
  return make(w, h, (g) => {
    glow(g, w / 2, 'rgba(52,211,153,0.5)', 'rgba(52,211,153,0)')
    const gd = g.createLinearGradient(0, -h / 2, 0, h / 2)
    gd.addColorStop(0, '#a7f3d0')
    gd.addColorStop(0.5, '#34d399')
    gd.addColorStop(1, '#047857')
    g.fillStyle = gd
    g.beginPath()
    g.moveTo(0, -h / 2 + 2)
    g.lineTo(w / 2 - 2, 0)
    g.lineTo(0, h / 2 - 2)
    g.lineTo(-w / 2 + 2, 0)
    g.closePath()
    g.fill()
    g.strokeStyle = 'rgba(255,255,255,0.7)'
    g.lineWidth = 0.8
    g.beginPath()
    g.moveTo(0, -h / 2 + 2)
    g.lineTo(0, h / 2 - 2)
    g.moveTo(-w / 2 + 2, 0)
    g.lineTo(w / 2 - 2, 0)
    g.stroke()
    g.fillStyle = 'rgba(255,255,255,0.8)'
    g.beginPath()
    g.moveTo(-1.6, -3.6)
    g.lineTo(1.6, -3.6)
    g.lineTo(0.6, -1.4)
    g.lineTo(-0.6, -1.4)
    g.closePath()
    g.fill()
  })
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export function buildSprites() {
  return {
    player: player(36, 44),
    grunt: grunt(30, 30),
    weaver: weaver(34, 32),
    mini: mini(22, 24),
    diver: diver(26, 34),
    sniper: sniper(40, 34),
    tank: tank(50, 44),
    boss1: boss(96, 92, '#6366f1', '#312e81', '#a5b4fc'),
    boss2: boss(96, 92, '#a855f7', '#581c87', '#d8b4fe'),
    boss3: boss(96, 92, '#f43f5e', '#881337', '#fda4af'),
    bullet: bullet(16, 16),
    ebullet: ebullet(16, 16),
    pupPower: pup(30, 30, 'P', '#f87171', '#fecaca'),
    pupShield: pup(30, 30, 'S', '#60a5fa', '#bfdbfe'),
    pupBomb: pup(30, 30, 'B', '#fb923c', '#fed7aa'),
    pupLife: pup(30, 30, '+', '#f472b6', '#fbcfe8'),
    pupGem: gem(30, 30),
  }
}
