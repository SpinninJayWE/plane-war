import { FIELD_W, FIELD_H, ENEMY_TYPES, ENEMY_PAL } from './constants.js'

const PUP_PAL = {
  gem: { body: '#34d399', glow: '#a7f3d0' },
  power: { body: '#f87171', glow: '#fecaca' },
  shield: { body: '#60a5fa', glow: '#bfdbfe' },
  bomb: { body: '#fb923c', glow: '#fed7aa' },
  life: { body: '#f472b6', glow: '#fbcfe8' },
}

export class Renderer {
  constructor(engine) {
    this.engine = engine
    this.stars = []
    for (let i = 0; i < 90; i++) {
      this.stars.push({
        x: Math.random() * FIELD_W,
        y: Math.random() * FIELD_H,
        s: Math.random() * 1.6 + 0.4,
        layer: Math.random() < 0.5 ? 1 : Math.random() < 0.5 ? 2 : 3,
      })
    }
    this.t = 0
  }

  draw(ctx) {
    const e = this.engine
    this.t += 0.016
    const dpr = e.dpr
    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, ctx.canvas.width / dpr, ctx.canvas.height / dpr)
    ctx.translate(e.ox, e.oy)

    if (e.shake > 0) {
      ctx.translate((Math.random() - 0.5) * e.shake, (Math.random() - 0.5) * e.shake)
    }

    this.drawBackground(ctx)
    this.drawVignette(ctx)
    this.drawPowerups(ctx)
    this.drawEnemyBullets(ctx)
    this.drawBullets(ctx)
    this.drawEnemies(ctx)
    if (e.boss) this.drawBoss(ctx)
    if (e.phase === 'playing' || e.phase === 'paused') this.drawPlayer(ctx)
    this.drawParticles(ctx)
    if (e.boss) this.drawBossBar(ctx)
    this.drawTouchIndicator(ctx)

    if (e.hurtFlash > 0) {
      const a = Math.min(0.5, e.hurtFlash * 0.55)
      const g = ctx.createRadialGradient(FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.25, FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.75)
      g.addColorStop(0, 'rgba(220,38,38,0)')
      g.addColorStop(1, `rgba(220,38,38,${a})`)
      ctx.fillStyle = g
      ctx.fillRect(-20, -20, FIELD_W + 40, FIELD_H + 40)
    }
    if (e.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.9, e.flash)})`
      ctx.fillRect(-20, -20, FIELD_W + 40, FIELD_H + 40)
    }
    ctx.restore()
  }

  drawVignette(ctx) {
    const g = ctx.createRadialGradient(FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.42, FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.82)
    g.addColorStop(0, 'rgba(2,6,23,0)')
    g.addColorStop(1, 'rgba(2,6,23,0.45)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, FIELD_W, FIELD_H)
  }

  drawTouchIndicator(ctx) {
    const e = this.engine
    if (!e.pointer.active || !e.pointer.isTouch) return
    const x = e.pointer.x
    const y = e.pointer.y
    ctx.strokeStyle = 'rgba(125,211,252,0.55)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(x, y, 17 + Math.sin(this.t * 8) * 2, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(125,211,252,0.4)'
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  drawBackground(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD_H)
    g.addColorStop(0, '#050816')
    g.addColorStop(0.55, '#0a1024')
    g.addColorStop(1, '#140b26')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, FIELD_W, FIELD_H)

    const speedMul = { 1: 26, 2: 60, 3: 110 }
    for (const st of this.stars) {
      st.y += speedMul[st.layer] * 0.016
      if (st.y > FIELD_H) {
        st.y = -2
        st.x = Math.random() * FIELD_W
      }
      ctx.globalAlpha = 0.25 + st.layer * 0.22
      ctx.fillStyle = st.layer === 3 ? '#e2e8f0' : st.layer === 2 ? '#93c5fd' : '#475569'
      ctx.fillRect(st.x, st.y, st.s, st.s)
    }
    ctx.globalAlpha = 1
  }

  drawPlayer(ctx) {
    const e = this.engine
    const p = e.player
    if (p.invuln > 0 && Math.floor(this.t * 14) % 2 === 0) ctx.globalAlpha = 0.45
    ctx.save()
    ctx.translate(p.x, p.y)
    if (p.tilt) ctx.rotate(p.tilt)

    const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, 27)
    gl.addColorStop(0, 'rgba(56,189,248,0.22)')
    gl.addColorStop(1, 'rgba(56,189,248,0)')
    ctx.fillStyle = gl
    ctx.beginPath()
    ctx.arc(0, 0, 27, 0, Math.PI * 2)
    ctx.fill()

    const flame = 10 + Math.sin(this.t * 40) * 4 + Math.abs(p.tilt || 0) * 20
    ctx.fillStyle = 'rgba(255,170,60,0.9)'
    ctx.beginPath()
    ctx.moveTo(-4, 14)
    ctx.lineTo(0, 14 + flame)
    ctx.lineTo(4, 14)
    ctx.closePath()
    ctx.fill()

    const g = ctx.createLinearGradient(0, -22, 0, 14)
    g.addColorStop(0, '#e0f2fe')
    g.addColorStop(0.5, '#38bdf8')
    g.addColorStop(1, '#1d4ed8')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(0, -22)
    ctx.lineTo(-14, 8)
    ctx.lineTo(-6, 8)
    ctx.lineTo(-6, 14)
    ctx.lineTo(6, 14)
    ctx.lineTo(6, 8)
    ctx.lineTo(14, 8)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#0ea5e9'
    ctx.beginPath()
    ctx.arc(0, -2, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#bae6fd'
    ctx.beginPath()
    ctx.arc(0, -3, 2, 0, Math.PI * 2)
    ctx.fill()

    if (p.muzzle > 0) {
      const m = Math.min(1, p.muzzle / 0.06)
      ctx.globalAlpha = m
      ctx.fillStyle = '#fff7cc'
      ctx.beginPath()
      ctx.arc(0, -24, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#fffbe6'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, -32)
      ctx.lineTo(0, -16)
      ctx.moveTo(-7, -24)
      ctx.lineTo(7, -24)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    if (p.shield > 0) {
      ctx.strokeStyle = p.shieldFlash > 0 ? '#ffffff' : '#38bdf8'
      ctx.globalAlpha = 0.5 + (p.shieldFlash > 0 ? 0.5 : Math.sin(this.t * 5) * 0.15)
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(0, 0, 21, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 0.12
      ctx.fillStyle = '#38bdf8'
      ctx.beginPath()
      ctx.arc(0, 0, 21, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    ctx.globalAlpha = 1
  }

  drawBullets(ctx) {
    const e = this.engine
    for (const b of e.bullets) {
      const g = ctx.createLinearGradient(b.x, b.y, b.x - b.vx * 0.03, b.y - b.vy * 0.03)
      g.addColorStop(0, '#fef9c3')
      g.addColorStop(1, 'rgba(250,204,21,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  drawEnemyBullets(ctx) {
    const e = this.engine
    for (const b of e.ebullets) {
      const pulse = 1 + Math.sin(this.t * 12) * 0.18
      ctx.fillStyle = 'rgba(248,113,113,0.28)'
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r * 2 * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fda4af'
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  drawEnemies(ctx) {
    const e = this.engine
    for (const en of e.enemies) {
      const pal = ENEMY_PAL[en.type]
      const def = ENEMY_TYPES[en.type]
      ctx.save()
      ctx.translate(en.x, en.y)
      ctx.globalAlpha = en.y < 8 ? 0.3 + (en.y / 8) * 0.7 : 1
      switch (en.type) {
        case 'grunt':
          this.shapeGrunt(ctx, pal)
          break
        case 'weaver':
          this.shapeWeaver(ctx, pal)
          break
        case 'mini':
          this.shapeMini(ctx, pal)
          break
        case 'diver':
          this.shapeDiver(ctx, pal)
          break
        case 'sniper':
          this.shapeSniper(ctx, en, pal)
          break
        case 'tank':
          this.shapeTank(ctx, en, pal)
          break
        default:
          break
      }
      if (en.flash > 0) {
        ctx.globalAlpha = Math.min(1, en.flash * 10) * 0.75
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(0, 0, def.r + 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
      ctx.restore()
      ctx.globalAlpha = 1
    }
  }

  shapeGrunt(ctx, pal) {
    ctx.fillStyle = pal.body
    ctx.beginPath()
    ctx.moveTo(0, 13)
    ctx.lineTo(11, -8)
    ctx.lineTo(5, -8)
    ctx.lineTo(0, -4)
    ctx.lineTo(-5, -8)
    ctx.lineTo(-11, -8)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = pal.dark
    ctx.beginPath()
    ctx.arc(0, 2, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  shapeWeaver(ctx, pal) {
    ctx.fillStyle = pal.body
    ctx.beginPath()
    ctx.moveTo(0, 14)
    ctx.lineTo(13, -4)
    ctx.lineTo(13, -10)
    ctx.lineTo(0, -4)
    ctx.lineTo(-13, -10)
    ctx.lineTo(-13, -4)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = pal.glow
    ctx.beginPath()
    ctx.arc(0, 4, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  shapeMini(ctx, pal) {
    ctx.fillStyle = pal.body
    ctx.beginPath()
    ctx.moveTo(0, 10)
    ctx.lineTo(7, -9)
    ctx.lineTo(0, -5)
    ctx.lineTo(-7, -9)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = pal.glow
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, 10)
    ctx.lineTo(0, -9)
    ctx.stroke()
  }

  shapeDiver(ctx, pal) {
    ctx.fillStyle = pal.body
    ctx.beginPath()
    ctx.moveTo(0, 15)
    ctx.lineTo(9, -10)
    ctx.lineTo(0, -6)
    ctx.lineTo(-9, -10)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = pal.glow
    ctx.beginPath()
    ctx.arc(0, 6, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  shapeSniper(ctx, en, pal) {
    ctx.fillStyle = pal.body
    ctx.beginPath()
    ctx.moveTo(0, 16)
    ctx.lineTo(7, 8)
    ctx.lineTo(15, -4)
    ctx.lineTo(15, -12)
    ctx.lineTo(0, -8)
    ctx.lineTo(-15, -12)
    ctx.lineTo(-15, -4)
    ctx.lineTo(-7, 8)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = pal.dark
    ctx.beginPath()
    ctx.arc(0, 0, 5, 0, Math.PI * 2)
    ctx.fill()
    if (en.state === 'aim' && en.charge > 0) {
      const a = 0.5 + Math.sin(this.t * 14) * 0.3
      ctx.strokeStyle = `rgba(248,113,113,${a})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 8 + (1.2 - en.charge) * 14, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  shapeTank(ctx, en, pal) {
    ctx.fillStyle = pal.body
    ctx.beginPath()
    ctx.moveTo(0, 22)
    ctx.lineTo(18, 14)
    ctx.lineTo(22, -6)
    ctx.lineTo(14, -18)
    ctx.lineTo(-14, -18)
    ctx.lineTo(-22, -6)
    ctx.lineTo(-18, 14)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = pal.dark
    ctx.beginPath()
    ctx.arc(0, 0, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(-12, -16, 24, 3)
    const w = (en.hp / en.maxHp) * 24
    ctx.fillStyle = pal.glow
    ctx.fillRect(-12, -16, w, 3)
  }

  drawBoss(ctx) {
    const e = this.engine
    const b = e.boss
    ctx.save()
    ctx.translate(b.x, b.y)
    if (b.flash > 0) {
      ctx.globalAlpha = Math.min(0.9, b.flash * 10)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(-46, -46, 92, 92)
      ctx.globalAlpha = 1
    }

    const pal = b.phase === 3 ? { body: '#f43f5e', dark: '#881337', glow: '#fda4af' }
      : b.phase === 2 ? { body: '#a855f7', dark: '#581c87', glow: '#d8b4fe' }
        : { body: '#6366f1', dark: '#312e81', glow: '#a5b4fc' }

    ctx.fillStyle = pal.dark
    ctx.beginPath()
    ctx.moveTo(0, -52)
    ctx.lineTo(40, -30)
    ctx.lineTo(44, 26)
    ctx.lineTo(30, 44)
    ctx.lineTo(-30, 44)
    ctx.lineTo(-44, 26)
    ctx.lineTo(-40, -30)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = pal.body
    ctx.beginPath()
    ctx.moveTo(0, -42)
    ctx.lineTo(32, -22)
    ctx.lineTo(34, 22)
    ctx.lineTo(20, 38)
    ctx.lineTo(-20, 38)
    ctx.lineTo(-34, 22)
    ctx.lineTo(-32, -22)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = pal.glow
    ctx.beginPath()
    ctx.arc(0, -6, 13, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.arc(0, -6, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = pal.dark
    ctx.fillRect(-30, 8, 8, 20)
    ctx.fillRect(22, 8, 8, 20)
    ctx.fillRect(-12, 18, 24, 6)

    const throb = 0.7 + Math.sin(this.t * 10) * 0.3
    ctx.fillStyle = `rgba(255,140,60,${throb})`
    ctx.beginPath()
    ctx.arc(-30, 22, 5, 0, Math.PI * 2)
    ctx.arc(30, 22, 5, 0, Math.PI * 2)
    ctx.fill()

    if (e.laser) {
      const L = e.laser
      const ang = L.aim + (L.state === 'fire' ? Math.sin(L.t * 1.6) * 0.55 : 0)
      ctx.save()
      ctx.translate(0, 70)
      ctx.rotate(ang)
      if (L.state === 'warn') {
        const a = 0.3 + Math.sin(this.t * 30) * 0.3
        ctx.strokeStyle = `rgba(248,113,113,${a})`
        ctx.lineWidth = 2
        ctx.setLineDash([10, 10])
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(0, 700)
        ctx.stroke()
        ctx.setLineDash([])
      } else {
        const fade = Math.min(1, L.t * 8)
        const gg = ctx.createLinearGradient(0, 0, 0, 700)
        gg.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`)
        gg.addColorStop(0.05, `rgba(255,60,90,${0.85 * fade})`)
        gg.addColorStop(1, `rgba(255,60,90,0)`)
        ctx.fillStyle = gg
        ctx.fillRect(-8, 0, 16, 700)
        ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`
        ctx.fillRect(-2.5, 0, 5, 700)
      }
      ctx.restore()
    }
    ctx.restore()
  }

  drawBossBar(ctx) {
    const e = this.engine
    const b = e.boss
    const w = 320
    const x = (FIELD_W - w) / 2
    const y = 22
    ctx.fillStyle = 'rgba(2,6,23,0.72)'
    ctx.fillRect(x - 4, y - 4, w + 8, 16)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(x, y, w, 8)
    const frac = Math.max(0, b.hp / b.maxHp)
    const hg = ctx.createLinearGradient(x, 0, x + w, 0)
    hg.addColorStop(0, '#f43f5e')
    hg.addColorStop(1, '#fb923c')
    ctx.fillStyle = hg
    ctx.fillRect(x, y, w * frac, 8)
    ctx.fillStyle = '#fda4af'
    ctx.font = 'bold 10px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(b.name, FIELD_W / 2, y - 8)
    if (frac < 0.25) {
      const a = 0.35 + Math.sin(this.t * 14) * 0.35
      ctx.strokeStyle = `rgba(244,63,94,${a})`
      ctx.lineWidth = 2
      ctx.strokeRect(x - 4, y - 4, w + 8, 16)
    }
  }

  drawPowerups(ctx) {
    const e = this.engine
    for (const g of e.powerups) {
      const pal = PUP_PAL[g.kind]
      const bob = Math.sin(this.t * 4 + g.t * 3) * 3
      ctx.save()
      ctx.translate(g.x, g.y + bob)
      ctx.fillStyle = pal.glow
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.arc(0, 0, 13, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.fillStyle = pal.body
      ctx.beginPath()
      if (g.kind === 'gem') {
        ctx.moveTo(0, -9)
        ctx.lineTo(9, 0)
        ctx.lineTo(0, 9)
        ctx.lineTo(-9, 0)
        ctx.closePath()
      } else {
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI / 3) * i + Math.PI / 6
          const r = i % 2 === 0 ? 10 : 6.5
          ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r)
        }
        ctx.closePath()
      }
      ctx.fill()
      ctx.fillStyle = '#0f172a'
      ctx.font = 'bold 9px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText({ gem: '', power: 'P', shield: 'S', bomb: 'B', life: '+' }[g.kind], 0, 1)
      ctx.restore()
    }
  }

  drawParticles(ctx) {
    for (const p of this.engine.particles.list) {
      const a = 1 - p.t / p.life
      if (p.type === 'ring') {
        ctx.globalAlpha = a * 0.8
        ctx.strokeStyle = p.color
        ctx.lineWidth = Math.max(0.5, 3 * a)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.stroke()
      } else if (p.type === 'flash') {
        ctx.globalAlpha = a * 0.85
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.type === 'streak') {
        ctx.globalAlpha = a
        ctx.strokeStyle = p.color
        ctx.lineWidth = Math.max(1, p.size * 0.22)
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03)
        ctx.stroke()
      } else if (p.type === 'text') {
        ctx.globalAlpha = Math.min(1, a * 1.6)
        ctx.font = `bold ${p.size}px system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.strokeStyle = 'rgba(2,6,23,0.85)'
        ctx.lineWidth = 3
        ctx.strokeText(p.str, p.x, p.y)
        ctx.fillStyle = p.color
        ctx.fillText(p.str, p.x, p.y)
      } else {
        ctx.globalAlpha = a * (p.opacity ?? 1)
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }
    }
    ctx.globalAlpha = 1
  }
}
