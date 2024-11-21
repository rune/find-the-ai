import "./styles.css";

let currentScreen = "startScreen";

function div(id: string): HTMLDivElement {
  return document.getElementById(id) as HTMLDivElement;
}

div("startButton").addEventListener("click", () => {
  Rune.actions.start();
});

function showScreen(screen: string) {
  if (screen !== currentScreen) {
    div(currentScreen).classList.add("disabled");
    div(currentScreen).classList.remove("enabled");

    currentScreen = screen;

    div(currentScreen).classList.remove("off");
    div(currentScreen).classList.remove("disabled");
    div(currentScreen).classList.add("enabled");
  }
}

let gameStarted = false;

Rune.initClient({
  onChange: ({ game, yourPlayerId, action }) => {
    if (!game.started) {
      gameStarted = false;
      showScreen("startScreen");
    } else {
      if (!gameStarted) {
        gameStarted = true;
        showScreen("questionScreen");
      }
    }
  },
});
