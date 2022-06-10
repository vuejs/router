export let delay = (t: number = 100) =>
  new Promise(resolve => setTimeout(resolve, t))

export async function getData() {
  await delay(500)

  return {
    message: 'Hello',
    time: Date.now(),
  }
}
