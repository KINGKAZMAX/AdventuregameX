import { Container, Sprite, EventEmitter, Spritesheet, Texture } from 'pixi.js';
import Loader from '../../../../../../../../core/loader';
import { SPACE_INVADERS_CONFIG } from '../../../data/space-invaders-config';

export default class PlayerLives extends Container {
  public events: EventEmitter;

  private lives: number;
  private livesViews: Sprite[];

  constructor() {
    super();

    this.events = new EventEmitter();

    this.lives = SPACE_INVADERS_CONFIG.player.livesAtStart;
    this.livesViews = [];

    this.init();
  }

  public loseLife(): void {
    this.lives--;

    const lifeView: Sprite | undefined = this.livesViews.pop();
    if (lifeView) {
      this.removeChild(lifeView);
    }

    if (this.lives === 0) {
      this.events.emit('gameOver');
    }
  }

  public reset(): void {
    this.restoreState(SPACE_INVADERS_CONFIG.player.livesAtStart);
  }

  public captureState(): number {
    return this.lives;
  }

  public restoreState(lives: number): void {
    this.lives = lives;
    this.livesViews.forEach((lifeView) => this.removeChild(lifeView));
    this.livesViews = [];

    for (let i = 0; i < lives; i++) {
      const lifeView = this.createLifeView();
      this.addChild(lifeView);
      lifeView.x = i * 10;
      this.livesViews.push(lifeView);
    }
  }

  private init(): void {
    for (let i = 0; i < SPACE_INVADERS_CONFIG.player.livesAtStart; i++) {
      const lifeView: Sprite = this.createLifeView();
      this.addChild(lifeView);

      lifeView.x = i * 10;

      this.livesViews.push(lifeView);
    }
  }

  private createLifeView(): Sprite {
    const spriteSheet: Spritesheet = Loader.assets['assets/spritesheets/space-invaders-sheet'] as Spritesheet;
    const texture: Texture = spriteSheet.textures['player.png'] as Texture;
    const view: Sprite = new Sprite(texture);

    return view;
  }
}
