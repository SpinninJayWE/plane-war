const DIFFS = [
  { id: 'easy', label: '简单' },
  { id: 'normal', label: '普通' },
  { id: 'hard', label: '困难' },
]

export function WaveBanner({ wave, isBoss }) {
  return (
    <div className="banner">
      <h2>{isBoss ? '警告 · BOSS 来袭' : `第 ${wave} 波`}</h2>
      {isBoss && <p>WARNING</p>}
    </div>
  )
}

export function MenuScreen({ diff, setDiff, high, top5, bgmOn, isFull, onBgm, onFull, onStart }) {
  return (
    <div className="overlay panel">
      <div className="panel-card">
        <h1 className="title">星际猎手</h1>
        <p className="subtitle">PLANE WAR · 弹幕射击</p>
        <div className="diff-row">
          {DIFFS.map((d) => (
            <button
              key={d.id}
              className={`diff-btn ${diff === d.id ? 'on' : ''}`}
              onClick={() => setDiff(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button className="btn primary" onClick={() => onStart()}>
          开始游戏
        </button>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn" style={{ width: 'auto', flex: 1, margin: 4 }} onClick={onBgm}>
            {bgmOn ? '♪ 音乐开' : '♪ 音乐关'}
          </button>
          <button className="btn" style={{ width: 'auto', flex: 1, margin: 4 }} onClick={onFull}>
            {isFull ? '退出全屏' : '⛶ 全屏'}
          </button>
        </div>
        {top5.length > 0 && (
          <div className="top5">
            <h4>最高纪录 TOP 5</h4>
            {top5.map((t, i) => (
              <div className="top5-row" key={i}>
                <span>
                  {i + 1}. {t.s.toLocaleString()}
                </span>
                <span>第{t.w}波 {t.t ? '· 无尽' : ''}</span>
              </div>
            ))}
          </div>
        )}
        {high > 0 && (
          <p className="subtitle" style={{ marginTop: 10 }}>
            历史最高：{high.toLocaleString()}
          </p>
        )}
        <div className="help">
          <div><kbd>WASD</kbd> / <kbd>方向键</kbd> 移动 · 触屏：拖动即控制战机</div>
          <div><kbd>J</kbd> / <kbd>空格</kbd> 射击（长按连发 · 触屏自动开火）</div>
          <div><kbd>B</kbd> 炸弹清屏 · <kbd>P</kbd>/<kbd>Esc</kbd> 暂停</div>
          <div><kbd>M</kbd> 音乐 · <kbd>F</kbd> 全屏 · 连续击破可提升连击倍率</div>
        </div>
      </div>
    </div>
  )
}

export function PauseScreen({ onResume, onRestart, onMenu }) {
  return (
    <div className="overlay">
      <div className="panel-card">
        <h2 style={{ margin: '0 0 18px' }}>已暂停</h2>
        <button className="btn primary" onClick={onResume}>继续游戏</button>
        <button className="btn" onClick={onRestart}>重新开始</button>
        <button className="btn ghost" onClick={onMenu}>返回主菜单</button>
      </div>
    </div>
  )
}

export function UpgradeScreen({ choices, onPick }) {
  return (
    <div className="overlay panel">
      <div className="panel-card">
        <h2 className="upgrade-title">科技升级</h2>
        <p className="upgrade-sub">选择一项强化进入下一波</p>
        <div className="upgrade-cards">
          {choices.map((c, i) => (
            <div className="upgrade-card" key={c.id} onClick={() => onPick(c.id)}>
              <span className="key">{i + 1}</span>
              <h3>{c.name}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EndScreen({ type, hud, diff, onRestart, onMenu, onEndless }) {
  const isVictory = type === 'victory'
  return (
    <div className="overlay">
      <div className="panel-card">
        <h2 className="upgrade-title" style={{ color: isVictory ? '#4ade80' : '#f87171' }}>
          {isVictory ? '胜利！' : '游戏结束'}
        </h2>
        <p className="subtitle">
          {isVictory ? '深渊主舰已被击毁，银河恢复了和平' : '机体受损严重，指挥官'}
        </p>
        <div className="result-stats">
          <div className="stat">
            <div className="v">{hud.score.toLocaleString()}</div>
            <div className="k">最终得分</div>
          </div>
          <div className="stat">
            <div className="v">{hud.wave}</div>
            <div className="k">到达波次</div>
          </div>
          <div className="stat">
            <div className="v">{hud.kills}</div>
            <div className="k">击毁敌机</div>
          </div>
          <div className="stat">
            <div className="v">{Math.floor(hud.timeSec / 60)}:{String(Math.floor(hud.timeSec % 60)).padStart(2, '0')}</div>
            <div className="k">存活时间</div>
          </div>
        </div>
        {!isVictory && (
          <div className="score-line">
            <span>最高分</span>
            <b>{hud.high.toLocaleString()}</b>
          </div>
        )}
        <button className="btn primary" onClick={onRestart}>再来一局</button>
        {isVictory && onEndless && (
          <button className="btn" onClick={onEndless}>无尽模式</button>
        )}
        <button className="btn ghost" onClick={onMenu}>返回主菜单</button>
        <p className="subtitle" style={{ marginTop: 8 }}>{diff.label}模式 · 连击最高 x{hud.mult}</p>
      </div>
    </div>
  )
}
