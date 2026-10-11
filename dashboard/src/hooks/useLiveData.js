import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchLatest } from '../lib/api'

const WS_URL = `ws://${window.location.hostname}:8000/ws`
const POLL_INTERVAL = 8000
const WS_RECONNECT_DELAY = 3000

export function useLiveData() {
  const [data, setData] = useState(null)
  const [connected, setConnected] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const wsRef = useRef(null)
  const pollTimerRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const usingWs = useRef(false)

  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return
    const poll = async () => {
      try {
        const d = await fetchLatest()
        setData(d)
        setConnected(true)
      } catch {
        setConnected(false)
      }
    }
    poll()
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const connectWs = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState < 2) return

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        setConnected(true)
        usingWs.current = true
        stopPolling()
      }

      ws.onmessage = (evt) => {
        try {
          const d = JSON.parse(evt.data)
          setData(d)
          setConnected(true)
        } catch {
          // ignore bad frames
        }
      }

      ws.onclose = () => {
        setWsConnected(false)
        usingWs.current = false
        startPolling()
        reconnectTimerRef.current = setTimeout(() => {
          connectWs()
        }, WS_RECONNECT_DELAY)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      startPolling()
    }
  }, [startPolling, stopPolling])

  useEffect(() => {
    connectWs()

    return () => {
      if (wsRef.current) wsRef.current.close()
      stopPolling()
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    }
  }, [connectWs, stopPolling])

  return { data, connected, wsConnected }
}
