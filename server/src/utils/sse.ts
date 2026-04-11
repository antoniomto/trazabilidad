import { Response } from 'express'

interface SSEClient {
  id: string
  userId: string
  res: Response
}

const clients: Map<string, SSEClient> = new Map()

export function addSSEClient(clientId: string, userId: string, res: Response) {
  clients.set(clientId, { id: clientId, userId, res })

  // Heartbeat every 15s to survive Railway/Render proxy timeouts
  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat)
      clients.delete(clientId)
      return
    }
    res.write(': heartbeat\n\n')
  }, 15000)

  res.on('close', () => {
    clearInterval(heartbeat)
    clients.delete(clientId)
  })
}

export function broadcastAlert(alert: object) {
  const data = `data: ${JSON.stringify(alert)}\n\n`
  clients.forEach((client) => {
    if (!client.res.writableEnded) {
      client.res.write(`event: alert\n`)
      client.res.write(data)
    }
  })
}

export function getClientCount() {
  return clients.size
}
