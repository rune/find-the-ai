import type { PlayerId, RuneClient } from "rune-sdk";

const AI_PLAYER_ID = "ai";

export interface GameState {
  scores: Record<PlayerId, number>;
  answers: Record<string, string>;
  selections: Record<string, string>;
  started: boolean;
}

type GameActions = {
  start: () => void;
  answer: (answer: string) => void;
  select: (id: string) => void;
};

declare global {
  const Rune: RuneClient<GameState, GameActions>;
}

function nextQuestion() {
  // prompt the AI for more info
}

Rune.initLogic({
  minPlayers: 1,
  maxPlayers: 6,
  setup: () => {
    nextQuestion()

    return {
      scores: {},
      answers: {},
      started: false,
      selections: {},
    };
  },
  ai: {
    promptResponse: ({ response }, { game }) => {
    },
  },
  updatesPerSecond: 10,
  update: () => {
    // we're going to run a time
  },
  actions: {
    select: (id: string, { game, playerId }) => {
      // player selected a answer
      game.selections[playerId] = id;
    },
    start: (_, { game }) => {
      // start the game once everyone is in
      game.started = true;
    },
    answer: (answer: string, { game, playerId }) => {
      // provide an answer from a player
      game.answers[playerId] = answer;
    }
  },
});
