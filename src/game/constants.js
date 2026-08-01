export const FIELD_W = 480
export const FIELD_H = 640

export const PLAYER_RADIUS = 13
export const BULLET_RADIUS = 5
export const ENEMY_BULLET_RADIUS = 5

export const PLAYER_SPEED = 270
export const PLAYER_FIRE = [0.2, 0.17, 0.15, 0.13, 0.11]
export const PLAYER_BULLET_SPEED = 540
export const MAX_POWER = 5
export const START_LIVES = 3
export const MAX_LIVES = 5
export const START_BOMBS = 1
export const MAX_BOMBS = 3
export const EXTRA_LIFE_EVERY = 50000
export const COMBO_TIMEOUT = 3

export const POWERUP_DROP = {
  gem: 0.34,
  power: 0.1,
  shield: 0.045,
  bomb: 0.03,
  life: 0.02,
}

export const ENEMY_TYPES = {
  grunt: { hp: 1, speed: 130, score: 100, r: 14, fire: 0, fireRate: 0 },
  weaver: { hp: 1, speed: 95, score: 150, r: 14, fire: 2, fireRate: 2.2 },
  mini: { hp: 1, speed: 230, score: 120, r: 11, fire: 0, fireRate: 0 },
  diver: { hp: 2, speed: 150, score: 250, r: 15, fire: 1, fireRate: 2.8 },
  sniper: { hp: 3, speed: 110, score: 400, r: 16, fire: 5, fireRate: 1.15 },
  tank: { hp: 10, speed: 62, score: 800, r: 21, fire: 3, fireRate: 1.7 },
}

export const ENEMY_PAL = {
  grunt: { body: '#e5484d', dark: '#7f1d1d', glow: '#ff8080' },
  weaver: { body: '#a78bfa', dark: '#5b21b6', glow: '#d8b4fe' },
  mini: { body: '#fb923c', dark: '#9a3412', glow: '#fdba74' },
  diver: { body: '#fbbf24', dark: '#92400e', glow: '#fde68a' },
  sniper: { body: '#38bdf8', dark: '#075985', glow: '#7dd3fc' },
  tank: { body: '#4ade80', dark: '#14532d', glow: '#86efac' },
}

export const DIFFICULTIES = {
  easy: {
    label: '简单',
    hpMul: 0.7,
    spawnMul: 0.8,
    fireMul: 0.7,
    enemySpeedMul: 0.85,
  },
  normal: {
    label: '普通',
    hpMul: 1,
    spawnMul: 1,
    fireMul: 1,
    enemySpeedMul: 1,
  },
  hard: {
    label: '困难',
    hpMul: 1.35,
    spawnMul: 1.25,
    fireMul: 1.3,
    enemySpeedMul: 1.1,
  },
}

export const BUFFS = {
  power: { name: '火力强化', desc: '武器等级 +1（上限 5 级）' },
  shield: { name: '能量护盾', desc: '获得 2 层护盾吸收伤害' },
  speed: { name: '矢量引擎', desc: '移动速度 +14%，可叠加' },
  double: { name: '双倍赏金', desc: '本局得分永久 ×2' },
  magnet: { name: '磁吸核心', desc: '道具与水晶吸附范围大幅提升' },
  bomb: { name: '战术炸弹', desc: '炸弹储备 +1' },
}

export const BOSS_HP = {
  wave5: 260,
  wave10: 520,
}

export const BOSS_WAVES = new Set([5, 10])

export const HIGH_KEY = 'plane-war-high'
export const TOP5_KEY = 'plane-war-top5'
