import {
  FIELD_W, FIELD_H,
  PLAYER_RADIUS, PLAYER_SPEED, PLAYER_FIRE, PLAYER_BULLET_SPEED,
  MAX_POWER, START_LIVES, MAX_LIVES, START_BOMBS, MAX_BOMBS,
  EXTRA_LIFE_EVERY, COMBO_TIMEOUT,
  POWERUP_DROP, ENEMY_TYPES, ENEMY_PAL, DIFFICULTIES, BUFFS, BOSS_HP, BOSS_WAVES,
  HIGH_KEY, TOP5_KEY,
} from './constants.js'
import { ParticleSystem } from './particles.js'
import { audio } from './audio.js'

function loadNum(key, fallback) {
  try {
    return Number(localStorage.getItem(key) ?? fallback)
  } catch {
    return fallback
  }
}

function loadTop5() {
  try {
    const arr = JSON.parse(localStorage.getItem(TOP5_KEY) || '[]')
    return Array.isArray(arr) ? arr.slice(0, 5) : []
  } catch {
    return []
  }
}

function storeTop5(list) {
  try {
    localStorage.setItem(TOP5_KEY, JSON.stringify(list.slice(0, 5)))
  } catch {
    /* storage unavailable */
  }
}

function saveTop5(list) {
  const entry = { s: list[0]?.s ?? 0, w: list[0]?.w ?? 0, t: list[0]?.t ?? 0 }
  const arr = loadTop5()
  arr.push(entry)
  arr.sort((a, b) => b.s - a.s)
  storeTop5(arr)
  return arr
}

function rand(a, b) {
  return a + Math.random() * (b - a)
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function circ(a, b, ar, br) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const r = ar + br
  return dx * dx + dy * dy < r * r
}

function pointInRotatedRect(px, py, cx, cy, w, h, ang) {
  const dx = px - cx
  const dy = py - cy
  const cos = Math.cos(-ang)
  const sin = Math.sin(-ang)
  const lx = dx * cos - dy * sin
  const ly = dx * sin + dy * cos
  return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2
}

export class Engine {
  constructor() {
    this.input = { up: false, down: false, left: false, right: false, fire: false }
    this.pointer = { active: false, x: 0, y: 0, ox: 0, oy: 0, isTouch: false }
    this.phase = 'menu'
    this.difficulty = 'normal'
    this.onPhase = null
    this.scale = 1
    this.dpr = 1
    this.ox = 0
    this.oy = 0
    this.lastT = 0
    this.high = loadNum(HIGH_KEY, 0)
    this.top5 = loadTop5()
    this.reset()
  }

  get diff() {
    return DIFFICULTIES[this.difficulty]
  }

  reset() {
    this.score = 0
    this.lives = START_LIVES
    this.bombs = START_BOMBS
    this.power = 1
    this.shield = 0
    this.speedMul = 1
    this.scoreMul = 1
    this.magnetLv = 0
    this.wave = 0
    this.endless = false
    this.timeSec = 0
    this.kills = 0
    this.streak = 0
    this.comboT = 0
    this.nextLifeAt = EXTRA_LIFE_EVERY
    this.shake = 0
    this.shakeDx = 0
    this.shakeDy = 0
    this.hitStop = 0
    this.flash = 0
    this.hurtFlash = 0
    this.slowmo = 0
    this.bannerWave = 0
    this.bannerT = 0
    this.upgradeChoices = []
    this.spawnQueue = []
    this.boss = null
    this.bossTimer = 0
    this.laser = null
    this.player = { x: FIELD_W / 2, y: FIELD_H - 90, fireT: 0, invuln: 2, shieldFlash: 0, muzzle: 0, tilt: 0 }
    this.bullets = []
    this.ebullets = []
    this.enemies = []
    this.powerups = []
    this.particles = new ParticleSystem()
    this.demoT = 0
  }

  startGame(diff) {
    this.difficulty = DIFFICULTIES[diff] ? diff : 'normal'
    this.reset()
    this.wave = 0
    this.endless = false
    this.nextWave()
    this.setPhase('playing')
    audio.play('click')
  }

  continueEndless() {
    this.endless = true
    this.bombs = Math.max(this.bombs, 1)
    this.player.invuln = 1.5
    this.nextWave()
    this.setPhase('playing')
    audio.play('click')
  }

  togglePause() {
    if (this.phase === 'playing') this.setPhase('paused')
    else if (this.phase === 'paused') this.setPhase('playing')
  }

  pointerDown(x, y, isTouch) {
    this.pointer.isTouch = isTouch
    this.pointer.ox = this.player.x - x
    this.pointer.oy = this.player.y - y
    this.pointer.x = x
    this.pointer.y = y
    this.pointer.active = true
  }

  pointerMove(x, y) {
    this.pointer.x = x
    this.pointer.y = y
  }

  pointerUp() {
    this.pointer.active = false
  }

  vibrate(pattern) {
    try { navigator.vibrate?.(pattern) } catch { /* noop */ }
  }

  addShake(mag, ang = null) {
    this.shake = Math.max(this.shake, mag)
    if (ang !== null) {
      this.shakeDx = Math.cos(ang)
      this.shakeDy = Math.sin(ang)
    }
  }

  setPhase(p) {
    if (this.phase === p) return
    this.phase = p
    if (this.onPhase) this.onPhase(p)
  }

  startDemo() {
    this.reset()
    this.setPhase('menu')
  }

  applyBuff(id) {
    const b = this.buffsApplied || (this.buffsApplied = new Set())
    b.add(id)
    switch (id) {
      case 'power':
        this.power = Math.min(MAX_POWER, this.power + 1)
        break
      case 'shield':
        this.shield += 2
        break
      case 'speed':
        this.speedMul *= 1.14
        break
      case 'double':
        this.scoreMul *= 2
        break
      case 'magnet':
        this.magnetLv = Math.min(2, this.magnetLv + 1)
        break
      case 'bomb':
        this.bombs = Math.min(MAX_BOMBS, this.bombs + 1)
        break
      default:
        break
    }
    audio.play('powerup')
    this.nextWave()
    this.setPhase('playing')
  }

  nextWave() {
    this.wave += 1
    const isBoss = BOSS_WAVES.has(this.wave) && !this.endless
    this.spawnQueue = this.buildQueue(this.wave)
    this.spawnT = 0
    this.boss = null
    this.bossTimer = isBoss ? 1.4 : 0
    this.laser = null
    this.bannerWave = this.wave
    this.bannerT = 2
    if (isBoss) audio.play('alert')
  }

  buildQueue(wave) {
    const q = []
    let t = 0.6
    const add = (type, x, dt = 0.5) => {
      q.push({ t, type, x })
      t += dt
    }
    const waveDefs = {
      1: () => { for (let i = 0; i < 10; i++) add('grunt', rand(30, FIELD_W - 30), 0.55) },
      2: () => {
        for (let i = 0; i < 6; i++) add('grunt', rand(30, FIELD_W - 30), 0.5)
        for (let i = 0; i < 5; i++) add('weaver', rand(30, FIELD_W - 30), 0.6)
        for (let i = 0; i < 4; i++) add('mini', rand(30, FIELD_W - 30), 0.45)
      },
      3: () => {
        for (let i = 0; i < 6; i++) add('grunt', 40 + i * 74, 0.35)
        for (let i = 0; i < 5; i++) add('weaver', rand(30, FIELD_W - 30), 0.55)
        for (let i = 0; i < 3; i++) add('diver', rand(30, FIELD_W - 30), 0.7)
        for (let i = 0; i < 5; i++) add('mini', rand(30, FIELD_W - 30), 0.4)
      },
      4: () => {
        for (let i = 0; i < 4; i++) add('sniper', rand(60, FIELD_W - 60), 1.0)
        for (let i = 0; i < 6; i++) add('weaver', rand(30, FIELD_W - 30), 0.5)
        for (let i = 0; i < 4; i++) add('diver', rand(30, FIELD_W - 30), 0.65)
        for (let i = 0; i < 4; i++) add('grunt', rand(30, FIELD_W - 30), 0.4)
      },
      5: () => {
        for (let i = 0; i < 4; i++) add('mini', rand(30, FIELD_W - 30), 0.5)
      },
      6: () => {
        for (let i = 0; i < 3; i++) add('tank', rand(80, FIELD_W - 80), 2.4)
        for (let i = 0; i < 4; i++) add('sniper', rand(60, FIELD_W - 60), 1.1)
        for (let i = 0; i < 6; i++) add('weaver', rand(30, FIELD_W - 30), 0.5)
        for (let i = 0; i < 5; i++) add('mini', rand(30, FIELD_W - 30), 0.4)
      },
      7: () => {
        for (let i = 0; i < 4; i++) add('tank', rand(80, FIELD_W - 80), 2.2)
        for (let i = 0; i < 5; i++) add('diver', rand(30, FIELD_W - 30), 0.55)
        for (let i = 0; i < 3; i++) add('sniper', rand(60, FIELD_W - 60), 1.2)
        for (let i = 0; i < 6; i++) add('grunt', rand(30, FIELD_W - 30), 0.35)
      },
      8: () => {
        for (let i = 0; i < 5; i++) add('tank', rand(80, FIELD_W - 80), 2.0)
        for (let i = 0; i < 6; i++) add('sniper', rand(60, FIELD_W - 60), 0.9)
        for (let i = 0; i < 8; i++) add('mini', rand(30, FIELD_W - 30), 0.35)
        for (let i = 0; i < 5; i++) add('weaver', rand(30, FIELD_W - 30), 0.45)
      },
      9: () => {
        for (let i = 0; i < 6; i++) add('tank', rand(80, FIELD_W - 80), 1.8)
        for (let i = 0; i < 6; i++) add('diver', rand(30, FIELD_W - 30), 0.5)
        for (let i = 0; i < 4; i++) add('sniper', rand(60, FIELD_W - 60), 1.0)
        for (let i = 0; i < 8; i++) add('mini', rand(30, FIELD_W - 30), 0.3)
      },
      10: () => {
        for (let i = 0; i < 3; i++) add('tank', rand(80, FIELD_W - 80), 1.6)
      },
    }
    if (waveDefs[wave]) {
      waveDefs[wave]()
    } else {
      const n = Math.min(30, 10 + (wave - 10) * 2)
      const pool = ['grunt', 'weaver', 'mini', 'diver']
      if (wave >= 12) pool.push('sniper')
      if (wave >= 14) pool.push('tank')
      for (let i = 0; i < n; i++) add(pick(pool), rand(30, FIELD_W - 30), 0.5)
    }
    return q
  }

  spawnEnemy(type, x) {
    const def = ENEMY_TYPES[type]
    const hp = Math.max(1, Math.round(def.hp * this.diff.hpMul))
    this.enemies.push({
      type,
      x,
      y: -30,
      vx: 0,
      vy: def.speed * this.diff.enemySpeedMul,
      hp,
      maxHp: hp,
      t: 0,
      fireT: rand(0.6, 1.4),
      baseX: x,
      phase: rand(0, Math.PI * 2),
      amp: rand(26, 46),
      state: 'in',
      targetY: rand(120, 190),
      charge: 0,
      volleys: 0,
      flash: 0,
    })
  }

  spawnBoss() {
    const wave = this.wave
    const maxHp = Math.round((wave === 10 ? BOSS_HP.wave10 : BOSS_HP.wave5) * this.diff.hpMul)
    this.boss = {
      x: FIELD_W / 2,
      y: -90,
      vy: 0,
      hp: maxHp,
      maxHp,
      t: 0,
      fireT: 1.2,
      laserT: 0,
      summonT: 4,
      phase: 1,
      flash: 0,
      name: wave === 10 ? '深渊主舰 · 最终形态' : '重型巡洋舰 · 塞壬',
    }
  }

  firePlayerBullets() {
    const p = this.player
    const sp = PLAYER_BULLET_SPEED
    const x = p.x
    const y = p.y - 20
    const add = (dx, ang) => this.bullets.push({ x, y, vx: Math.sin(ang) * sp, vy: -Math.cos(ang) * sp, r: 5, dmg: 1 })
    switch (this.power) {
      case 1: add(0, 0); break
      case 2: add(-8, 0); add(8, 0); break
      case 3: add(0, 0); add(0, -0.14); add(0, 0.14); break
      case 4: add(-8, 0); add(8, 0); add(0, -0.16); add(0, 0.16); break
      default: add(0, 0); add(-8, -0.1); add(8, 0.1); add(0, -0.22); add(0, 0.22); break
    }
    p.muzzle = 0.06
    this.particles.flash(x, y - 22, '#fff7cc', 26, 0.14)
    audio.play('shoot', 0.08)
  }

  fireEnemyBullet(x, y, ang, speed) {
    this.ebullets.push({
      x, y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: 5,
    })
  }

  dropPowerup(x, y) {
    const roll = Math.random()
    let kind = 'gem'
    let acc = 0
    for (const [k, w] of Object.entries(POWERUP_DROP)) {
      acc += w
      if (roll < acc) { kind = k; break }
    }
    this.powerups.push({ x, y, vy: 92, kind, t: 0 })
  }

  addScore(base) {
    this.score += Math.round(base * this.scoreMul * this.mult())
    if (this.score >= this.nextLifeAt) {
      this.nextLifeAt += EXTRA_LIFE_EVERY
      if (this.lives < MAX_LIVES) {
        this.lives += 1
        audio.play('life')
      }
    }
  }

  mult() {
    return Math.min(5, 1 + Math.floor(this.streak / 5))
  }

  burstVisuals(x, y, type) {
    const pal = ENEMY_PAL[type] || ENEMY_PAL.grunt
    this.particles.flash(x, y, pal.glow, 64, 0.28)
    this.particles.shockwave(x, y, pal.glow, 84, 0.4)
    this.particles.debris(x, y, [pal.glow, pal.body, '#ffd166', '#fff3b0'], 16, 210)
  }

  killEnemy(e, byBomb, ang = null) {
    const idx = this.enemies.indexOf(e)
    if (idx === -1) return
    this.enemies.splice(idx, 1)
    this.kills += 1
    if (!byBomb) {
      this.streak += 1
      this.comboT = COMBO_TIMEOUT
    }
    const def = ENEMY_TYPES[e.type]
    const gained = Math.round(def.score * this.scoreMul * this.mult())
    this.addScore(def.score)
    this.dropPowerup(e.x, e.y)
    const isTank = e.type === 'tank'
    this.burstVisuals(e.x, e.y, e.type)
    if (isTank) {
      this.particles.flash(e.x, e.y, '#86efac', 110, 0.32)
      this.particles.shockwave(e.x, e.y, '#86efac', 130, 0.5)
      this.particles.debris(e.x, e.y, ['#4ade80', '#86efac', '#ffd166', '#fff3b0'], 24, 280)
      this.particles.smoke(e.x, e.y, 8)
    }
    if (!byBomb) {
      this.particles.text(e.x, e.y - 12, `+${gained}`, isTank ? '#86efac' : '#ffe08a', isTank ? 16 : 13)
      if (this.streak > 0 && this.streak % 5 === 0) {
        this.particles.text(this.player.x, this.player.y - 36, `连击 x${this.mult()}！`, '#fbbf24', 16)
        this.particles.shockwave(this.player.x, this.player.y, '#fbbf24', 60, 0.4)
        audio.play('combo')
      }
    }
    this.addShake(isTank ? 11 : 6, ang)
    this.hitStop = Math.max(this.hitStop, isTank ? 0.06 : 0.035)
    audio.play('explode')
  }

  damageBoss(dmg, ang = null) {
    const b = this.boss
    if (!b) return
    b.hp -= dmg
    b.flash = 0.09
    this.addShake(3, ang)
    this.particles.spark(b.x + rand(-28, 28), b.y + rand(-20, 26), Math.PI / 2 + rand(-0.6, 0.6))
    audio.play('hit')
    if (b.hp <= 0) {
      this.boss = null
      this.laser = null
      this.particles.explode(b.x, b.y, 120)
      this.particles.explode(b.x - 40, b.y, 60)
      this.particles.explode(b.x + 40, b.y, 60)
      this.particles.flash(b.x, b.y, '#fda4af', 150, 0.4)
      this.particles.shockwave(b.x, b.y, '#fda4af', 200, 0.6)
      this.particles.shockwave(b.x, b.y, '#fb923c', 120, 0.75)
      this.particles.debris(b.x, b.y, ['#f43f5e', '#fda4af', '#fb923c', '#fff3b0'], 40, 320)
      this.particles.smoke(b.x, b.y, 12)
      const base = this.wave === 10 ? 20000 : 10000
      this.particles.text(b.x, b.y - 30, `+${Math.round(base * this.scoreMul * this.mult())}`, '#fda4af', 20)
      this.addShake(24, ang)
      this.hitStop = Math.max(this.hitStop, 0.12)
      this.slowmo = Math.max(this.slowmo, 0.5)
      this.vibrate([60, 50, 120])
      this.addScore(base)
      audio.play('big')
    }
  }

  useBomb() {
    if (this.phase !== 'playing' || this.bombs <= 0) return
    this.bombs -= 1
    this.flash = 0.55
    this.addShake(18)
    this.hitStop = Math.max(this.hitStop, 0.08)
    this.slowmo = Math.max(this.slowmo, 0.15)
    this.particles.flash(this.player.x, this.player.y, '#ffffff', 170, 0.35)
    this.particles.ring(this.player.x, this.player.y)
    this.particles.shockwave(this.player.x, this.player.y, '#ffe08a', 260, 0.7)
    this.vibrate(40)
    for (let i = 0; i < this.ebullets.length; i++) this.score += Math.round(20 * this.scoreMul)
    this.ebullets.length = 0
    for (const e of [...this.enemies]) {
      e.hp -= 8
      if (e.hp <= 0) this.killEnemy(e, true)
    }
    if (this.boss) this.damageBoss(40)
    audio.play('bomb')
  }

  hitPlayer(ang = null) {
    const p = this.player
    if (p.invuln > 0) return
    if (this.shield > 0) {
      this.shield -= 1
      p.invuln = 1.5
      p.shieldFlash = 0.35
      this.addShake(8, ang)
      this.hitStop = Math.max(this.hitStop, 0.03)
      this.hurtFlash = Math.max(this.hurtFlash, 0.3)
      this.particles.flash(p.x, p.y, '#7dd3fc', 70, 0.3)
      this.particles.shockwave(p.x, p.y, '#7dd3fc', 100, 0.45)
      this.particles.debris(p.x, p.y, ['#7dd3fc', '#38bdf8'], 10, 170)
      this.vibrate(60)
      audio.play('shieldHit')
      return
    }
    this.lives -= 1
    p.invuln = 2.4
    this.addShake(18, ang)
    this.hitStop = Math.max(this.hitStop, 0.12)
    this.flash = Math.max(this.flash, 0.3)
    this.hurtFlash = 1
    this.slowmo = Math.max(this.slowmo, 0.6)
    this.particles.explode(p.x, p.y, 50)
    this.particles.flash(p.x, p.y, '#ff8c42', 140, 0.4)
    this.particles.shockwave(p.x, p.y, '#fda4af', 170, 0.55)
    this.particles.debris(p.x, p.y, ['#38bdf8', '#7dd3fc', '#fda4af', '#f472b6', '#fff3b0'], 26, 300)
    this.particles.smoke(p.x, p.y, 10)
    this.vibrate([90, 60, 160])
    this.power = Math.max(1, this.power - 1)
    audio.play('explode')
    if (this.lives <= 0) {
      if (this.score > this.high) {
        this.high = this.score
        try { localStorage.setItem(HIGH_KEY, String(this.score)) } catch { /* noop */ }
      }
      this.top5 = saveTop5([{ s: this.score, w: this.wave, t: this.endless }])
      audio.play('gameover')
      this.setPhase('over')
    }
  }

  updatePlayer(dt) {
    const p = this.player
    const sp = PLAYER_SPEED * this.speedMul
    const prevX = p.x
    if (this.pointer.active) {
      p.x = this.pointer.x + this.pointer.ox
      p.y = this.pointer.y + this.pointer.oy
    } else {
      let mx = 0
      let my = 0
      if (this.input.left) mx -= 1
      if (this.input.right) mx += 1
      if (this.input.up) my -= 1
      if (this.input.down) my += 1
      if (mx || my) {
        const d = Math.hypot(mx, my)
        p.x += (mx / d) * sp * dt
        p.y += (my / d) * sp * dt
      }
    }
    p.x = Math.max(20, Math.min(FIELD_W - 20, p.x))
    p.y = Math.max(24, Math.min(FIELD_H - 24, p.y))
    const targetTilt = Math.max(-0.3, Math.min(0.3, (p.x - prevX) * 0.015))
    p.tilt += (targetTilt - p.tilt) * Math.min(1, dt * 12)
    if (p.invuln > 0) p.invuln -= dt
    if (p.muzzle > 0) p.muzzle -= dt
    if (p.shieldFlash > 0) p.shieldFlash -= dt

    p.fireT -= dt
    const wantFire = this.input.fire || this.pointer.active
    if (this.phase === 'playing' && wantFire && p.fireT <= 0) {
      p.fireT = PLAYER_FIRE[this.power - 1]
      this.firePlayerBullets()
    }

    if (this.phase === 'playing' && this.timeSec > 1) {
      this.particles.trail(p.x, p.y, 0.03)
    }
  }

  updateMenu(dt) {
    this.demoT += dt
    const p = this.player
    p.x = FIELD_W / 2 + Math.sin(this.demoT * 0.5) * 120
    p.y = FIELD_H * 0.68 + Math.sin(this.demoT * 1.3) * 40
    p.fireT = 0
    this.particles.trail(p.x, p.y, 0.05)
    if (this.demoT > 0.5) {
      this.demoT = 0
      this.bullets.push({ x: p.x, y: p.y - 20, vx: 0, vy: -PLAYER_BULLET_SPEED, r: 5, dmg: 1 })
    }
  }

  updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]
      b.x += b.vx * dt
      b.y += b.vy * dt
      if (b.y < -20 || b.y > FIELD_H + 20 || b.x < -20 || b.x > FIELD_W + 20) {
        this.bullets.splice(i, 1)
        continue
      }
      if (this.boss && circ(b, this.boss, b.r, 34)) {
        this.bullets.splice(i, 1)
        this.damageBoss(b.dmg, Math.atan2(b.vy, b.vx))
        continue
      }
      let hit = false
      for (const e of this.enemies) {
        if (circ(b, e, b.r, ENEMY_TYPES[e.type].r)) {
          hit = true
          e.hp -= b.dmg
          e.flash = 0.08
          const ang = Math.atan2(b.vy, b.vx)
          this.particles.spark(b.x, b.y, ang)
          if (e.maxHp > 1 && e.hp > 0) {
            this.particles.damage(b.x + rand(-5, 5), b.y - 8, b.dmg)
          }
          audio.play('enemyHit')
          if (e.hp <= 0) this.killEnemy(e, false, ang)
          break
        }
      }
      if (hit) this.bullets.splice(i, 1)
    }
    for (let i = this.ebullets.length - 1; i >= 0; i--) {
      const b = this.ebullets[i]
      b.x += b.vx * dt
      b.y += b.vy * dt
      if (b.y > FIELD_H + 24 || b.y < -24 || b.x < -24 || b.x > FIELD_W + 24) {
        this.ebullets.splice(i, 1)
        continue
      }
      if (this.phase === 'playing' && circ(b, this.player, b.r, PLAYER_RADIUS)) {
        this.ebullets.splice(i, 1)
        this.hitPlayer(Math.atan2(b.vy, b.vx))
      }
    }
  }

  updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      const def = ENEMY_TYPES[e.type]
      e.t += dt
      e.y += e.vy * dt
      if (e.flash > 0) e.flash -= dt

      switch (e.type) {
        case 'grunt':
          if (e.y > 30 && Math.random() < 0.0015) {
            this.fireEnemyBullet(e.x, e.y, Math.PI / 2, 210)
          }
          break
        case 'weaver':
          e.x = e.baseX + Math.sin(e.t * 2.4 + e.phase) * e.amp
          e.x = Math.max(20, Math.min(FIELD_W - 20, e.x))
          if (e.y > 40) {
            e.fireT -= dt
            if (e.fireT <= 0) {
              e.fireT = def.fireRate / this.diff.fireMul
              const ang = Math.PI / 2
              this.particles.flash(e.x, e.y, '#d8b4fe', 18, 0.18)
              this.fireEnemyBullet(e.x, e.y, ang - 0.3, 170)
              this.fireEnemyBullet(e.x, e.y, ang + 0.3, 170)
            }
          }
          break
        case 'mini':
          e.x += Math.sin(e.t * 6) * 60 * dt
          break
        case 'diver':
          if (e.state === 'in' && e.y >= e.targetY) {
            e.state = 'dive'
            const ang = Math.atan2(this.player.y - e.y, this.player.x - e.x)
            e.vx = Math.cos(ang) * 340
            e.vy = Math.sin(ang) * 340
          }
          if (e.state === 'dive') {
            e.x += e.vx * dt
            e.y += e.vy * dt
          }
          break
        case 'sniper':
          if (e.state === 'in' && e.y >= e.targetY) {
            e.state = 'aim'
            e.vy = 0
            e.volleys = 0
          }
          if (e.state === 'aim') {
            e.charge -= dt
            if (e.charge <= 0 && e.volleys < 3) {
              e.volleys += 1
              e.charge = def.fireRate / this.diff.fireMul
              const ang = Math.atan2(this.player.y - e.y, this.player.x - e.x)
              this.particles.flash(e.x, e.y, '#7dd3fc', 22, 0.2)
              for (let k = -2; k <= 2; k++) {
                this.fireEnemyBullet(e.x, e.y, ang + k * 0.16, 250)
              }
              audio.play('enemyShoot')
            }
            if (e.volleys >= 3 && e.charge <= 0) {
              e.state = 'out'
              e.vy = 240
            }
          }
          break
        case 'tank':
          if (e.y > 40) {
            e.fireT -= dt
            if (e.fireT <= 0) {
              e.fireT = def.fireRate / this.diff.fireMul
              const ang = Math.PI / 2
              this.particles.flash(e.x, e.y, '#86efac', 24, 0.2)
              this.fireEnemyBullet(e.x, e.y, ang - 0.35, 185)
              this.fireEnemyBullet(e.x, e.y, ang, 185)
              this.fireEnemyBullet(e.x, e.y, ang + 0.35, 185)
              audio.play('enemyShoot')
            }
          }
          break
        default:
          break
      }

      if (e.y > FIELD_H + 40) {
        this.enemies.splice(i, 1)
        continue
      }
      if (this.phase === 'playing' && circ(e, this.player, def.r, PLAYER_RADIUS)) {
        this.enemies.splice(i, 1)
        this.burstVisuals(e.x, e.y, e.type)
        this.addScore(def.score)
        this.hitPlayer(Math.atan2(this.player.y - e.y, this.player.x - e.x))
      }
    }
  }

  updateBoss(dt) {
    const b = this.boss
    if (!b) return
    b.t += dt
    if (b.flash > 0) b.flash -= dt

    if (b.y < 130) {
      b.vy += 260 * dt
      b.y += b.vy * dt
      if (b.y >= 130) b.y = 130
      return
    }

    const hpFrac = b.hp / b.maxHp
    const phase = hpFrac > 0.66 ? 1 : hpFrac > 0.33 ? 2 : 3
    if (phase !== b.phase) {
      b.phase = phase
      this.particles.explode(b.x, b.y, 40)
      audio.play('big')
    }

    b.x += Math.sin(b.t * 0.5) * 40 * dt
    b.x = Math.max(70, Math.min(FIELD_W - 70, b.x))

    if (phase === 1) {
      b.fireT -= dt
      if (b.fireT <= 0) {
        b.fireT = 1.7
        const n = 14
        const base = b.t * 0.5
        for (let i = 0; i < n; i++) {
          const ang = (Math.PI * 2 * i) / n + base
          this.fireEnemyBullet(b.x, b.y, ang, 150)
        }
        audio.play('enemyShoot')
      }
      if (b.t % 0.9 < dt) {
        const ang = Math.atan2(this.player.y - b.y, this.player.x - b.x)
        this.fireEnemyBullet(b.x, b.y, ang, 240)
      }
    } else if (phase === 2) {
      if (b.t % 0.1 < dt) {
        const spin = b.t * 1.4
        this.fireEnemyBullet(b.x, b.y, spin, 190)
        this.fireEnemyBullet(b.x, b.y, spin + Math.PI, 190)
      }
      b.fireT -= dt
      if (b.fireT <= 0) {
        b.fireT = 0.85
        const ang = Math.atan2(this.player.y - b.y, this.player.x - b.x)
        for (let k = -1; k <= 1; k++) this.fireEnemyBullet(b.x, b.y, ang + k * 0.18, 260)
      }
      b.summonT -= dt
      if (b.summonT <= 0) {
        b.summonT = 8
        this.spawnEnemy('weaver', rand(40, FIELD_W - 40))
        this.spawnEnemy('weaver', rand(40, FIELD_W - 40))
        audio.play('alert')
      }
    } else {
      if (!this.laser) {
        if (b.laserT <= 0) {
          const aim = Math.atan2(this.player.y - b.y, this.player.x - b.x)
          this.laser = { t: 0, state: 'warn', aim, dur: 0.9, fired: false, hitPlayer: false }
          b.laserT = 3.2
        }
      }
      if (this.laser) {
        const L = this.laser
        L.t += dt
        if (L.state === 'warn' && L.t >= L.dur) {
          L.state = 'fire'
          L.t = 0
          L.fireT = 1.4
          audio.play('laser')
        } else if (L.state === 'fire' && L.t >= L.fireT) {
          this.laser = null
        }
        if (L.state === 'fire') {
          const sweep = Math.sin(L.t * 1.6) * 0.55
          const ang = L.aim + sweep
          const p = this.player
          if (pointInRotatedRect(p.x, p.y, b.x, b.y + 70, 14, 700, ang)) {
            if (!L.hitPlayer) {
              L.hitPlayer = true
              this.hitPlayer()
            }
          }
        }
      }
      if (b.t % 0.6 < dt) {
        const n = 24
        const base = b.t * 0.9
        for (let i = 0; i < n; i++) {
          const ang = (Math.PI * 2 * i) / n + base
          this.fireEnemyBullet(b.x, b.y, ang, 170)
        }
      }
      b.fireT -= dt
      if (b.fireT <= 0) {
        b.fireT = 0.55
        const ang = Math.atan2(this.player.y - b.y, this.player.x - b.x)
        for (let k = -1; k <= 1; k++) this.fireEnemyBullet(b.x, b.y, ang + k * 0.2, 290)
      }
    }
  }

  updatePowerups(dt) {
    const magnetR = this.magnetLv > 0 ? 130 + this.magnetLv * 40 : 48
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const g = this.powerups[i]
      g.t += dt
      const p = this.player
      const dx = p.x - g.x
      const dy = p.y - g.y
      const d = Math.hypot(dx, dy)
      if (d < magnetR && d > 1) {
        g.x += (dx / d) * 320 * dt
        g.y += (dy / d) * 320 * dt
      } else {
        g.y += g.vy * dt
      }
      if (g.y > FIELD_H + 30) {
        this.powerups.splice(i, 1)
        continue
      }
      if (this.phase === 'playing' && d < 26) {
        this.powerups.splice(i, 1)
        this.collect(g)
      }
    }
  }

  collect(g) {
    const p = this.player
    switch (g.kind) {
      case 'gem': {
        const gained = Math.round(120 * this.scoreMul)
        this.score += gained
        this.particles.text(p.x, p.y - 30, `+${gained}`, '#34d399', 12)
        break
      }
      case 'power':
        this.power = Math.min(MAX_POWER, this.power + 1)
        this.particles.text(p.x, p.y - 30, '火力 +1', '#f87171', 13)
        audio.play('powerup')
        break
      case 'shield':
        this.shield = Math.min(3, this.shield + 1)
        this.particles.text(p.x, p.y - 30, '护盾 +1', '#60a5fa', 13)
        audio.play('shield')
        break
      case 'bomb':
        this.bombs = Math.min(MAX_BOMBS, this.bombs + 1)
        this.particles.text(p.x, p.y - 30, '炸弹 +1', '#fb923c', 13)
        audio.play('powerup')
        break
      case 'life':
        if (this.lives < MAX_LIVES) {
          this.lives += 1
          this.particles.text(p.x, p.y - 30, '生命 +1', '#f472b6', 14)
        } else {
          this.score += 2000
          this.particles.text(p.x, p.y - 30, '+2000', '#f472b6', 13)
        }
        audio.play('life')
        break
      default:
        break
    }
    this.particles.gem(p.x, p.y)
  }

  updateSpawn() {
    while (this.spawnQueue.length > 0 && this.spawnQueue[0].t <= this.timeSec) {
      const s = this.spawnQueue.shift()
      this.spawnEnemy(s.type, s.x)
    }
  }

  checkWaveEnd() {
    if (this.phase !== 'playing') return
    if (this.spawnQueue.length > 0) return
    if (this.enemies.length > 0) return
    if (this.boss) return
    if (this.bossTimer > 0) return
    if (this.wave === 10 && !this.endless) {
      if (this.score > this.high) {
        this.high = this.score
        try { localStorage.setItem(HIGH_KEY, String(this.score)) } catch { /* noop */ }
      }
      this.top5 = saveTop5([{ s: this.score, w: this.wave, t: this.endless }])
      audio.play('victory')
      this.setPhase('victory')
      return
    }
    if (this.wave !== 1) {
      const pool = shuffle(Object.keys(BUFFS))
      this.upgradeChoices = pool.slice(0, 3).map((id) => ({ id, ...BUFFS[id] }))
      this.setPhase('upgrade')
      return
    }
    this.nextWave()
  }

  keydown(code) {
    const k = this.mapKey(code)
    if (k) this.input[k] = true
  }

  keyup(code) {
    const k = this.mapKey(code)
    if (k) this.input[k] = false
  }

  mapKey(code) {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        return 'left'
      case 'ArrowRight':
      case 'KeyD':
        return 'right'
      case 'ArrowUp':
      case 'KeyW':
        return 'up'
      case 'ArrowDown':
      case 'KeyS':
        return 'down'
      case 'Space':
      case 'KeyJ':
        return 'fire'
      default:
        return null
    }
  }

  frame(t) {
    const now = t / 1000
    const raw = Math.min(0.05, Math.max(0.001, now - (this.lastT || now)))
    this.lastT = now
    let timeScale = 1
    if (this.hitStop > 0) {
      this.hitStop -= raw
      timeScale = Math.min(timeScale, 0.12)
    }
    if (this.slowmo > 0) {
      this.slowmo -= raw
      timeScale = Math.min(timeScale, 0.45)
    }
    const dt = raw * timeScale
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - 34 * dt)
      const sd = Math.exp(-6 * raw)
      this.shakeDx *= sd
      this.shakeDy *= sd
    }
    if (this.flash > 0) this.flash = Math.max(0, this.flash - 1.4 * dt)
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - 1.5 * dt)
    if (this.bannerT > 0) this.bannerT -= dt
    this.particles.update(dt)

    if (this.phase === 'menu') {
      this.updateMenu(dt)
      this.updateBullets(dt)
      return
    }
    if (this.phase !== 'playing') return

    this.updateBullets(dt)
    this.timeSec += dt
    if (this.comboT > 0) {
      this.comboT -= dt
      if (this.comboT <= 0) {
        this.streak = 0
      }
    }

    if (this.bossTimer > 0) {
      this.bossTimer -= dt
      if (this.bossTimer <= 0) this.spawnBoss()
    }
    this.updateSpawn()
    this.updatePlayer(dt)
    this.updateEnemies(dt)
    this.updateBoss(dt)
    this.updatePowerups(dt)
    this.checkWaveEnd()
  }

  getSnapshot() {
    return {
      score: this.score,
      high: this.high,
      top5: this.top5,
      lives: Math.max(0, this.lives),
      bombs: this.bombs,
      power: this.power,
      shield: this.shield,
      wave: this.wave,
      mult: this.mult(),
      streak: this.streak,
      comboFrac: this.comboT / COMBO_TIMEOUT,
      timeSec: this.timeSec,
      kills: this.kills,
      phase: this.phase,
      bannerWave: this.bannerWave,
      bannerT: this.bannerT,
      boss: this.boss ? { hp: this.boss.hp, maxHp: this.boss.maxHp, name: this.boss.name } : null,
      upgradeChoices: this.upgradeChoices,
      endless: this.endless,
    }
  }
}

