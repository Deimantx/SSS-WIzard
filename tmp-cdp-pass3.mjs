const targets = await (await fetch('http://127.0.0.1:9224/json')).json()
const target = targets.find((entry) => entry.type === 'page' && entry.url.startsWith('http://127.0.0.1:5173'))
if (!target) throw new Error('Combat page target not found')

const socket = new WebSocket(target.webSocketDebuggerUrl)
let nextId = 0
const pending = new Map()
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  const resolve = pending.get(message.id)
  if (!resolve) return
  pending.delete(message.id)
  resolve(message)
})
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

const call = (method, params = {}) => new Promise((resolve) => {
  const id = ++nextId
  pending.set(id, resolve)
  socket.send(JSON.stringify({ id, method, params }))
})

const expression = `(() => ({
  title: document.title,
  url: location.href,
  text: document.body.innerText.slice(0, 1200),
  combat: Boolean(document.querySelector('.combat-screen')),
  deck: Boolean(document.querySelector('.combat-spell-deck')),
  tiles: document.querySelectorAll('.spell-combat-tile').length
}))()`
const result = await call('Runtime.evaluate', { expression, returnByValue: true })
console.log(JSON.stringify(result.result?.result?.value ?? result))
socket.close()
