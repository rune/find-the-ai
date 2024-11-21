import "./styles.css"
import musicUrl from "./assets/music.mp3"
import clickUrl from "./assets/click.mp3"

let currentScreen = "startScreen"

const MUSIC = new Audio()
MUSIC.src = musicUrl
const CLICK = new Audio()
CLICK.src = clickUrl

MUSIC.play()

function div(id: string): HTMLDivElement {
  return document.getElementById(id) as HTMLDivElement
}

function img(id: string): HTMLImageElement | undefined {
  return document.getElementById(id) as HTMLImageElement
}

div("startButton").addEventListener("click", () => {
  MUSIC.play()
  CLICK.play()

  Rune.actions.start()
})

function showScreen(screen: string) {
  if (screen !== currentScreen) {
    if (screen === "questionScreen") {
      ;(document.getElementById("playerInput") as HTMLTextAreaElement).value =
        ""
    }
    div(currentScreen).classList.add("disabled")
    div(currentScreen).classList.remove("enabled")

    currentScreen = screen

    div(currentScreen).classList.remove("off")
    div(currentScreen).classList.remove("disabled")
    div(currentScreen).classList.add("enabled")
  }
}

let gameStarted = false

setInterval(() => {
  if (currentScreen === "questionScreen") {
    Rune.actions.answer(
      (document.getElementById("playerInput") as HTMLTextAreaElement).value
    )
  }
}, 250)

let voters: Record<string, string> = {}
let selectedVote: string

Rune.initClient({
  onChange: ({ game, yourPlayerId }) => {
    if (!game.started) {
      gameStarted = false
      showScreen("startScreen")
    } else {
      if (!gameStarted) {
        gameStarted = true
        showScreen("questionScreen")
      }
    }

    const remaining = game.timerEndsAt - Rune.gameTime()
    const percent = (Math.max(0, remaining) / game.timerTotalTime) * 100 + "%"
    if (game.timerName === "question") {
      div("questionTimerBar").style.width = percent
      showScreen("questionScreen")
    }
    if (game.timerName === "voting") {
      div("voteTimerBar").style.width = percent
      if (currentScreen !== "voteScreen") {
        // create the answer buttons
        voters = {}
        selectedVote = ""
        div("voteButtons").innerHTML = ""
        for (const id of game.answerOrder) {
          const answer = game.answers[id]
          if (answer) {
            const voteButton = document.createElement("div")
            voteButton.classList.add("voteButton")
            const button = document.createElement("div")
            button.id = "button-" + id
            button.classList.add("button")
            button.classList.add("buttonOff")
            const buttonText = document.createElement("div")
            buttonText.classList.add("buttonText")
            buttonText.innerHTML = answer
            const voters = document.createElement("voters")
            voters.classList.add("voters")
            voters.id = "voters-" + id

            voteButton.appendChild(button)
            button.appendChild(buttonText)
            voteButton.appendChild(voters)

            div("voteButtons").appendChild(voteButton)

            voteButton.addEventListener("click", () => {
              Rune.actions.select(id)
            })
          }
        }
      }
      showScreen("voteScreen")
    }
    if (game.timerName === "scores") {
      div("answerTimerBar").style.width = percent
      if (currentScreen !== "answerScreen") {
        // update scores
        div("scoresInner").innerHTML = ""
        for (const id of Object.keys(game.scores)) {
          const scoreTotalValue = game.scores[id] ?? 0
          const thisRound = game.scoresThisRound[id] ?? 0
          const info = Rune.getPlayerInfo(id)

          if (info) {
            const score = document.createElement("div")
            score.classList.add("score")

            const img = document.createElement("img")
            img.src = info.avatarUrl
            img.classList.add("scoreAvatar")
            score.appendChild(img)

            const name = document.createElement("div")
            name.innerHTML = info.displayName
            name.classList.add("scoreName")
            score.appendChild(name)

            const scoreThisRound = document.createElement("div")
            scoreThisRound.innerHTML = "+" + thisRound
            scoreThisRound.classList.add("scoreThisRound")
            score.appendChild(scoreThisRound)

            const scoreTotal = document.createElement("div")
            scoreTotal.innerHTML = "" + scoreTotalValue
            scoreTotal.classList.add("scoreTotal")
            score.appendChild(scoreTotal)

            div("scoresInner").appendChild(score)
          }
        }
      }
      showScreen("answerScreen")
    }

    div("questionNumber").innerHTML = "Question " + game.questionNumber
    div("question").innerHTML = game.question
    div("voteQuestion").innerHTML = game.question
    div("correctAnswer").innerHTML = game.aiAnswer

    if (yourPlayerId) {
      const localSelected = game.selections[yourPlayerId]
      if (localSelected && localSelected !== selectedVote) {
        selectedVote = localSelected
        for (const button of div("voteButtons").getElementsByClassName(
          "buttonOn"
        )) {
          button.classList.remove("buttonOn")
          button.classList.add("buttonOff")
        }
        const selectedButton = document.getElementById("button-" + selectedVote)
        if (selectedButton) {
          selectedButton.classList.remove("buttonOff")
          selectedButton.classList.add("buttonOn")
        }
      }
    }
    for (const id of Object.keys(game.selections)) {
      if (voters[id] !== game.selections[id]) {
        voters[id] = game.selections[id]
        // change of vote
        const existing = img("vote-" + id)
        if (existing) {
          existing.parentNode?.removeChild(existing)
        }

        const info = Rune.getPlayerInfo(id)
        if (info) {
          const img = document.createElement("img")
          img.src = Rune.getPlayerInfo(id).avatarUrl
          img.classList.add("voter")
          img.id = "vote-" + id
          const voters = div("voters-" + game.selections[id])
          if (voters) {
            voters.appendChild(img)
          }
        }
      }
    }
  },
})
