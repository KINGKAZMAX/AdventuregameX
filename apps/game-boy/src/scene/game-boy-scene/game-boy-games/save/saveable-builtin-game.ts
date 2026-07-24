interface SaveableBuiltinGame<State> {
  captureState(): State;
  restoreState(state: State): boolean;
}

export type { SaveableBuiltinGame };
