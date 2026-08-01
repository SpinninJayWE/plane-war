let ctx = null
let master = null
let sfxGain = null
let bgmGain = null
let noiseBuf = null

let sfxEnabled = true
let bgmEnabled = true

let bgmTimer = null
let bgmStep = 0
let bgmNext = 0
const STEP = 0.21

function ensure() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return true
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.9
    master.connect(ctx.destination)
    sfxGain = ctx.createGain()
    sfxGain.gain.value = 0.8
    sfxGain.connect(master)
    bgmGain = ctx.createGain()
    bgmGain.gain.value = 0.3
    bgmGain.connect(master)
    const len = ctx.sampleRate
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    return true
  } catch {
    return false
  }
}

function osc(type, freq, dur, vol, slideTo = null, delay = 0, dest = null) {
  if (!ctx) return
  const t0 = ctx.currentTime + delay
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur)
  g.gain.setValueAtTime(vol, t0)
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur)
  o.connect(g)
  g.connect(dest || sfxGain)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

function noise(dur, vol, filterFreq, type = 'lowpass', delay = 0, dest = null) {
  if (!ctx || !noiseBuf) return
  const t0 = ctx.currentTime + delay
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  const f = ctx.createBiquadFilter()
  f.type = type
  f.frequency.value = filterFreq
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t0)
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur)
  src.connect(f)
  f.connect(g)
  g.connect(dest || sfxGain)
  src.start(t0)
  src.stop(t0 + dur + 0.02)
}

function blip(freqs, dur, vol, type = 'square', gap = 0.07) {
  freqs.forEach((f, i) => osc(type, f, dur, vol, null, i * gap))
}

export const audio = {
  get bgmOn() {
    return bgmEnabled
  },
  get sfxOn() {
    return sfxEnabled
  },
  init() {
    ensure()
    this.startBgm()
  },
  setSfx(on) {
    sfxEnabled = on
  },
  setBgm(on) {
    bgmEnabled = on
    if (!on) this.stopBgm()
    else this.startBgm()
  },
  play(name) {
    if (!ensure() || !sfxEnabled) return
    switch (name) {
      case 'click':
        osc('square', 660, 0.06, 0.18, 520)
        break
      case 'shoot':
        osc('square', 880, 0.05, 0.12, 380)
        break
      case 'hit':
        osc('triangle', 320, 0.08, 0.3, 200)
        break
      case 'explode':
        noise(0.4, 0.5, 900)
        osc('sawtooth', 160, 0.35, 0.35, 40)
        break
      case 'big':
        noise(1.1, 0.75, 700)
        osc('sawtooth', 110, 1.0, 0.5, 26)
        osc('square', 220, 0.7, 0.2, 40)
        break
      case 'powerup':
        blip([523, 659, 784, 1047], 0.09, 0.22)
        break
      case 'shield':
        blip([784, 988, 1175], 0.08, 0.2, 'sine')
        break
      case 'shieldHit':
        noise(0.18, 0.35, 1800, 'highpass')
        osc('sine', 900, 0.16, 0.25, 500)
        break
      case 'bomb':
        noise(0.9, 0.8, 500)
        osc('sine', 90, 0.9, 0.55, 24)
        break
      case 'life':
        blip([659, 880, 1109, 1319], 0.1, 0.24, 'triangle')
        break
      case 'alert':
        osc('square', 392, 0.16, 0.22, null, 0)
        osc('square', 392, 0.16, 0.22, null, 0.24)
        break
      case 'laser':
        noise(1.3, 0.4, 3200, 'highpass')
        osc('sawtooth', 700, 1.3, 0.22, 160)
        break
      case 'enemyShoot':
        osc('triangle', 300, 0.1, 0.14, 180)
        break
      case 'combo':
        blip([784, 1047, 1319], 0.08, 0.22, 'triangle', 0.06)
        break
      case 'gameover':
        blip([523, 440, 349, 262, 196], 0.24, 0.28, 'triangle', 0.16)
        break
      case 'victory':
        blip([392, 523, 659, 784, 1047, 1319], 0.16, 0.26, 'triangle', 0.11)
        break
      default:
        break
    }
  },
  startBgm() {
    if (!ensure() || !bgmEnabled) return
    if (bgmTimer) return
    bgmStep = 0
    bgmNext = ctx.currentTime + 0.1
    bgmTimer = setInterval(() => this.scheduleBgm(), 90)
  },
  stopBgm() {
    if (bgmTimer) {
      clearInterval(bgmTimer)
      bgmTimer = null
    }
  },
  scheduleBgm() {
    if (!ctx || !bgmEnabled) return
    while (bgmNext < ctx.currentTime + 0.2) {
      this.playStep(bgmStep, bgmNext)
      bgmStep = (bgmStep + 1) % 32
      bgmNext += STEP
    }
  },
  playStep(step, t) {
    const chords = [
      [220, 261.6, 329.6, 440], // Am
      [174.6, 220, 261.6, 349.2], // F
      [196, 246.9, 293.7, 392], // G
      [130.8, 174.6, 196, 261.6], // C
    ]
    const bar = Math.floor(step / 8) % 4
    const sub = step % 8
    const bass = chords[bar][0] / 2
    if (sub % 4 === 0) {
      this.bgmOsc('triangle', bass, STEP * 3.8, 0.5, t)
    }
    if (sub % 2 === 1) {
      const note = chords[bar][2]
      this.bgmOsc('square', note, STEP * 0.9, 0.1, t)
    }
    if (sub === 3 || sub === 7) {
      const note = chords[bar][1]
      this.bgmOsc('sine', note * 2, STEP * 0.9, 0.16, t)
    }
  },
  bgmOsc(type, freq, dur, vol, t) {
    if (!ctx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur)
    o.connect(g)
    g.connect(bgmGain)
    o.start(t)
    o.stop(t + dur + 0.05)
  },
}
