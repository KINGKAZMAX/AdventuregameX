import { CARTRIDGE_TYPE } from '../scene/game-boy-scene/cartridges/data/cartridges-config';
import { CARTRIDGE_INFO_CONFIG } from '../scene/game-boy-scene/cartridges/data/cartridge-info-config';
import { EMULATOR_GAMES_CONFIG } from '../scene/game-boy-scene/game-boy-games/games/emulator/emulator-games-config';

type Lang = 'en' | 'zh';

const UI_TEXT = {
  playable: { en: 'PLAYABLE · open source', zh: '真实可玩 · 开源' },
  display: { en: 'DISPLAY CARTRIDGE', zh: '展示卡带' },
  builtin: { en: 'BUILT-IN GAME', zh: '内置游戏' },
  author: { en: 'Author', zh: '作者' },
  license: { en: 'License', zh: '许可' },
  viewSource: { en: 'View source ↗', zh: '查看源码 ↗' },
  insertHint: { en: 'Tap the cartridge to insert & play', zh: '轻点卡带即可插入游玩' },
  close: { en: 'Close', zh: '关闭' },
};

// A self-contained DOM card shown on LONG-PRESS of a cartridge. No framework;
// injects its own scoped styles once and renders on demand.
export default class CartridgeInfoPanel {
  private lang: Lang;
  private root: HTMLDivElement;
  private card: HTMLDivElement;
  private visible: boolean = false;

  constructor() {
    const params = new URLSearchParams(window.location.search);
    this.lang = params.get('lang') === 'zh' ? 'zh' : 'en';

    this.injectStyles();
    this.build();
  }

  public setLanguage(lang: Lang): void {
    this.lang = lang;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public show(cartridgeType: CARTRIDGE_TYPE): void {
    const info = CARTRIDGE_INFO_CONFIG[cartridgeType];
    if (!info) {
      return;
    }

    const lang = this.lang;
    const game = EMULATOR_GAMES_CONFIG[cartridgeType];

    const badgeText = info.kind === 'emulator' ? UI_TEXT.playable[lang]
      : info.kind === 'builtin' ? UI_TEXT.builtin[lang]
      : UI_TEXT.display[lang];
    const badgeClass = info.kind === 'emulator' ? 'gbx-badge gbx-badge--play' : 'gbx-badge';

    const rows: string[] = [];
    if (info.kind === 'emulator' && game) {
      rows.push(this.metaRow(UI_TEXT.author[lang], game.author));
      rows.push(this.metaRow(UI_TEXT.license[lang], game.license));
    }

    const link = (info.kind === 'emulator' && game)
      ? `<a class="gbx-link" href="${game.sourceUrl}" target="_blank" rel="noopener noreferrer">${UI_TEXT.viewSource[lang]}</a>`
      : '';

    const hint = info.kind === 'emulator'
      ? `<p class="gbx-hint">${UI_TEXT.insertHint[lang]}</p>`
      : '';

    this.card.innerHTML = `
      <button class="gbx-close" aria-label="${UI_TEXT.close[lang]}">×</button>
      <span class="${badgeClass}">${badgeText}</span>
      <h2 class="gbx-title">${this.escape(info.title[lang])}</h2>
      <p class="gbx-release">${this.escape(info.release[lang])}</p>
      <p class="gbx-blurb">${this.escape(info.blurb[lang])}</p>
      ${rows.length ? `<div class="gbx-meta">${rows.join('')}</div>` : ''}
      ${link}
      ${hint}
    `;

    const closeBtn = this.card.querySelector('.gbx-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.hide(); });

    this.root.classList.add('gbx-open');
    this.visible = true;
  }

  public hide(): void {
    this.root.classList.remove('gbx-open');
    this.visible = false;
  }

  private metaRow(label: string, value: string): string {
    return `<div class="gbx-metarow"><span class="gbx-metalabel">${this.escape(label)}</span><span class="gbx-metavalue">${this.escape(value)}</span></div>`;
  }

  private build(): void {
    const root = this.root = document.createElement('div');
    root.className = 'gbx-info-overlay';

    const card = this.card = document.createElement('div');
    card.className = 'gbx-info-card';

    root.appendChild(card);
    document.body.appendChild(root);

    // Click on the dimmed backdrop (but not the card) closes the panel.
    root.addEventListener('pointerdown', (e) => {
      if (e.target === root) {
        e.stopPropagation();
        this.hide();
      }
    });
    // Swallow pointer events on the card so they don't reach the 3D scene.
    card.addEventListener('pointerdown', (e) => e.stopPropagation());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.visible) {
        this.hide();
      }
    });
  }

  private injectStyles(): void {
    if (document.getElementById('gbx-info-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'gbx-info-styles';
    style.textContent = `
      .gbx-info-overlay {
        position: fixed; inset: 0; z-index: 30;
        display: flex; align-items: center; justify-content: center;
        padding: 24px;
        background: rgba(10, 10, 12, 0);
        opacity: 0; pointer-events: none;
        transition: opacity 0.22s ease, background 0.22s ease;
      }
      .gbx-info-overlay.gbx-open {
        opacity: 1; pointer-events: auto;
        background: rgba(10, 10, 12, 0.42);
      }
      .gbx-info-card {
        position: relative;
        width: min(360px, 88vw);
        box-sizing: border-box;
        padding: 22px 22px 20px;
        border-radius: 16px;
        background: #26262b;
        color: #ececf0;
        box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 2px 0 rgba(255,255,255,0.04) inset;
        border: 1px solid rgba(255,255,255,0.08);
        transform: translateY(10px) scale(0.98);
        transition: transform 0.22s cubic-bezier(0.2,0.7,0.2,1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .gbx-open .gbx-info-card { transform: translateY(0) scale(1); }
      .gbx-close {
        position: absolute; top: 12px; right: 12px;
        width: 30px; height: 30px; border: none; border-radius: 50%;
        background: rgba(255,255,255,0.07); color: #cfcfd6;
        font-size: 19px; line-height: 1; cursor: pointer;
        transition: background 0.15s ease;
      }
      .gbx-close:hover { background: rgba(255,255,255,0.16); }
      .gbx-badge {
        display: inline-block; font-size: 10.5px; font-weight: 700;
        letter-spacing: 0.08em; text-transform: uppercase;
        padding: 4px 9px; border-radius: 999px;
        background: rgba(255,255,255,0.08); color: #b7b7c0;
      }
      .gbx-badge--play { background: #3c8c5a; color: #eafff0; }
      .gbx-title { margin: 12px 0 4px; font-size: 21px; font-weight: 700; line-height: 1.2; }
      .gbx-release { margin: 0 0 12px; font-size: 12px; color: #9a9aa4; }
      .gbx-blurb { margin: 0 0 14px; font-size: 14px; line-height: 1.55; color: #d6d6dd; }
      .gbx-meta {
        display: flex; flex-direction: column; gap: 6px;
        padding: 12px 0; margin-bottom: 4px;
        border-top: 1px solid rgba(255,255,255,0.08);
      }
      .gbx-metarow { display: flex; justify-content: space-between; font-size: 12.5px; gap: 12px; }
      .gbx-metalabel { color: #8f8f99; }
      .gbx-metavalue { color: #e2e2e8; text-align: right; }
      .gbx-link {
        display: inline-block; margin-top: 10px;
        font-size: 13px; font-weight: 600; color: #7fd0a0; text-decoration: none;
      }
      .gbx-link:hover { text-decoration: underline; }
      .gbx-hint { margin: 12px 0 0; font-size: 11.5px; color: #7f7f89; }
    `;

    document.head.appendChild(style);
  }

  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
