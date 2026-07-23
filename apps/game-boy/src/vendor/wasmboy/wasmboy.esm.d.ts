// Hand-written types for the vendored WasmBoy 0.7.1 ESM bundle
// (dist/wasmboy.wasm.esm.js from the npm "wasmboy" package, GPL-3.0-or-later,
// https://github.com/torch2424/wasmBoy). Only the API surface GameX uses is typed.

export interface WasmBoyJoypadState {
  UP: boolean;
  RIGHT: boolean;
  DOWN: boolean;
  LEFT: boolean;
  A: boolean;
  B: boolean;
  SELECT: boolean;
  START: boolean;
}

export interface WasmBoyOptions {
  headless?: boolean;
  disablePauseOnHidden?: boolean;
  isAudioEnabled?: boolean;
  gameboyFrameRate?: number;
  frameSkip?: number;
  isGbcEnabled?: boolean;
  audioBatchProcessing?: boolean;
  graphicsBatchProcessing?: boolean;
  timersBatchProcessing?: boolean;
  graphicsDisableScanlineRendering?: boolean;
  audioAccumulateSamples?: boolean;
  tileRendering?: boolean;
  tileCaching?: boolean;
  maxNumberOfAutoSaveStates?: number;
  updateGraphicsCallback?: ((imageDataArray: Uint8ClampedArray) => void) | null;
  updateAudioCallback?: ((audioContext: AudioContext, audioBufferSourceNode: AudioBufferSourceNode) => AudioNode | void) | null;
  saveStateCallback?: ((saveState: WasmBoySaveState) => void) | null;
  onReady?: (() => void) | null;
  onPlay?: (() => void) | null;
  onPause?: (() => void) | null;
  onLoadedAndStarted?: (() => void) | null;
}

export interface WasmBoySaveState {
  wasmboyMemory: unknown;
  date: number;
  isAuto?: boolean;
  [key: string]: unknown;
}

export interface WasmBoyAudioChannel {
  muted: boolean;
  mute(): void;
  unmute(): void;
  _setGain(gain: number): void;
}

export interface WasmBoyAudioChannels {
  master: WasmBoyAudioChannel;
  channel1: WasmBoyAudioChannel;
  channel2: WasmBoyAudioChannel;
  channel3: WasmBoyAudioChannel;
  channel4: WasmBoyAudioChannel;
}

export interface WasmBoyApi {
  config(options?: WasmBoyOptions, canvas?: HTMLCanvasElement): Promise<void>;
  setCanvas(canvas: HTMLCanvasElement): Promise<void>;
  getCanvas(): HTMLCanvasElement;
  loadROM(rom: string | ArrayBuffer | Uint8Array | File): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  reset(): Promise<void>;
  isPlaying(): boolean;
  isPaused(): boolean;
  isReady(): boolean;
  isLoadedAndStarted(): boolean;
  getFPS(): number;
  setSpeed(speed: number): void;
  isGBC(): Promise<boolean>;
  saveState(): Promise<WasmBoySaveState>;
  getSaveStates(): Promise<WasmBoySaveState[]>;
  loadState(saveState: WasmBoySaveState): Promise<void>;
  deleteState(saveState: WasmBoySaveState): Promise<void>;
  saveLoadedCartridge(additionalInfo?: object): Promise<unknown>;
  deleteSavedCartridge(cartridge: unknown): Promise<unknown>;
  getSavedMemory(): Promise<unknown[]>;
  setJoypadState(state: WasmBoyJoypadState): void;
  enableDefaultJoypad(): void;
  disableDefaultJoypad(): void;
  resumeAudioContext(): void;
  getVersion(): string;
  _getAudioChannels(): WasmBoyAudioChannels;
}

export declare const WasmBoy: WasmBoyApi;
