# 星际猎手 · Plane War

现代前端弹幕射击游戏（纵向 STG），基于 Vite + React 19 + Canvas 2D + Web Audio。

## 运行

```bash
npm install
npm run dev      # 开发
npm run build    # 构建
npm run lint     # oxlint
```

## 玩法

- 操作：`WASD`/方向键移动，`J`/空格射击（自动连发），`B` 炸弹清屏，`P`/`Esc` 暂停，`M` 音乐，`F` 全屏；手机直接拖拽移动。
- 目标：撑过 10 波进攻并击败第 5 波、第 10 波的 BOSS；通关后可选无尽模式。
- 火力等级 1-5（P 道具或升级强化），护盾、炸弹、生命道具随机掉落。
- 击杀连击（5 连以上倍率递增）、每波之间三选一科技升级、最高分与 TOP5 本地存档。

## 技术结构

```
src/
├── game/
│   ├── constants.js   # 常量与数值表
│   ├── engine.js      # 纯逻辑引擎（固定 480x640 逻辑坐标，无 DOM 依赖）
│   ├── render.js      # Canvas 渲染器（战机/BOSS/弹幕/粒子/星空视差）
│   ├── particles.js   # 粒子系统
│   └── audio.js       # Web Audio 合成音效 + BGM 序列器
├── components/
│   ├── Hud.jsx        # 顶部 HUD 与触屏按钮
│   └── Screens.jsx    # 菜单/暂停/升级/结算/波次横幅
└── App.jsx            # 游戏循环、输入接线、HUD 状态同步
```
