import Alpine from "alpinejs/src"
// import anchor from "@alpinejs/anchor/src"
// import focus from "@alpinejs/focus/src"
// import collapse from "@alpinejs/collapse/src"

// Alpine.plugin(anchor)
// Alpine.plugin(focus)
// Alpine.plugin(collapse)

const components = []
const stores = []

// registerStore("isDev", window.isDev)

document.addEventListener("alpine:init", () => {
  stores.forEach((store) => {
    Alpine.store(store.name, store.data)
  })

  components.forEach((component) => {
    if (typeof component.data === "function") {
      Alpine.data(component.name, component.data)

      return
    }

    Alpine.data(component.name, () =>
      Object.create(
        Object.getPrototypeOf(component.data),
        Object.getOwnPropertyDescriptors(component.data),
      ),
    )
  })
})

window.onload = () => {
  Alpine.start()

  // needed for Alpine devtools
  window.Alpine = Alpine
}

export function registerComponent(name, data) {
  if (components.find((component) => component.name === name)) {
    return
  }

  components.push({ name, data })
}

export function registerStore(name, data) {
  if (stores.find((store) => store.name === name)) {
    return
  }

  stores.push({ name, data })
}
