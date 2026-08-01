export function Hud({ hud, isTouch, onBomb, onPause, onBgm, onFull, bgmOn, isFull }) {
  if (!hud) return null
  const powerPips = Array.from({ length: 5 }, (_, i) => i < hud.power)
  const lifePips = Array.from({ length: 5 }, (_, i) => i < hud.lives)
  const bombPips = Array.from({ length: 3 }, (_, i) => i < hud.bombs)
  const shieldPips = Array.from({ length: 3 }, (_, i) => i < hud.shield)

  return (
    <>
      <div className="hud">
        <div className="hud-pill">
          <span className="lbl">分数</span>
          <span className="num">{hud.score.toLocaleString()}</span>
        </div>
        {hud.mult > 1 && (
          <div className="hud-pill mult">
            <span className="lbl">连击</span>
            <span className="num">x{hud.mult}</span>
          </div>
        )}
        <div className="grow" />
        <div className="hud-pill">
          <span className="lbl">第{hud.wave}波</span>
        </div>
        <div className="hud-pill">
          <span className="lbl">火力</span>
          <span className="icons">
            {powerPips.map((on, i) => (
              <span key={`p${i}`} className={`icon-pip power ${on ? '' : 'off'}`} />
            ))}
          </span>
        </div>
        <div className="hud-pill">
          <span className="icons">
            {shieldPips.map((on, i) => (
              <span key={`s${i}`} className={`icon-pip shield ${on ? '' : 'off'}`} />
            ))}
          </span>
          <span className="icons">
            {bombPips.map((on, i) => (
              <span key={`b${i}`} className={`icon-pip bomb ${on ? '' : 'off'}`} />
            ))}
          </span>
          <span className="icons">
            {lifePips.map((on, i) => (
              <span key={`l${i}`} className={`icon-pip life ${on ? '' : 'off'}`} />
            ))}
          </span>
        </div>
        {!isTouch && (
          <div className="hud-pill" style={{ pointerEvents: 'auto' }}>
            <button className="mini-btn" onClick={onBgm}>{bgmOn ? '♪' : '×♪'}</button>
            <button className="mini-btn" onClick={onFull}>{isFull ? '↘' : '⛶'}</button>
          </div>
        )}
      </div>
      {isTouch && (
        <div className="hud-btn-row">
          <button className="touch-btn" onClick={onPause}>暂停</button>
          <button className="touch-btn" onClick={onBomb}>炸弹</button>
        </div>
      )}
    </>
  )
}
