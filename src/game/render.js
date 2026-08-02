import { FIELD_W, FIELD_H, ENEMY_TYPES, ENEMY_PAL } from './constants.js'
import { buildSprites } from './sprites.js'

const SPRITE_SIZE = {
  player: [36, 44],
  grunt: [30, 30],
  weaver: [34, 32],
  mini: [22, 24],
  diver: [26, 34],
  sniper: [40, 34],
  tank: [50, 44],
  bullet: [16, 16],
  ebullet: [16, 16],
  boss1: [96, 92],
  boss2: [96, 92],
  boss3: [96, 92],
  pupPower: [30, 30],
  pupShield: [30, 30],
  pupBomb: [30, 30],
  pupLife: [30, 30],
  pupGem: [30, 30],
}

const NEBULA = [
  { x: 90, y: 170, r: 230, c: '99,102,241', s: 0.02, p: 0 },
  { x: 390, y: 420, r: 200, c: '168,85,247', s: 0.025, p: 1.3 },
  { x: 230, y: 560, r: 250, c: '34,211,238', s: 0.018, p: 2.6 },
]

export class Renderer {
  constructor(engine) {
    this.engine = engine
    this.sprites = buildSprites()
    this.stars = []
    for (let i = 0; i < 110; i++) {
      this.stars.push({
        x: Math.random() * FIELD_W,
        y: Math.random() * FIELD_H,
        s: Math.random() * 1.6 + 0.4,
        layer: Math.random() < 0.45 ? 1 : Math.random() < 0.5 ? 2 : 3,
        tw: Math.random() * Math.PI * 2,
        tws: 2 + Math.random() * 4,
      })
    }
    this.meteor = null
    this.meteorT = 4
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
      const dx = (Math.random() - 0.5) * e.shake + e.shakeDx * e.shake * 0.35
      const dy = (Math.random() - 0.5) * e.shake + e.shakeDy * e.shake * 0.35
      ctx.translate(dx, dy)
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

    if (e.phase === 'playing' && e.lives <= 1) {
      const a = 0.1 + Math.sin(this.t * 5) * 0.07
      const g = ctx.createRadialGradient(FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.32, FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.75)
      g.addColorStop(0, 'rgba(220,38,38,0)')
      g.addColorStop(1, `rgba(220,38,38,${Math.max(0, a)})`)
      ctx.fillStyle = g
      ctx.fillRect(-20, -20, FIELD_W + 40, FIELD_H + 40)
    }
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

  img(ctx, key, x, y, rot = 0, scale = 1) {
    const [w, h] = SPRITE_SIZE[key]
    const sw = w * scale
    const sh = h * scale
    ctx.save()
    ctx.translate(x, y)
    if (rot) ctx.rotate(rot)
    ctx.drawImage(this.sprites[key], -sw / 2, -sh / 2, sw, sh)
    ctx.restore()
  }

  drawBackground(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD_H)
    g.addColorStop(0, '#04070f')
    g.addColorStop(0.5, '#0a1024')
    g.addColorStop(1, '#140b26')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, FIELD_W, FIELD_H)

    for (const nb of NEBULA) {
      const cx = nb.x + Math.sin(this.t * nb.s * 6 + nb.p) * 14
      const cy = nb.y + Math.cos(this.t * nb.s * 5 + nb.p) * 10
      const a = 0.05 + Math.sin(this.t * nb.s + nb.p) * 0.012
      const ng = ctx.createRadialGradient(cx, cy, 10, cx, cy, nb.r)
      ng.addColorStop(0, `rgba(${nb.c},${Math.max(0.015, a)})`)
      ng.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = ng
      ctx.fillRect(cx - nb.r, cy - nb.r, nb.r * 2, nb.r * 2)
    }

    const speedMul = { 1: 24, 2: 58, 3: 105 }
    for (const st of this.stars) {
      st.y += speedMul[st.layer] * 0.016
      if (st.y > FIELD_H) {
        st.y = -2
        st.x = Math.random() * FIELD_W
      }
      const tw = 0.65 + Math.sin(this.t * st.tws + st.tw) * 0.35
      ctx.globalAlpha = (0.2 + st.layer * 0.2) * tw
      ctx.fillStyle = st.layer === 3 ? '#e2e8f0' : st.layer === 2 ? '#93c5fd' : '#475569'
      ctx.fillRect(st.x, st.y, st.s, st.s)
    }
    ctx.globalAlpha = 1

    this.meteorT -= 0.016
    if (this.meteorT <= 0) {
      this.meteorT = 4 + Math.random() * 5
      this.meteor = {
        x: Math.random() * FIELD_W * 0.8,
        y: -10 - Math.random() * 60,
        vx: 260 + Math.random() * 180,
        vy: 120 + Math.random() * 90,
        t: 0,
      }
    }
    if (this.meteor) {
      const m = this.meteor
      m.t += 0.016
      m.x += m.vx * 0.016
      m.y += m.vy * 0.016
      const a = Math.max(0, 1 - m.t / 1.3) * 0.7
      const lg = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.22, m.y - m.vy * 0.22)
      lg.addColorStop(0, `rgba(255,255,255,${a})`)
      lg.addColorStop(1, 'rgba(125,211,252,0)')
      ctx.strokeStyle = lg
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(m.x, m.y)
      ctx.lineTo(m.x - m.vx * 0.22, m.y - m.vy * 0.22)
      ctx.stroke()
      if (m.t >= 1.3 || m.x > FIELD_W + 40 || m.y > FIELD_H + 40) this.meteor = null
    }
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

  drawPlayer(ctx) {
    const e = this.engine
    const p = e.player
    if (p.invuln > 0 && Math.floor(this.t * 14) % 2 === 0) ctx.globalAlpha = 0.45
    ctx.save()
    ctx.translate(p.x, p.y)
    if (p.tilt) ctx.rotate(p.tilt)

    const L = 12 + Math.sin(this.t * 40) * 4 + Math.abs(p.tilt || 0) * 18
    ctx.fillStyle = 'rgba(255,120,40,0.85)'
    ctx.beginPath()
    ctx.moveTo(-5, 17)
    ctx.lineTo(0, 17 + L)
    ctx.lineTo(5, 17)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(255,210,120,0.95)'
    ctx.beginPath()
    ctx.moveTo(-2.6, 17)
    ctx.lineTo(0, 17 + L * 0.62)
    ctx.lineTo(2.6, 17)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fffbe6'
    ctx.beginPath()
    ctx.moveTo(-1.1, 17)
    ctx.lineTo(0, 17 + L * 0.3)
    ctx.lineTo(1.1, 17)
    ctx.closePath()
    ctx.fill()

    this.img(ctx, 'player', 0, 0)

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
      const rot = this.t * 1.6
      ctx.strokeStyle = p.shieldFlash > 0 ? '#ffffff' : '#38bdf8'
      ctx.globalAlpha = 0.5 + (p.shieldFlash > 0 ? 0.5 : Math.sin(this.t * 5) * 0.15)
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const ang = (Math.PI / 3) * i + rot
        const x = Math.cos(ang) * 22
        const y = Math.sin(ang) * 22
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
      const sg = ctx.createRadialGradient(0, 0, 6, 0, 0, 24)
      sg.addColorStop(0, 'rgba(56,189,248,0.16)')
      sg.addColorStop(1, 'rgba(56,189,248,0)')
      ctx.fillStyle = sg
      ctx.beginPath()
      ctx.arc(0, 0, 24, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    ctx.globalAlpha = 1
  }

  drawBullets(ctx) {
    const e = this.engine
    for (const b of e.bullets) {
      this.img(ctx, 'bullet', b.x, b.y, Math.atan2(b.vy, b.vx) + Math.PI / 2)
    }
  }

  drawEnemyBullets(ctx) {
    const e = this.engine
    for (const b of e.ebullets) {
      this.img(ctx, 'ebullet', b.x, b.y, Math.atan2(b.vy, b.vx) + Math.PI / 2)
    }
  }

  drawEnemies(ctx) {
    const e = this.engine
    for (const en of e.enemies) {
      const def = ENEMY_TYPES[en.type]
      const pulse = 1 + en.flash * 1.6
      ctx.save()
      ctx.translate(en.x, en.y)
      ctx.globalAlpha = en.y < 8 ? 0.3 + (en.y / 8) * 0.7 : 1
      this.img(ctx, en.type, 0, 0, 0, pulse)
      if (en.flash > 0) {
        ctx.globalAlpha = Math.min(1, en.flash * 10) * 0.7
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(0, 0, (def.r + 2) * pulse, 0, Math.PI * 2)
        ctx.fill()
      }
      if (en.type === 'sniper' && en.state === 'aim' && en.charge > 0) {
        const a = 0.5 + Math.sin(this.t * 14) * 0.3
        ctx.globalAlpha = 1
        ctx.strokeStyle = `rgba(248,113,113,${a})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(0, 0, 8 + (1.2 - en.charge) * 14, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (en.type === 'tank' && en.hp < en.maxHp) {
        ctx.globalAlpha = 1
        ctx.fillStyle = 'rgba(2,6,23,0.6)'
        ctx.fillRect(-13, 24, 26, 3)
        ctx.fillStyle = ENEMY_PAL.tank.glow
        ctx.fillRect(-13, 24, 26 * (en.hp / en.maxHp), 3)
      }
      ctx.restore()
      ctx.globalAlpha = 1
    }
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
    this.img(ctx, b.phase === 3 ? 'boss3' : b.phase === 2 ? 'boss2' : 'boss1', 0, 0)

    const throb = 0.7 + Math.sin(this.t * 10) * 0.3
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = `rgba(255,140,60,${throb * 0.8})`
    ctx.beginPath()
    ctx.arc(-30, 22, 6, 0, Math.PI * 2)
    ctx.arc(30, 22, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

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
        ctx.globalCompositeOperation = 'lighter'
        ctx.fillStyle = gg
        ctx.fillRect(-8, 0, 16, 700)
        ctx.fillStyle = `rgba(255,255,255,${0.9 * fade})`
        ctx.fillRect(-2.5, 0, 5, 700)
        ctx.globalCompositeOperation = 'source-over'
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
    const key = {
      gem: 'pupGem',
      power: 'pupPower',
      shield: 'pupShield',
      bomb: 'pupBomb',
      life: 'pupLife',
    }
    for (const g of e.powerups) {
      const bob = Math.sin(this.t * 4 + g.t * 3) * 3
      this.img(ctx, key[g.kind], g.x, g.y + bob, this.t * 1.4 + g.t * 2)
    }
  }

  drawParticles(ctx) {
    const list = this.engine.particles.list
    for (const p of list) {
      const a = 1 - p.t / p.life
      if (p.type === 'dot') {
        ctx.globalAlpha = a * (p.opacity ?? 1)
        ctx.fillStyle = p.color
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
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
      }
    }
    ctx.globalCompositeOperation = 'lighter'
    for (const p of list) {
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
      }
    }
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }
}
