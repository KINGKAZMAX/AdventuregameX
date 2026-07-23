import { Container, Graphics, Text } from 'pixi.js';
import ScreenAbstract from '../../screens/screen-abstract';
import { GAME_BOY_CONFIG } from '../../../game-boy/data/game-boy-config';
import { CARTRIDGE_TYPE } from '../../../cartridges/data/cartridges-config';
import { BUTTON_TYPE } from '../../../game-boy/data/game-boy-data';
import { Timeout, TimeoutInstance } from '../../../../../core/helpers/timeout';

type Palette = {
  name: string;
  bg: number;
  bgBottom: number;
  body: number;
  accent: number;
  banner: number;
};

// Original tribute palettes — version colours only, no copyrighted artwork
// is drawn on the LCD (the 3D cartridge shells carry the real label scans).
const PALETTES: { [key: string]: Palette } = {
  [CARTRIDGE_TYPE.JpRed]:     { name: 'RED',     bg: 0xc62a22, bgBottom: 0x7d130f, body: 0xe8503a, accent: 0xffcf3a, banner: 0xa3160f },
  [CARTRIDGE_TYPE.JpGreen]:   { name: 'GREEN',   bg: 0x2f9a4f, bgBottom: 0x0f5a2a, body: 0x4fb86a, accent: 0xbff0a0, banner: 0x1d7a3a },
  [CARTRIDGE_TYPE.JpBlue]:    { name: 'BLUE',    bg: 0x1f5fbf, bgBottom: 0x0e2f73, body: 0x3aa0e8, accent: 0xbfe9ff, banner: 0x13418f },
  [CARTRIDGE_TYPE.JpPikachu]: { name: 'PIKACHU', bg: 0xf4b81e, bgBottom: 0x9c6c00, body: 0xffd23a, accent: 0xe8503a, banner: 0xc98a00 },
  [CARTRIDGE_TYPE.UsRed]:     { name: 'RED',     bg: 0xc62a22, bgBottom: 0x7d130f, body: 0xe8503a, accent: 0xffcf3a, banner: 0xa3160f },
  [CARTRIDGE_TYPE.UsBlue]:    { name: 'BLUE',    bg: 0x1f5fbf, bgBottom: 0x0e2f73, body: 0x3aa0e8, accent: 0xbfe9ff, banner: 0x13418f },
  [CARTRIDGE_TYPE.Pinball]:   { name: 'PINBALL', bg: 0xd94f8a, bgBottom: 0x6e1f42, body: 0xff7ab0, accent: 0xffd23a, banner: 0xa32a5e },
};

export default class PocketCreatures extends ScreenAbstract {
  private content: Container;
  private pressStart: Text;
  private blinkTimer: TimeoutInstance;

  constructor() {
    super();

    this.content = null;
    this.pressStart = null;
    this.blinkTimer = null;

    this.visible = false;
  }

  public show(): void {
    this.build();
    super.show();
    this.startBlink();
  }

  public hide(): void {
    this.stopTweens();
    super.hide();
  }

  public stopTweens(): void {
    if (this.blinkTimer) {
      this.blinkTimer.stop();
      this.blinkTimer = null;
    }
  }

  public onButtonPress(buttonType?: BUTTON_TYPE): void {
    if (this.pressStart && (buttonType === BUTTON_TYPE.Start || buttonType === BUTTON_TYPE.A)) {
      this.pressStart.visible = true;
    }
  }

  private startBlink(): void {
    if (!this.pressStart) {
      return;
    }

    const blink = () => {
      this.pressStart.visible = !this.pressStart.visible;
      this.blinkTimer = Timeout.call(550, blink);
    };

    blink();
  }

  private build(): void {
    if (this.content) {
      this.removeChild(this.content);
      this.content.destroy({ children: true });
    }

    const width: number = GAME_BOY_CONFIG.screen.width;
    const height: number = GAME_BOY_CONFIG.screen.height;
    const palette: Palette = PALETTES[GAME_BOY_CONFIG.currentCartridge] || PALETTES[CARTRIDGE_TYPE.JpRed];

    const content: Container = this.content = new Container();
    this.addChild(content);

    // background — two-tone, lighter top / darker ground
    const bg: Graphics = new Graphics();
    bg.rect(0, 0, width, height).fill(palette.bg);
    bg.rect(0, height * 0.66, width, height * 0.34).fill(palette.bgBottom);
    bg.ellipse(width * 0.5, height * 0.72, 52, 9).fill({ color: 0x000000, alpha: 0.18 });
    content.addChild(bg);

    // series wordmark
    content.addChild(this.makeText('POCKET', 22, 6, 0xffffff, 11));
    content.addChild(this.makeText('CREATURES', 22, 18, 0xffffff, 11));

    // capsule emblem (original split — not the trademarked ball)
    content.addChild(this.capsule(width - 26, 16, 9, palette.body));

    // original creature emblem
    content.addChild(this.creature(width * 0.5, 78, palette.body, palette.accent));

    // version banner
    const banner: Graphics = new Graphics();
    banner.roundRect(width * 0.5 - 56, 112, 112, 20, 4).fill(palette.banner).stroke({ width: 2, color: 0xffffff });
    content.addChild(banner);
    content.addChild(this.makeText(`${palette.name} VERSION`, width * 0.5, 116, 0xffffff, 9, 0.5));

    // press-start prompt
    this.pressStart = this.makeText('PRESS  START', width * 0.5, 136, 0xffffff, 7, 0.5);
    content.addChild(this.pressStart);
  }

  private makeText(text: string, x: number, y: number, fill: number, fontSize: number, anchorX: number = 0): Text {
    const t = new Text({
      text,
      style: { fontFamily: 'dogicapixel', fontSize, fill, align: 'center' },
    });

    t.anchor.set(anchorX, 0);
    t.x = x;
    t.y = y;

    return t;
  }

  private capsule(x: number, y: number, r: number, top: number): Graphics {
    const g = new Graphics();
    g.circle(x, y, r).fill(0xf4f4f4).stroke({ width: 1.5, color: 0x111111 });
    g.arc(x, y, r, Math.PI, Math.PI * 2).fill(top);
    g.rect(x - r, y - 1, r * 2, 2).fill(0x111111);
    g.circle(x, y, r * 0.32).fill(0xffffff).stroke({ width: 1.5, color: 0x111111 });

    return g;
  }

  // A small original monster: rounded body, ears, eyes, cheeks.
  private creature(x: number, y: number, body: number, accent: number): Graphics {
    const g = new Graphics();

    // ears
    g.poly([x - 18, y - 16, x - 26, y - 36, x - 6, y - 24]).fill(body);
    g.poly([x + 18, y - 16, x + 26, y - 36, x + 6, y - 24]).fill(body);
    // body
    g.ellipse(x, y, 26, 24).fill(body);
    g.ellipse(x, y + 6, 15, 14).fill({ color: 0xffffff, alpha: 0.85 });
    // cheeks
    g.circle(x - 17, y + 4, 4).fill({ color: accent, alpha: 0.85 });
    g.circle(x + 17, y + 4, 4).fill({ color: accent, alpha: 0.85 });
    // eyes
    g.circle(x - 9, y - 4, 4).fill(0x1a1a1a);
    g.circle(x + 9, y - 4, 4).fill(0x1a1a1a);
    g.circle(x - 10, y - 5, 1.4).fill(0xffffff);
    g.circle(x + 8, y - 5, 1.4).fill(0xffffff);
    // tail accent
    g.poly([x + 24, y + 6, x + 40, y - 2, x + 32, y + 12]).fill(accent);

    return g;
  }
}
