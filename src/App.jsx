import { useEffect, useRef, useState } from 'react'
import { Engine } from './game/engine.js'
import { Renderer } from './game/render.js'
import { audio } from './game/audio.js'
import { FIELD_W, FIELD_H, BOSS_WAVES } from './game/constants.js'
import { Hud } from './components/Hud.jsx'
import { MenuScreen, PauseScreen, UpgradeScreen, EndScreen, WaveBanner } from './components/Screens.jsx'
import './App.css'

const HANDLED_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space', 'KeyJ', 'KeyB',
  'Enter', 'KeyP', 'KeyM', 'KeyF', 'Escape',
  'Digit1', 'Digit2', 'Digit3',
])

export default function App() {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const engineRef = useRef(null)
  const phaseRef = useRef('menu')
  const diffRef = useRef('normal')
  const fsGuardUntilRef = useRef(0)
  const touchIdRef = useRef(null)
  const isTouchRef = useRef(false)

  const [phase, setPhase] = useState('menu')
  const [hud, setHud] = useState(null)
  const [diff, setDiff] = useState('normal')
  const [bgmOn, setBgmOn] = useState(true)
  const [isFull, setIsFull] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    diffRef.current = diff
  }, [diff])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const engine = new Engine()
    const renderer = new Renderer(engine)
    engineRef.current = engine
    if (import.meta.env.DEV) window.__engine = engine
    engine.onPhase = (p) => setPhase(p)
    engine.startDemo()

    const resize = () => {
      const el = stageRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const s = Math.min(rect.width / FIELD_W, rect.height / FIELD_H)
      engine.scale = s
      engine.dpr = dpr
      engine.ox = (rect.width - FIELD_W * s) / 2
      engine.oy = (rect.height - FIELD_H * s) / 2
      canvas.width = Math.max(1, Math.round(rect.width * dpr))
      canvas.height = Math.max(1, Math.round(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
    const ro = new ResizeObserver(resize)
    ro.observe(stageRef.current)
    resize()

    let raf
    let lastKey = ''
    const loop = (t) => {
      engine.frame(t)
      renderer.draw(ctx)
      const snap = engine.getSnapshot()
      const key = [
        snap.score, snap.high, snap.lives, snap.bombs, snap.power, snap.shield,
        snap.wave, snap.mult, snap.streak, snap.phase,
        snap.bannerWave, snap.bannerT > 0, snap.boss?.hp ?? -1,
        snap.upgradeChoices.map((c) => c.id).join('+'),
        snap.endless, snap.kills, Math.floor(snap.timeSec),
      ].join('|')
      if (key !== lastKey) {
        lastKey = key
        setHud(snap)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onKeyDown = (e) => {
      if (HANDLED_KEYS.has(e.code)) e.preventDefault()
      audio.init()
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (e.code === 'Escape' && document.fullscreenElement) return
        engine.togglePause()
        audio.play('click')
        return
      }
      if (e.code === 'KeyB') {
        engine.useBomb()
        return
      }
      if (e.code === 'Enter') {
        if (phaseRef.current === 'menu') engine.startGame(diffRef.current)
        else if (phaseRef.current === 'paused') engine.setPhase('playing')
        else if (phaseRef.current === 'over') engine.startGame(diffRef.current)
        else if (phaseRef.current === 'victory') engine.continueEndless()
        return
      }
      if (e.code === 'KeyM') {
        audio.setBgm(!audio.bgmOn)
        setBgmOn(audio.bgmOn)
        return
      }
      if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') {
        if (phaseRef.current === 'upgrade') {
          const idx = Number(e.code.slice(5)) - 1
          const choices = engineRef.current.upgradeChoices
          if (choices && choices[idx]) engineRef.current.applyBuff(choices[idx].id)
        }
        return
      }
      if (e.code === 'KeyF') {
        toggleFullscreen()
        return
      }
      engine.keydown(e.code)
    }
    const onKeyUp = (e) => engine.keyup(e.code)

    const toField = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (clientX - rect.left - engine.ox) / engine.scale,
        y: (clientY - rect.top - engine.oy) / engine.scale,
      }
    }
    const onPointerDown = (e) => {
      audio.init()
      if (e.pointerType === 'touch') {
        isTouchRef.current = true
        setIsTouch(true)
      }
      if (phaseRef.current !== 'playing' && phaseRef.current !== 'menu') return
      if (e.target.closest && e.target.closest('button')) return
      touchIdRef.current = e.pointerId
      const p = toField(e.clientX, e.clientY)
      engine.pointer.active = true
      engine.pointer.x = p.x
      engine.pointer.y = p.y
    }
    const onPointerMove = (e) => {
      if (e.pointerId !== touchIdRef.current) return
      const p = toField(e.clientX, e.clientY)
      engine.pointer.x = p.x
      engine.pointer.y = p.y
    }
    const onPointerUp = (e) => {
      if (e.pointerId !== touchIdRef.current) return
      touchIdRef.current = null
      engine.pointer.active = false
    }

    const onFullChange = () => setIsFull(Boolean(document.fullscreenElement))
    const onVisibility = () => {
      if (document.hidden && engine.phase === 'playing') engine.setPhase('paused')
    }
    const onBlur = () => {
      if (Date.now() < fsGuardUntilRef.current) return
      if (document.fullscreenElement) return
      if (engine.phase === 'playing') engine.setPhase('paused')
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('fullscreenchange', onFullChange)
    window.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    const stage = stageRef.current
    stage.addEventListener('pointerdown', onPointerDown)
    stage.addEventListener('pointermove', onPointerMove)
    stage.addEventListener('pointerup', onPointerUp)
    stage.addEventListener('pointercancel', onPointerUp)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('fullscreenchange', onFullChange)
      window.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      stage.removeEventListener('pointerdown', onPointerDown)
      stage.removeEventListener('pointermove', onPointerMove)
      stage.removeEventListener('pointerup', onPointerUp)
      stage.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  const toggleFullscreen = () => {
    fsGuardUntilRef.current = Date.now() + 400
    audio.init()
    audio.play('click')
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  const startGame = (d) => {
    audio.init()
    audio.play('click')
    engineRef.current.startGame(d)
  }
  const resume = () => {
    audio.play('click')
    engineRef.current.setPhase('playing')
  }
  const restart = () => startGame(diffRef.current)
  const endless = () => {
    audio.play('click')
    engineRef.current.continueEndless()
  }
  const pickUpgrade = (id) => {
    audio.play('click')
    engineRef.current.applyBuff(id)
  }
  const toMenu = () => {
    audio.play('click')
    engineRef.current.startDemo()
  }
  const toggleBgm = () => {
    const on = !audio.bgmOn
    audio.setBgm(on)
    setBgmOn(on)
  }
  const bomb = () => {
    audio.init()
    engineRef.current.useBomb()
  }
  const pauseGame = () => {
    audio.play('click')
    engineRef.current.togglePause()
  }

  const showBanner = hud && hud.bannerT > 0 && phase === 'playing'
  const bannerIsBoss = hud && BOSS_WAVES.has(hud.wave) && !hud.endless

  return (
    <div className="app">
      <main className="stage">
        <div className="stage-center" ref={stageRef}>
          <canvas ref={canvasRef} className="game-canvas" />
          {phase !== 'menu' && phase !== 'over' && phase !== 'victory' && (
            <Hud
              hud={hud}
              isTouch={isTouch}
              onBomb={bomb}
              onPause={pauseGame}
              onBgm={toggleBgm}
              onFull={toggleFullscreen}
              bgmOn={bgmOn}
              isFull={isFull}
            />
          )}
          {showBanner && <WaveBanner wave={hud.bannerWave} isBoss={bannerIsBoss} />}
          {phase === 'menu' && (
            <MenuScreen
              diff={diff}
              setDiff={(d) => { audio.init(); audio.play('click'); setDiff(d) }}
              high={hud?.high ?? 0}
              top5={hud?.top5 ?? []}
              bgmOn={bgmOn}
              isFull={isFull}
              onBgm={toggleBgm}
              onFull={toggleFullscreen}
              onStart={startGame}
            />
          )}
          {phase === 'paused' && <PauseScreen onResume={resume} onRestart={restart} onMenu={toMenu} />}
          {phase === 'upgrade' && hud && hud.upgradeChoices.length > 0 && (
            <UpgradeScreen choices={hud.upgradeChoices} onPick={pickUpgrade} />
          )}
          {phase === 'over' && hud && (
            <EndScreen type="over" hud={hud} diff={diff} onRestart={restart} onMenu={toMenu} />
          )}
          {phase === 'victory' && hud && (
            <EndScreen type="victory" hud={hud} diff={diff} onRestart={restart} onMenu={toMenu} onEndless={endless} />
          )}
        </div>
      </main>
      <footer className="hint-bar">
        <span>WASD / 方向键 移动</span>
        <i>·</i>
        <span>J / 空格 射击</span>
        <i>·</i>
        <span>B 炸弹</span>
        <i>·</i>
        <span>P 暂停</span>
        <i>·</i>
        <span>M 音乐</span>
        <i>·</i>
        <span>F 全屏</span>
      </footer>
    </div>
  )
}
