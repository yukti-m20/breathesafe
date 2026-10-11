const BASE = ''

export const fetchLatest = () =>
  fetch(`${BASE}/api/latest`).then(r => r.json())

export const fetchHistory = (hours = 24) =>
  fetch(`${BASE}/api/history?hours=${hours}`).then(r => r.json())

export const fetchStatus = () =>
  fetch(`${BASE}/api/status`).then(r => r.json())

export const setMode = (m) =>
  fetch(`${BASE}/api/mode?m=${m}`, { method: 'POST' }).then(r => r.json())

export const calibrate = () =>
  fetch(`${BASE}/api/calibrate`, { method: 'POST' }).then(r => r.json())

export const resetToday = () =>
  fetch(`${BASE}/api/reset`, { method: 'POST' }).then(r => r.json())

export const fetchForecast = (city = 'Delhi NCR', mode = 'adult') =>
  fetch(`${BASE}/api/forecast?city=${encodeURIComponent(city)}&mode=${encodeURIComponent(mode)}`).then(r => r.json())

export const calculateExposure = (city, mode, blocks) =>
  fetch(`${BASE}/api/exposure-calc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ city, mode, blocks })
  }).then(r => r.json())

export const askAiCoach = (query, city, mode, lang = 'en', scoreContext = '', forecastContext = '') =>
  fetch(`${BASE}/api/coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      city,
      mode,
      lang,
      score_context: scoreContext,
      forecast_context: forecastContext
    })
  }).then(r => r.json())

export const ingestReading = (data) =>
  fetch(`${BASE}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json())

export const triggerEmergencyCall = (phoneNumber, reason, city = 'Delhi NCR', mode = 'adult', lang = 'en', autoTrigger = false) =>
  fetch(`${BASE}/api/trigger-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: phoneNumber,
      reason,
      city,
      mode,
      lang,
      auto_trigger: autoTrigger
    })
  }).then(r => r.json())

export const fetchCallLogs = () =>
  fetch(`${BASE}/api/calls`).then(r => r.json())
export const saveTwilioConfig = (accountSid, authToken, fromNumber) =>
  fetch(`${BASE}/api/twilio-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_sid: accountSid,
      auth_token: authToken,
      from_number: fromNumber
    })
  }).then(r => r.json())