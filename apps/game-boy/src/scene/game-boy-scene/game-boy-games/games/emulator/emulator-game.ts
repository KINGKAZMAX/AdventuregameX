import { Container, Graphics, Sprite, Text, Texture, CanvasSource, EventEmitter } from 'pixi.js';
import GameAbstract from '../game-abstract';
import { GAME_BOY_CONFIG } from '../../../game-boy/data/game-boy-config';
import { BUTTON_TYPE } from '../../../game-boy/data/game-boy-data';
import { SOUNDS_CONFIG } from '../../../../../Data/Configs/Main/sounds-config';
import { EMULATOR_GAMES_CONFIG, EmulatorGameConfig } from './emulator-games-config';
import { WasmBoy, WasmBoyJoypadState } from '../../../../../vendor/wasmboy/wasmboy.esm.js';
import type { LoadStateResult, SaveStateResult } from '../../save/save-state-result';

const JOYPAD_KEY_BY_BUTTON: { [key in BUTTON_TYPE]: keyof WasmBoyJoypadState } = {
  [BUTTON_TYPE.A]: 'A',
  [BUTTON_TYPE.B]: 'B',
  [BUTTON_TYPE.Start]: 'START',
  [BUTTON_TYPE.Select]: 'SELECT',
  [BUTTON_TYPE.CrossLeft]: 'LEFT',
  [BUTTON_TYPE.CrossRight]: 'RIGHT',
  [BUTTON_TYPE.CrossUp]: 'UP',
  [BUTTON_TYPE.CrossDown]: 'DOWN',
}

export default class EmulatorGame extends GameAbstract {
  public events: EventEmitter;

  private canvas: HTMLCanvasElement;
  private canvasSource: CanvasSource;
  private screenSprite: Sprite;
  private statusContainer: Container;
  private statusTitle: Text;
  private statusLine: Text;
  private joypadState: WasmBoyJoypadState;
  private bootId: number;
  private isRunning: boolean;
  private isBusy: boolean;

  constructor() {
    super();

    this.events = new EventEmitter();

    this.bootId = 0;
    this.isRunning = false;
    this.isBusy = false;

    this.joypadState = {
      UP: false, RIGHT: false, DOWN: false, LEFT: false,
      A: false, B: false, SELECT: false, START: false,
    };

    this.init();

    this.visible = false;
  }

  public show(): void {
    super.show();
    void this.boot();
  }

  public hide(): void {
    super.hide();

    this.bootId += 1;
    this.isRunning = false;
    this.resetJoypad();
    void this.stopEmulator();
  }

  public update(): void {
    if (this.isRunning) {
      this.canvasSource.update();
    }
  }

  public onButtonPress(buttonType: BUTTON_TYPE): void {
    this.setJoypadButton(buttonType, true);
  }

  public onButtonUp(buttonType: BUTTON_TYPE): void {
    this.setJoypadButton(buttonType, false);
  }

  public onVolumeChanged(): void {
    this.applyVolume();
  }

  public async saveState(): Promise<SaveStateResult> {
    if (!this.isRunning || this.isBusy) {
      return { status: 'unavailable' };
    }

    this.isBusy = true;

    try {
      await WasmBoy.pause();
      await WasmBoy.saveState();
      await WasmBoy.saveLoadedCartridge();
      await WasmBoy.play();
      return { status: 'saved' };
    } catch (error) {
      console.warn('EmulatorGame: save state failed', error);
      await this.tryResume();
      return { status: 'failed' };
    } finally {
      this.isBusy = false;
    }
  }

  public async loadState(): Promise<LoadStateResult> {
    if (!this.isRunning || this.isBusy) {
      return { status: 'unavailable' };
    }

    this.isBusy = true;

    try {
      await WasmBoy.pause();
      const saveStates = await WasmBoy.getSaveStates();

      if (!saveStates || saveStates.length === 0) {
        await WasmBoy.play();
        return { status: 'missing' };
      }

      const manualStates = saveStates.filter((state) => !state.isAuto);
      const candidates = manualStates.length > 0 ? manualStates : saveStates;
      const latest = candidates.reduce((a, b) => (a.date > b.date ? a : b));

      await WasmBoy.loadState(latest);
      await WasmBoy.play();
      this.resetJoypad();
      return { status: 'loaded' };
    } catch (error) {
      console.warn('EmulatorGame: load state failed', error);
      await this.tryResume();
      return { status: 'failed' };
    } finally {
      this.isBusy = false;
    }
  }

  private async boot(): Promise<void> {
    const bootId = this.bootId += 1;
    this.isRunning = false;
    this.resetJoypad();

    const cartridgeType: string = GAME_BOY_CONFIG.currentCartridge;
    const config: EmulatorGameConfig = EMULATOR_GAMES_CONFIG[cartridgeType];

    if (!config) {
      this.showStatus('UNKNOWN CARTRIDGE', '');
      return;
    }

    this.showStatus(config.title, 'LOADING...');
    this.screenSprite.visible = false;

    try {
      await WasmBoy.config({
        headless: false,
        isAudioEnabled: true,
        isGbcEnabled: true,
        gameboyFrameRate: 60,
        frameSkip: 0,
        audioBatchProcessing: true,
        audioAccumulateSamples: true,
        tileRendering: true,
        tileCaching: true,
        maxNumberOfAutoSaveStates: 3,
        disablePauseOnHidden: false,
      }, this.canvas);

      WasmBoy.disableDefaultJoypad();

      if (bootId !== this.bootId) {
        return;
      }

      await WasmBoy.loadROM(`${import.meta.env.BASE_URL}roms/${config.romFile}`);

      if (bootId !== this.bootId) {
        return;
      }

      await WasmBoy.play();

      if (bootId !== this.bootId) {
        await WasmBoy.pause();
        return;
      }

      WasmBoy.resumeAudioContext();
      this.applyVolume();

      this.isRunning = true;
      this.hideStatus();
      this.screenSprite.visible = true;
      this.events.emit('emulatorStarted', config.title);
    } catch (error) {
      console.warn('EmulatorGame: failed to boot ROM', error);

      if (bootId === this.bootId) {
        this.showStatus(config.title, 'LOAD ERROR');
      }
    }
  }

  private async stopEmulator(): Promise<void> {
    try {
      if (WasmBoy.isLoadedAndStarted()) {
        await WasmBoy.pause();
        await WasmBoy.saveLoadedCartridge();
      }
    } catch (error) {
      console.warn('EmulatorGame: failed to stop emulator', error);
    }
  }

  private async tryResume(): Promise<void> {
    try {
      if (this.isRunning) {
        await WasmBoy.play();
      }
    } catch (error) {
      console.warn('EmulatorGame: failed to resume', error);
    }
  }

  private setJoypadButton(buttonType: BUTTON_TYPE, isPressed: boolean): void {
    if (!this.isRunning) {
      return;
    }

    const joypadKey = JOYPAD_KEY_BY_BUTTON[buttonType];

    if (!joypadKey) {
      return;
    }

    this.joypadState[joypadKey] = isPressed;
    WasmBoy.setJoypadState(this.joypadState);
  }

  private resetJoypad(): void {
    for (const key in this.joypadState) {
      this.joypadState[key as keyof WasmBoyJoypadState] = false;
    }
  }

  private applyVolume(): void {
    try {
      const gain = SOUNDS_CONFIG.enabled ? SOUNDS_CONFIG.gameBoyVolume : 0;
      WasmBoy._getAudioChannels().master._setGain(gain);
    } catch (error) {
      // Audio context may not exist yet; volume is re-applied after boot.
    }
  }

  private showStatus(title: string, line: string): void {
    this.statusTitle.text = title;
    this.statusLine.text = line;
    this.statusContainer.visible = true;
  }

  private hideStatus(): void {
    this.statusContainer.visible = false;
  }

  private init(): void {
    this.initCanvas();
    this.initScreenSprite();
    this.initStatusScreen();
  }

  private initCanvas(): void {
    const canvas: HTMLCanvasElement = this.canvas = document.createElement('canvas');
    canvas.width = GAME_BOY_CONFIG.screen.width;
    canvas.height = GAME_BOY_CONFIG.screen.height;
  }

  private initScreenSprite(): void {
    this.canvasSource = new CanvasSource({ resource: this.canvas });
    const texture: Texture = new Texture({ source: this.canvasSource });

    const screenSprite: Sprite = this.screenSprite = new Sprite(texture);
    screenSprite.width = GAME_BOY_CONFIG.screen.width;
    screenSprite.height = GAME_BOY_CONFIG.screen.height;
    this.addChild(screenSprite);
  }

  private initStatusScreen(): void {
    const width: number = GAME_BOY_CONFIG.screen.width;
    const height: number = GAME_BOY_CONFIG.screen.height;

    const statusContainer: Container = this.statusContainer = new Container();
    this.addChild(statusContainer);

    const background: Graphics = new Graphics();
    background.rect(0, 0, width, height).fill(0x1a1a1a);
    statusContainer.addChild(background);

    this.statusTitle = new Text({
      text: '',
      style: { fontFamily: 'dogicapixel', fontSize: 8, fill: 0xffffff, align: 'center', wordWrap: true, wordWrapWidth: width - 20 },
    });
    this.statusTitle.anchor.set(0.5);
    this.statusTitle.x = width * 0.5;
    this.statusTitle.y = height * 0.5 - 12;
    statusContainer.addChild(this.statusTitle);

    this.statusLine = new Text({
      text: '',
      style: { fontFamily: 'dogicapixel', fontSize: 7, fill: 0xbdbdbd, align: 'center' },
    });
    this.statusLine.anchor.set(0.5);
    this.statusLine.x = width * 0.5;
    this.statusLine.y = height * 0.5 + 12;
    statusContainer.addChild(this.statusLine);

    statusContainer.visible = false;
  }
}
