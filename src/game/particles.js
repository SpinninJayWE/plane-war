const MAX_PARTICLES = 900

export class ParticleSystem {
  constructor() {
    this.list = []
  }

  clear() {
    this.list.length = 0
  }

  add(p) {
    if (this.list.length >= MAX_PARTICLES) this.list.shift()
    this.list.push(p)
  }

  burst(x, y, n, colors, spMin, spMax, sizeMin, sizeMax, lifeMin, lifeMax) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2
      const sp = rand(spMin, spMax)
      this.add({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: rand(lifeMin, lifeMax),
        t: 0,
        size: rand(sizeMin, sizeMax),
        color: pick(colors),
        type: 'dot',
      })
    }
  }

  explode(x, y, n) {
    this.burst(x, y, n, ['#ffd166', '#ff8c42', '#ff5a3c', '#fff3b0'], 40, 300, 2, 5, 0.3, 0.8)
  }

  spark(x, y, ang = null) {
    for (let i = 0; i < 5; i++) {
      const a = ang === null ? rand(0, Math.PI * 2) : ang + rand(-0.7, 0.7)
      const sp = rand(60, 260)
      this.add({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.12, 0.24),
        t: 0,
        size: rand(6, 13),
        color: '#ffe08a',
        type: 'streak',
      })
    }
  }

  debris(x, y, colors, n, power) {
    for (let i = 0; i < n; i++) {
      const ang = rand(0, Math.PI * 2)
      const sp = rand(40, power)
      this.add({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 60,
        life: rand(0.5, 1.1),
        t: 0,
        size: rand(1.5, 4),
        color: pick(colors),
        type: 'dot',
        grav: 420,
      })
    }
  }

  flash(x, y, color, size, life = 0.3) {
    this.add({ x, y, vx: 0, vy: 0, life, t: 0, size, color, type: 'flash' })
  }

  shockwave(x, y, color, size, life = 0.45) {
    this.add({ x, y, vx: 0, vy: 0, life, t: 0, size, color, type: 'ring', grow: size * 2.2 })
  }

  smoke(x, y, n) {
    for (let i = 0; i < n; i++) {
      this.add({
        x: x + rand(-8, 8),
        y: y + rand(-8, 8),
        vx: rand(-22, 22),
        vy: rand(-70, -18),
        life: rand(0.5, 0.95),
        t: 0,
        size: rand(5, 12),
        color: '#94a3b8',
        type: 'dot',
        opacity: 0.4,
        grow: rand(6, 14),
      })
    }
  }

  text(x, y, str, color, size = 13) {
    this.add({ x, y, vx: 0, vy: -44, life: 0.85, t: 0, size, color, str, type: 'text' })
  }

  damage(x, y, dmg) {
    this.add({ x, y, vx: rand(-14, 14), vy: -58, life: 0.5, t: 0, size: 10, color: '#fecaca', str: `-${dmg}`, type: 'text' })
  }

  trail(x, y, rate) {
    if (Math.random() > rate) return
    this.add({
      x: x + rand(-3, 3),
      y: y + 14,
      vx: rand(-10, 10),
      vy: rand(40, 90),
      life: rand(0.2, 0.4),
      t: 0,
      size: rand(1.5, 3.5),
      color: pick(['#7dd3fc', '#38bdf8', '#818cf8']),
      type: 'dot',
    })
  }

  ring(x, y) {
    this.shockwave(x, y, '#ffffff', 10, 0.5)
    this.shockwave(x, y, '#ffffff', 22, 0.5)
    this.shockwave(x, y, '#ffffff', 34, 0.5)
  }

  gem(x, y) {
    for (let i = 0; i < 10; i++) {
      const ang = Math.random() * Math.PI * 2
      const sp = rand(40, 160)
      this.add({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 40,
        life: rand(0.3, 0.6),
        t: 0,
        size: rand(2, 4),
        color: pick(['#34d399', '#6ee7b7', '#a7f3d0']),
        type: 'dot',
      })
    }
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]
      p.t += dt
      if (p.t >= p.life) {
        this.list.splice(i, 1)
        continue
      }
      if (p.grav) p.vy += p.grav * dt
      if (p.grow) p.size += p.grow * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 1 - 2.4 * dt
      p.vy *= 1 - 2.4 * dt
    }
  }
}

function rand(a, b) {
  return a + Math.random() * (b - a)
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
