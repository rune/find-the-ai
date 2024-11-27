import type { PlayerId, RuneClient } from "rune-sdk"
import { PROMPT } from "./prompt"

const AI_PLAYER_ID = "ai"
const QUESTION_TIME_LENGTH = 20000
const VOTE_TIME_LENGTH = 15000
const SCORE_TIME_LENGTH = 15000

export interface GameState {
  scores: Record<PlayerId, number>
  scoresThisRound: Record<PlayerId, number>
  answers: Record<string, string>
  aiAnswer: string
  answerOrder: string[]
  selections: Record<string, string>
  started: boolean
  questionNumber: number
  question: string
  timerTotalTime: number
  timerEndsAt: number
  timerName: string
  ready: Record<string, boolean>
}

type GameActions = {
  start: () => void
  answer: (answer: string) => void
  select: (id: string) => void
  ready: () => void
}

declare global {
  const Rune: RuneClient<GameState, GameActions>
}

function shuffle(array: string[]) {
  let currentIndex = array.length

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }
}

function startTimer(game: GameState, name: string, length: number) {
  game.timerName = name
  game.timerTotalTime = length
  game.timerEndsAt = Rune.gameTime() + length
}

function nextQuestion(game: GameState) {
  // prompt the AI for more info
  game.answers = {}
  game.question = ""
  game.questionNumber++
  game.ready = {}

  if (game.questionNumber > 10) {
    return
  }

  Rune.ai.promptRequest({ messages: [{ role: "system", content: PROMPT }] })
}

Rune.initLogic({
  minPlayers: 2,
  maxPlayers: 6,
  setup: () => {
    const game = {
      scores: {},
      answers: {},
      answerOrder: [],
      scoresThisRound: {},
      started: false,
      selections: {},
      questionNumber: 0,
      question: "",
      timerEndsAt: 0,
      timerTotalTime: 0,
      timerName: "",
      aiAnswer: "",
      ready: {},
    }

    nextQuestion(game)

    return game
  },
  ai: {
    promptResponse: ({ response }, { game }) => {
      const lines = response.split("\n")
      for (const line of lines) {
        if (line.startsWith("Question:")) {
          game.question = line.substring("Question:".length).trim()
        }
        if (line.startsWith("Answer:")) {
          game.answers[AI_PLAYER_ID] = line.substring("Answer:".length).trim()
        }
      }

      if (game.timerEndsAt === 0 && game.started) {
        // first timer on the first question
        startTimer(game, "question", QUESTION_TIME_LENGTH)
      }
    },
  },
  updatesPerSecond: 10,
  update: ({ game, allPlayerIds }) => {
    // we're going to run a timer
    if (Rune.gameTime() > game.timerEndsAt && game.timerEndsAt !== 0) {
      if (game.timerName === "question") {
        game.answerOrder = [...Object.keys(game.answers)]
        game.selections = {}
        shuffle(game.answerOrder)
        game.aiAnswer = game.answers[AI_PLAYER_ID]

        startTimer(game, "voting", VOTE_TIME_LENGTH)
      } else if (game.timerName === "voting") {
        // calc scores
        for (const id of allPlayerIds) {
          game.scoresThisRound[id] = 0
          if (game.selections[id] === AI_PLAYER_ID) {
            game.scoresThisRound[id]++
          }
          for (const otherId of allPlayerIds) {
            if (game.selections[otherId] === id && otherId !== id) {
              game.scoresThisRound[id]++
            }
          }
          game.scores[id] = (game.scores[id] ?? 0) + game.scoresThisRound[id]
        }

        startTimer(game, "scores", SCORE_TIME_LENGTH)
        nextQuestion(game)
      } else if (game.timerName === "scores") {
        if (game.questionNumber < 10) {
          startTimer(game, "question", QUESTION_TIME_LENGTH)
        } else {
          game.timerEndsAt = 0
        }
      }
    }
  },
  actions: {
    select: (id: string, { game, playerId }) => {
      // player selected a answer
      game.selections[playerId] = id
    },
    start: (_, { game }) => {
      if (!game.started) {
        // start the game once everyone is in
        game.started = true
        // first timer on the first question
        if (game.question.length !== 0) {
          startTimer(game, "question", QUESTION_TIME_LENGTH)
        }
      }
    },
    ready: (_, { game, playerId, allPlayerIds }) => {
      if (game.timerName === "question") {
        game.ready[playerId] = true

        for (const id of allPlayerIds) {
          if (!game.ready[id]) {
            return
          }
        }

        game.timerEndsAt = Rune.gameTime() + 1000
      }
    },
    answer: (answer: string, { game, playerId }) => {
      // provide an answer from a player
      game.answers[playerId] = answer
    },
  },
})
