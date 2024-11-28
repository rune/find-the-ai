import css from "./styles.css?raw"
const ALL_ASSETS = import.meta.glob("./assets/**/*", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>

const ASSETS: Record<string, string> = {}

for (const key in ALL_ASSETS) {
  ASSETS[key.substring("./".length)] = ALL_ASSETS[key]
}

export async function preloadStyleImages() {
  const images = css.matchAll(/url\(.*?(gif|png|jpg|jpeg|ttf)[^)]*'?\)/g)
  const array = [...images]

  const promises = []
  for (const img of array) {
    let url = img[0].substring(4, img[0].length - 1)
    if (url.startsWith('"') || url.startsWith("'")) {
      url = url.substring(1)
    }
    if (url.endsWith('"') || url.endsWith("'")) {
      url = url.substring(0, url.length - 1)
    }
    if (url.startsWith("./")) {
      url = url.substring(2)
    }
    promises.push(
      new Promise<void>((resolve) => {
        if (url.indexOf(".ttf") >= 0) {
          const fontFile = new FontFace("Test", "url(" + ASSETS[url] + ")")
          fontFile
            .load()
            .then(() => {
              resolve()
            })
            .catch((e) => {
              console.error("Failed to load: " + url + "(" + ASSETS[url] + ")")
              console.error(e)
              resolve()
            })
        } else {
          const image = new Image()
          image.src = ASSETS[url]
          image.addEventListener("load", () => {
            resolve()
          })
          image.addEventListener("error", (e) => {
            console.error("Failed to pre-cache: " + url)
            console.error(e)
            resolve()
          })
        }
      })
    )
  }
  await Promise.all(promises)
}
