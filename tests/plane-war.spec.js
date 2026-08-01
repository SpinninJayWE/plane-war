import { test, expect } from '@playwright/test'

const ph = (page) => page.evaluate(() => window.__engine.phase)
const eng = (page) => page.evaluate(() => window.__engine)

async function poll(page, fn, timeout = 90000, msg = 'poll timeout') {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const v = await fn()
    if (v) return v
    await page.waitForTimeout(250)
  }
  throw new Error(msg)
}

// 无头环境偶发失焦会触发游戏自动暂停，轮询期间若发现暂停则自动恢复
async function pollPlaying(page, fn, timeout = 90000, msg = 'poll timeout') {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const p = await ph(page)
    if (p === 'paused') {
      await page.evaluate(() => window.__engine.setPhase('playing'))
      await page.waitForTimeout(100)
      continue
    }
    const v = await fn()
    if (v) return v
    await page.waitForTimeout(250)
  }
  throw new Error(msg)
}

async function startGame(page) {
  await page.bringToFront()
  await page.click('button:has-text("开始游戏")')
  await expect(page.locator('.hud')).toBeVisible()
  await poll(page, async () => (await ph(page)) === 'playing')
}

test.describe('星际猎手 E2E', () => {
  test('菜单页渲染', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.title')).toHaveText('星际猎手')
    await expect(page.locator('canvas')).toBeVisible()
    await expect(page.locator('.diff-btn', { hasText: '普通' })).toHaveClass(/on/)
    await page.screenshot({ path: 'test-results/shots/01-menu.png' })
  })

  test('开始游戏进入实战', async ({ page }) => {
    await page.goto('/')
    await startGame(page)
    await expect(page.locator('.hud', { hasText: '第1波' })).toBeVisible()
    const s = await eng(page)
    expect(s.lives).toBe(3)
    expect(s.power).toBe(1)
    await page.screenshot({ path: 'test-results/shots/02-start.png' })
  })

  test('实弹击杀计分', async ({ page }) => {
    await page.goto('/')
    await startGame(page)
    await page.keyboard.down('Space')
    await page.keyboard.down('ArrowRight')
    await pollPlaying(page, () => eng(page).then((e) => e.score > 0), 45000, '10 秒内未击杀得分')
    const e = await eng(page)
    expect(e.kills).toBeGreaterThanOrEqual(1)
    await page.keyboard.up('ArrowRight')
    await page.keyboard.up('Space')
    await page.screenshot({ path: 'test-results/shots/03-combat.png' })
  })

  test('暂停与恢复', async ({ page }) => {
    await page.goto('/')
    await startGame(page)
    await page.keyboard.press('KeyP')
    await expect(page.locator('text=已暂停')).toBeVisible()
    await page.screenshot({ path: 'test-results/shots/04-paused.png' })
    await page.keyboard.press('KeyP')
    await expect(page.locator('text=已暂停')).toHaveCount(0)
    await poll(page, async () => (await ph(page)) === 'playing')
  })

  test('炸弹清屏', async ({ page }) => {
    await page.goto('/')
    await startGame(page)
    await page.evaluate(() => {
      const e = window.__engine
      for (let i = 0; i < 6; i++) {
        e.ebullets.push({ x: 100 + i * 50, y: 300, vx: 0, vy: 100, r: 5 })
      }
    })
    expect(await page.evaluate(() => window.__engine.ebullets.length)).toBe(6)
    await page.keyboard.press('KeyB')
    await poll(page, () => eng(page).then((e) => e.ebullets.length === 0))
    const e = await eng(page)
    expect(e.bombs).toBe(0)
  })

  test('波次推进与升级选卡', async ({ page }) => {
    await page.goto('/')
    await startGame(page)
    await page.keyboard.down('Space')
    await pollPlaying(page, async () => (await ph(page)) === 'upgrade', 90000, '第 2 波结束未出现升级界面')
    await expect(page.locator('.upgrade-card')).toHaveCount(3)
    await page.screenshot({ path: 'test-results/shots/05-upgrade.png' })
    await page.locator('.upgrade-card').first().click()
    await poll(page, async () => (await ph(page)) === 'playing')
    const e = await eng(page)
    expect(e.wave).toBe(3)
    await page.keyboard.up('Space')
  })

  test('BOSS 战与击破', async ({ page }) => {
    await page.goto('/')
    await startGame(page)
    await page.evaluate(() => {
      const e = window.__engine
      e.wave = 4
      e.spawnQueue = []
      e.enemies = []
      e.checkWaveEnd()
    })
    await page.locator('.upgrade-card').first().click()
    await poll(page, () => eng(page).then((e) => !!e.boss), 20000, '第 5 波 BOSS 未出现')
    expect(await page.evaluate(() => window.__engine.boss.maxHp)).toBeGreaterThan(100)
    await page.screenshot({ path: 'test-results/shots/06-boss.png' })
    await page.keyboard.down('Space')
    await page.evaluate(() => { window.__engine.boss.hp = 1 })
    await poll(page, () => eng(page).then((e) => !e.boss), 20000, 'BOSS 未被击破')
    await poll(page, async () => (await ph(page)) === 'upgrade', 20000)
    await page.keyboard.up('Space')
  })

  test('通关胜利与无尽模式', async ({ page }) => {
    await page.goto('/')
    await startGame(page)
    await page.evaluate(() => {
      const e = window.__engine
      e.wave = 9
      e.spawnQueue = []
      e.enemies = []
      e.checkWaveEnd()
    })
    await page.locator('.upgrade-card').first().click()
    await poll(page, () => eng(page).then((e) => !!e.boss), 20000, '最终 BOSS 未出现')
    await page.keyboard.down('Space')
    await page.evaluate(() => { window.__engine.boss.hp = 1 })
    await poll(page, async () => (await ph(page)) === 'victory', 25000, '未触发通关胜利')
    await expect(page.locator('text=胜利！')).toBeVisible()
    await page.screenshot({ path: 'test-results/shots/07-victory.png' })
    await page.keyboard.up('Space')
    await page.click('button:has-text("无尽模式")')
    await poll(page, async () => (await ph(page)) === 'playing')
    const e = await eng(page)
    expect(e.endless).toBe(true)
    expect(e.wave).toBe(11)
  })

  test('游戏结束与结算', async ({ page }) => {
    await page.goto('/')
    await startGame(page)
    await page.evaluate(() => {
      const e = window.__engine
      e.lives = 1
      e.player.invuln = 0
      e.hitPlayer()
    })
    await expect(page.locator('text=游戏结束')).toBeVisible()
    await expect(page.locator('button:has-text("再来一局")')).toBeVisible()
    await page.screenshot({ path: 'test-results/shots/08-gameover.png' })
  })

  test('鼠标拖拽移动战机', async ({ page }) => {
    await page.goto('/')
    await startGame(page)
    const box = await page.locator('.stage-center').boundingBox()
    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 3
    await page.mouse.move(cx, cy)
    await page.mouse.down()
    await poll(page, () => eng(page).then((e) => e.pointer.active))
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.7, { steps: 10 })
    const e = await eng(page)
    expect(e.pointer.x).toBeGreaterThan(300)
    await page.screenshot({ path: 'test-results/shots/09-drag.png' })
    await page.mouse.up()
    await poll(page, () => eng(page).then((x) => !x.pointer.active))
  })
})
