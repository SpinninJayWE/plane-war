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

  explode(x, y, n) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2
      const sp = rand(40, 300)
      this.add({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: rand(0.3, 0.8),
        t: 0,
        size: rand(2, 5),
        color: pick(['#ffd166', '#ff8c42', '#ff5a3c', '#fff3b0']),
        type: 'dot',
      })
    }
  }

  spark(x, y) {
    for (let i = 0; i < 5; i++) {
      const ang = Math.random() * Math.PI * 2
      const sp = rand(60, 220)
      this.add({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.25,
        t: 0,
        size: rand(1.5, 3),
        color: '#ffe08a',
        type: 'dot',
      })
    }
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
    for (let i = 0; i < 3; i++) {
      this.add({
        x, y,
        vx: 0,
        vy: 0,
        life: 0.5,
        t: 0,
        size: 8 + i * 12,
        color: '#ffffff',
        type: 'ring',
      })
    }
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
