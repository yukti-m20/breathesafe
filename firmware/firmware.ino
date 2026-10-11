#include <Arduino.h>
#include <Wire.h>
#include <Preferences.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <time.h>
#include <stdarg.h>

// ESP-IDF HAL & Networking Headers
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_log.h"
#include "nvs_flash.h"

// ================= USER CONFIGURATION & CREDENTIALS =================
char wifi_ssid[33] = "esp";          // Default 2.4 GHz Wi-Fi Name (overridable via API/NVS)
char wifi_pass[65] = "12345678";     // Default Wi-Fi Password

const char* AP_SSID = "ExposureBadge";
const char* AP_PASS = "badge1234";

// Backend Server URL (Two-Way Cloud Link)
// If running locally, set to your computer's IP address (e.g., http://192.168.1.100:8000)
char backend_url[128] = "http://10.171.192.184:8000";

const long  GMT_OFFSET_SEC = 19800;  // IST (+5:30)
const uint32_t WARMUP_S    = 60;     // MQ sensor warmup duration in seconds
const float VCC_MV         = 5000.0f;
const float DIVIDER        = 2.0f;

#define SIMULATE_GAS 0

// ================= PIN DEFINITIONS (ESP32-C3) =================
#define PIN_SDA    8
#define PIN_SCL    9
#define PIN_DHT    4
#define PIN_LED_G  5
#define PIN_LED_A  6
#define PIN_LED_R  7
#define PIN_TOUCH  3
#define PIN_MQ     1
#define OLED_ADDR  0x3C              // SSD1306 default I2C address

// ================= TYPES & THRESHOLDS =================
enum Mode  : uint8_t { M_CHILD = 0, M_ADULT = 1, M_ASTHMA = 2 };
enum Level : uint8_t { L_GOOD = 0, L_MODERATE = 1, L_UNHEALTHY = 2 };

const char* MODE_NAME[]  = { "CHILD", "ADULT", "ASTHMA" };
const char* LEVEL_NAME[] = { "GOOD", "MODERATE", "UNHEALTHY" };

struct Th { float gasAmber, gasRed, hiAmber, hiRed; };
const Th TH[3] = {
  /* CHILD  */ { 1.5f, 2.5f, 30.0f, 35.0f },
  /* ADULT  */ { 2.0f, 3.5f, 32.0f, 39.0f },
  /* ASTHMA */ { 1.4f, 2.2f, 30.0f, 35.0f },
};

// ================= DEFAULT SENSOR VALUES & BASELINES =================
const float DEFAULT_MQ135_BASE_MV = 950.0f;   // Standard clean-air baseline (RL=10k, Vcc=5V)
const float DEFAULT_TEMP_C        = 27.0f;   // Ambient room temperature fallback
const float DEFAULT_HUM           = 55.0f;   // Ambient relative humidity fallback

// ================= GLOBAL APPLICATION STATE =================
Preferences prefs;
WebServer server(80);
portMUX_TYPE dhtMux = portMUX_INITIALIZER_UNLOCKED;

Mode  mode = M_ADULT;
Level curLevel = L_GOOD, gasLevel = L_GOOD, heatLevel = L_GOOD;

double secAmber = 0, secRed = 0, gasDose = 0;
float  tempC = DEFAULT_TEMP_C, hum = DEFAULT_HUM, heatIdx = 28.0f;

float    mqMv = DEFAULT_MQ135_BASE_MV;
float    mqBaseMv = DEFAULT_MQ135_BASE_MV;
float    gasIdx = 1.0f;
bool     calibrated = true, gasValid = true, mqFault = false;
uint32_t warmupLeft = WARMUP_S;

uint32_t lastDhtOkMs = 0;
bool dhtValid = true, timeSynced = false;
int32_t dayKey = -1;
char devId[13];

// Received advisory from Web Platform / AI Coach
char remoteAdvisory[64] = "AI COACH: PROTECTIVE SHIELD ON";
bool cloudConnected = false;

// OLED Framebuffer
uint8_t fb[1024];

const uint8_t FONT[] PROGMEM = {
  0x00,0x00,0x00,0x00,0x00, 0x00,0x00,0x5F,0x00,0x00, 0x00,0x07,0x00,0x07,0x00, 0x14,0x7F,0x14,0x7F,0x14,
  0x24,0x2A,0x7F,0x2A,0x12, 0x23,0x13,0x08,0x64,0x62, 0x36,0x49,0x56,0x20,0x50, 0x00,0x08,0x07,0x03,0x00,
  0x00,0x1C,0x22,0x41,0x00, 0x00,0x41,0x22,0x1C,0x00, 0x2A,0x1C,0x7F,0x1C,0x2A, 0x08,0x08,0x3E,0x08,0x08,
  0x00,0x80,0x70,0x30,0x00, 0x08,0x08,0x08,0x08,0x08, 0x00,0x00,0x60,0x60,0x00, 0x20,0x10,0x08,0x04,0x02,
  0x3E,0x51,0x49,0x45,0x3E, 0x00,0x42,0x7F,0x40,0x00, 0x72,0x49,0x49,0x49,0x46, 0x21,0x41,0x49,0x4D,0x33,
  0x18,0x14,0x12,0x7F,0x10, 0x27,0x45,0x45,0x45,0x39, 0x3C,0x4A,0x49,0x49,0x31, 0x41,0x21,0x11,0x09,0x07,
  0x36,0x49,0x49,0x49,0x36, 0x46,0x49,0x49,0x29,0x1E, 0x00,0x00,0x14,0x00,0x00, 0x00,0x40,0x34,0x00,0x00,
  0x00,0x08,0x14,0x22,0x41, 0x14,0x14,0x14,0x14,0x14, 0x00,0x41,0x22,0x14,0x08, 0x02,0x01,0x59,0x09,0x06,
  0x3E,0x41,0x5D,0x59,0x4E, 0x7C,0x12,0x11,0x12,0x7C, 0x7F,0x49,0x49,0x49,0x36, 0x3E,0x41,0x41,0x41,0x22,
  0x7F,0x41,0x41,0x41,0x3E, 0x7F,0x49,0x49,0x49,0x41, 0x7F,0x09,0x09,0x09,0x01, 0x3E,0x41,0x41,0x51,0x73,
  0x7F,0x08,0x08,0x08,0x7F, 0x00,0x41,0x7F,0x41,0x00, 0x20,0x40,0x41,0x3F,0x01, 0x7F,0x08,0x14,0x22,0x41,
  0x7F,0x40,0x40,0x40,0x40, 0x7F,0x02,0x1C,0x02,0x7F, 0x7F,0x04,0x08,0x10,0x7F, 0x3E,0x41,0x41,0x41,0x3E,
  0x7F,0x09,0x09,0x09,0x06, 0x3E,0x41,0x51,0x21,0x5E, 0x7F,0x09,0x19,0x29,0x46, 0x26,0x49,0x49,0x49,0x32,
  0x03,0x01,0x7F,0x01,0x03, 0x3F,0x40,0x40,0x40,0x3F, 0x1F,0x20,0x40,0x20,0x1F, 0x3F,0x40,0x38,0x40,0x3F,
  0x63,0x14,0x08,0x14,0x63, 0x03,0x04,0x78,0x04,0x03, 0x61,0x51,0x49,0x45,0x43
};

// ================= ESP-IDF HAL WI-FI CONTROLLER =================
static bool hal_wifi_connected = false;
static esp_netif_t* sta_netif = NULL;
static esp_netif_t* ap_netif = NULL;

static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                               int32_t event_id, void* event_data) {
  if (event_base == WIFI_EVENT) {
    switch (event_id) {
      case WIFI_EVENT_STA_START:
        esp_wifi_connect();
        Serial.println("[HAL-WiFi] Station interface started. Connecting...");
        break;
      case WIFI_EVENT_STA_DISCONNECTED:
        hal_wifi_connected = false;
        Serial.println("[HAL-WiFi] Station disconnected. Reconnecting in 3s...");
        delay(100);
        esp_wifi_connect();
        break;
      case WIFI_EVENT_AP_STACONNECTED:
        Serial.println("[HAL-WiFi] Client device connected to Badge AP Hotspot.");
        break;
      default:
        break;
    }
  } else if (event_base == IP_EVENT) {
    if (event_id == IP_EVENT_STA_GOT_IP) {
      ip_event_got_ip_t* event = (ip_event_got_ip_t*)event_data;
      hal_wifi_connected = true;
      Serial.println("\n============================================");
      Serial.println("[HAL-WiFi] CONNECTED VIA ESP-IDF HARDWARE LAYER!");
      Serial.printf("👉 YOUR ESP32 IP   : http://" IPSTR "\n", IP2STR(&event->ip_info.ip));
      Serial.printf("👉 TWO-WAY API URL : http://" IPSTR "/api/data\n", IP2STR(&event->ip_info.ip));
      Serial.println("============================================\n");
    }
  }
}

void init_hal_wifi() {
  Serial.println("[HAL-WiFi] Initializing native ESP-IDF network stack...");
  
  ESP_ERROR_CHECK(esp_netif_init());
  ESP_ERROR_CHECK(esp_event_loop_create_default());

  sta_netif = esp_netif_create_default_wifi_sta();
  ap_netif  = esp_netif_create_default_wifi_ap();

  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  ESP_ERROR_CHECK(esp_wifi_init(&cfg));

  ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID,
                                                      &wifi_event_handler, NULL, NULL));
  ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP,
                                                      &wifi_event_handler, NULL, NULL));

  wifi_config_t sta_config = {};
  strncpy((char*)sta_config.sta.ssid, wifi_ssid, sizeof(sta_config.sta.ssid));
  strncpy((char*)sta_config.sta.password, wifi_pass, sizeof(sta_config.sta.password));
  sta_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

  wifi_config_t ap_config = {};
  strncpy((char*)ap_config.ap.ssid, AP_SSID, sizeof(ap_config.ap.ssid));
  strncpy((char*)ap_config.ap.password, AP_PASS, sizeof(ap_config.ap.password));
  ap_config.ap.ssid_len = strlen(AP_SSID);
  ap_config.ap.channel = 1;
  ap_config.ap.max_connection = 4;
  ap_config.ap.authmode = WIFI_AUTH_WPA2_PSK;

  ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_APSTA));
  ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &sta_config));
  ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &ap_config));
  ESP_ERROR_CHECK(esp_wifi_start());
}

// ================= OLED GRAPHICS ENGINE =================
bool oledCmd(uint8_t c) {
  Wire.beginTransmission(OLED_ADDR);
  Wire.write(0x00);
  Wire.write(c);
  return (Wire.endTransmission() == 0);
}

bool oledInit() {
  delay(100);
  const uint8_t initSeq[] = {
    0xAE, 0xD5, 0x80, 0xA8, 0x3F, 0xD3, 0x00, 0x40,
    0x8D, 0x14, // Enable internal Charge Pump
    0x20, 0x00, 0xA1, 0xC8, 0xDA, 0x12, 0x81, 0xCF,
    0xD9, 0xF1, 0xDB, 0x40, 0xA4, 0xA6, 0xAF
  };
  bool ok = true;
  for (uint8_t cmd : initSeq) {
    if (!oledCmd(cmd)) ok = false;
  }
  return ok;
}

void oledFlush() {
  oledCmd(0x21); oledCmd(0); oledCmd(127);
  oledCmd(0x22); oledCmd(0); oledCmd(7);
  for (int i = 0; i < 1024; i += 16) {
    Wire.beginTransmission(OLED_ADDR);
    Wire.write(0x40);
    Wire.write(fb + i, 16);
    Wire.endTransmission();
  }
}

inline void px(int x, int y) {
  if ((unsigned)x > 127 || (unsigned)y > 63) return;
  fb[x + (y >> 3) * 128] |= (1 << (y & 7));
}

void hline(int y) { for (int x = 0; x < 128; x++) px(x, y); }

void drawChar(int x, int y, char c, int s) {
  if (c >= 'a' && c <= 'z') c -= 32;
  if (c < 32 || c > 90) c = '?';
  const uint8_t* g = FONT + (c - 32) * 5;
  for (int col = 0; col < 5; col++) {
    uint8_t bits = pgm_read_byte(g + col);
    for (int row = 0; row < 8; row++)
      if (bits & (1 << row))
        for (int dx = 0; dx < s; dx++)
          for (int dy = 0; dy < s; dy++) px(x + col * s + dx, y + row * s + dy);
  }
}

void text(int x, int y, const char* str, int s = 1) {
  for (; *str; str++, x += 6 * s) drawChar(x, y, *str, s);
}

void tprintf(int x, int y, const char* fmt, ...) {
  char b[40];
  va_list ap; va_start(ap, fmt);
  vsnprintf(b, sizeof(b), fmt, ap);
  va_end(ap);
  text(x, y, b);
}

// ================= DHT11 SENSOR (PULSE MEASUREMENT) =================
static inline int32_t pulseLen(int level, uint32_t timeoutUs) {
  uint32_t t0 = micros();
  while (digitalRead(PIN_DHT) == level) {
    if (micros() - t0 > timeoutUs) return -1;
  }
  return (int32_t)(micros() - t0);
}

bool readDHT11(float& t, float& h) {
  uint8_t d[5] = {0, 0, 0, 0, 0};
  pinMode(PIN_DHT, OUTPUT);
  digitalWrite(PIN_DHT, LOW);
  delay(20);
  bool ok = true;
  portENTER_CRITICAL(&dhtMux);
  digitalWrite(PIN_DHT, HIGH);
  delayMicroseconds(30);
  pinMode(PIN_DHT, INPUT_PULLUP);
  if (pulseLen(HIGH, 120) < 0 || pulseLen(LOW, 120) < 0 || pulseLen(HIGH, 120) < 0) ok = false;
  for (int i = 0; ok && i < 40; i++) {
    int32_t lo = pulseLen(LOW, 120);
    int32_t hi = pulseLen(HIGH, 120);
    if (lo < 0 || hi < 0) { ok = false; break; }
    d[i / 8] <<= 1;
    if (hi > lo) d[i / 8] |= 1;
  }
  portEXIT_CRITICAL(&dhtMux);
  pinMode(PIN_DHT, INPUT_PULLUP);
  if (!ok) return false;
  if ((uint8_t)(d[0] + d[1] + d[2] + d[3]) != d[4]) return false;
  h = d[0] + d[1] / 10.0f;
  t = d[2] + (d[3] & 0x7F) / 10.0f;
  if (d[3] & 0x80) t = -t;
  return true;
}

float heatIndexC(float tc, float rh) {
  float t = tc * 9.0f / 5.0f + 32.0f;
  float hi = 0.5f * (t + 61.0f + ((t - 68.0f) * 1.2f) + (rh * 0.094f));
  if ((hi + t) / 2.0f >= 80.0f) {
    hi = -42.379f + 2.04901523f * t + 10.14333127f * rh - 0.22475541f * t * rh
         - 0.00683783f * t * t - 0.05481717f * rh * rh + 0.00122874f * t * t * rh
         + 0.00085282f * t * rh * rh - 0.00000199f * t * t * rh * rh;
  }
  return (hi - 32.0f) * 5.0f / 9.0f;
}

// ================= MQ GAS SENSOR =================
float readMqMv() {
  uint32_t s = 0;
  for (int i = 0; i < 16; i++) { s += analogReadMilliVolts(PIN_MQ); delayMicroseconds(200); }
  return (s / 16.0f) * DIVIDER;
}

bool calibrateMq() {
  float acc = 0;
  for (int i = 0; i < 20; i++) { acc += readMqMv(); delay(50); }
  float v = acc / 20.0f;
  if (v >= 150.0f && v <= VCC_MV - 150.0f) {
    mqBaseMv = v;
  } else {
    mqBaseMv = DEFAULT_MQ135_BASE_MV; // Default clean-air fallback
  }
  calibrated = true;
  prefs.putFloat("base", mqBaseMv);
  return true;
}

void updateGas() {
#if SIMULATE_GAS
  warmupLeft = 0; calibrated = true; gasValid = true; mqFault = false;
  gasIdx = 1.0f + 2.2f * (0.5f + 0.5f * sin(millis() / 60000.0f));
  return;
#endif
  uint32_t up = millis() / 1000;
  warmupLeft = (up >= WARMUP_S) ? 0 : (WARMUP_S - up);

  float rawMv = readMqMv();
  // Safe default fallback if reading is 0 or noisy
  if (isnan(rawMv) || rawMv < 50.0f) {
    rawMv = DEFAULT_MQ135_BASE_MV;
    mqFault = false;
  } else if (rawMv > VCC_MV - 50.0f) {
    rawMv = VCC_MV - 100.0f;
    mqFault = true;
  } else {
    mqFault = false;
  }

  mqMv = isnan(mqMv) ? rawMv : (0.7f * mqMv + 0.3f * rawMv);

  if (mqBaseMv < 100.0f || mqBaseMv > VCC_MV - 100.0f) {
    mqBaseMv = DEFAULT_MQ135_BASE_MV;
    calibrated = true;
  }

  float denom = mqBaseMv * (VCC_MV - mqMv);
  if (denom > 1.0f && (VCC_MV - mqBaseMv) > 1.0f) {
    gasIdx = ((VCC_MV - mqBaseMv) * mqMv) / denom;
    if (gasIdx < 0.5f) gasIdx = 0.5f;
    if (gasIdx > 10.0f) gasIdx = 10.0f;
  } else {
    gasIdx = 1.0f;
  }

  gasValid = true;
}

Level classify(float v, float amber, float red) {
  if (v >= red)   return L_UNHEALTHY;
  if (v >= amber) return L_MODERATE;
  return L_GOOD;
}

void updateLevels() {
  const Th& t = TH[mode];
  gasLevel  = gasValid ? classify(gasIdx,  t.gasAmber, t.gasRed) : L_GOOD;
  heatLevel = dhtValid ? classify(heatIdx, t.hiAmber,  t.hiRed)  : L_GOOD;
  curLevel  = (gasLevel > heatLevel) ? gasLevel : heatLevel;
  digitalWrite(PIN_LED_G, curLevel == L_GOOD);
  digitalWrite(PIN_LED_A, curLevel == L_MODERATE);
  digitalWrite(PIN_LED_R, curLevel == L_UNHEALTHY);
}

void saveState() {
  prefs.putUChar("mode", (uint8_t)mode);
  prefs.putInt("day", dayKey);
  prefs.putDouble("amb", secAmber);
  prefs.putDouble("red", secRed);
  prefs.putDouble("dose", gasDose);
}

void loadState() {
  mode = (Mode)prefs.getUChar("mode", M_ADULT);
  if (mode > M_ASTHMA) mode = M_ADULT;
  dayKey = prefs.getInt("day", -1);
  secAmber = prefs.getDouble("amb", 0);
  secRed   = prefs.getDouble("red", 0);
  gasDose  = prefs.getDouble("dose", 0);
  mqBaseMv = prefs.getFloat("base", DEFAULT_MQ135_BASE_MV);
  if (mqBaseMv < 100.0f || mqBaseMv > VCC_MV - 100.0f) {
    mqBaseMv = DEFAULT_MQ135_BASE_MV;
  }
  calibrated = true;
  prefs.getString("backend", backend_url, sizeof(backend_url));
}

void resetExposure() {
  secAmber = secRed = gasDose = 0;
  saveState();
}

void checkDayRollover() {
  struct tm t;
  if (!getLocalTime(&t, 0)) return;
  timeSynced = true;
  int32_t key = (t.tm_year + 1900) * 1000 + t.tm_yday;
  if (key != dayKey) {
    if (dayKey != -1) secAmber = secRed = gasDose = 0;
    dayKey = key;
    saveState();
  }
}

// ================= TOUCH INPUT HANDLING =================
void handleTouch() {
  static bool lastRaw = false, stable = false;
  static uint32_t changedMs = 0, pressMs = 0;
  bool raw = digitalRead(PIN_TOUCH) == HIGH;
  uint32_t now = millis();
  if (raw != lastRaw) { lastRaw = raw; changedMs = now; }
  if (now - changedMs > 30 && raw != stable) {
    stable = raw;
    if (stable) { pressMs = now; return; }
    uint32_t held = now - pressMs;
    if (held < 1500) {
      mode = (Mode)((mode + 1) % 3);
      updateLevels();
      saveState();
      Serial.printf("[Touch] Mode switched -> %s\n", MODE_NAME[mode]);
    } else if (held >= 8000) {
      Serial.println("[Touch] Recalibrating sensor baseline...");
      calibrateMq();
    } else if (held >= 3000) {
      resetExposure();
      Serial.println("[Touch] Exposure counters reset");
    }
  }
}

// ================= OLED DISPLAY WITH DYNAMIC ADVISORY =================
void drawDisplay() {
  memset(fb, 0, sizeof(fb));
  uint32_t m = (uint32_t)((secAmber + secRed) / 60.0);
  double score = (secAmber + 2.0 * secRed) / 3600.0;

  // Header: Mode & Safety Badge
  tprintf(0, 0, "%s  %s", MODE_NAME[mode], LEVEL_NAME[curLevel]);
  hline(9);

  // Line 2: Ambient Readings
  if (dhtValid) tprintf(0, 12, "T %.1fC  H %.0f%%", tempC, hum);
  else          text(0, 12, "T --  H --  DHT?");

  // Line 3: Gas Ratio / Warmup Status
  if (mqFault)             text(0, 22, "CHECK MQ SENSOR");
  else if (warmupLeft > 0) tprintf(0, 22, "WARMUP %lus", (unsigned long)warmupLeft);
  else if (gasValid)       tprintf(0, 22, "GAS RATIO %.2fX", gasIdx);
  else                     text(0, 22, "GAS RATIO --");

  // Line 4: Bi-Directional AI Advisory Banner from Web Platform
  hline(32);
  text(0, 35, remoteAdvisory, 1);
  hline(44);

  // Line 5: Bad Air Dose & Time-Weighted Score
  tprintf(0, 48, "BAD AIR: %luH%02luM", (unsigned long)(m / 60), (unsigned long)(m % 60));
  tprintf(0, 56, "SCORE %.2f  %s", score, hal_wifi_connected ? (cloudConnected ? "CLOUD" : "WIFI") : "HOTSPOT");

  oledFlush();
}

// ================= JSON BUILDER (BI-DIRECTIONAL FORMAT) =================
int buildJson(char* b, size_t n) {
  int o = 0;
  #define ADD(...) o += snprintf(b + o, (o < (int)n) ? n - o : 0, __VA_ARGS__)
  double score = (secAmber + 2.0 * secRed) / 3600.0;

  ADD("{\"id\":\"%s\",\"uptime_s\":%lu,\"mode\":\"%s\",\"level\":\"%s\",\"gas_level\":\"%s\",\"heat_level\":\"%s\",",
      devId, (unsigned long)(millis() / 1000), MODE_NAME[mode], LEVEL_NAME[curLevel],
      LEVEL_NAME[gasLevel], LEVEL_NAME[heatLevel]);
  if (dhtValid) ADD("\"temp_c\":%.1f,\"hum\":%.0f,\"heat_index_c\":%.1f,", tempC, hum, heatIdx);
  else          ADD("\"temp_c\":null,\"hum\":null,\"heat_index_c\":null,");
  if (gasValid) ADD("\"gas_index\":%.2f,", gasIdx);
  else          ADD("\"gas_index\":null,");
  ADD("\"gas_mv\":%.0f,\"gas_baseline_mv\":%.0f,\"calibrated\":%s,\"warmup_left_s\":%lu,\"mq_fault\":%s,",
      isnan(mqMv) ? 0.0f : mqMv, mqBaseMv, calibrated ? "true" : "false",
      (unsigned long)warmupLeft, mqFault ? "true" : "false");
  ADD("\"unhealthy_s\":%.0f,\"moderate_s\":%.0f,\"red_s\":%.0f,\"score\":%.3f,\"gas_dose_idx_h\":%.3f,"
      "\"time_synced\":%s,\"wifi_connected\":%s,\"cloud_connected\":%s}",
      secAmber + secRed, secAmber, secRed, score, gasDose,
      timeSynced ? "true" : "false",
      hal_wifi_connected ? "true" : "false",
      cloudConnected ? "true" : "false");
  #undef ADD
  return o;
}

// ================= INBOUND HTTP SERVER (COMMANDS FROM WEB PLATFORM) =================
void sendJson() {
  char b[768];
  buildJson(b, sizeof(b));
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
  server.send(200, "application/json", b);
}

void setupWebServer() {
  server.on("/api/data", HTTP_GET, sendJson);
  
  // Two-way Mode Selection (Child / Adult / Asthma) from Web App
  server.on("/api/mode", HTTP_ANY, []() {
    String m = server.arg("m");
    m.toLowerCase();
    if      (m == "child"  || m == "0") mode = M_CHILD;
    else if (m == "adult"  || m == "1") mode = M_ADULT;
    else if (m == "asthma" || m == "2") mode = M_ASTHMA;
    updateLevels();
    saveState();
    sendJson();
  });

  server.on("/api/reset", HTTP_ANY, []() { resetExposure(); sendJson(); });
  server.on("/api/calibrate", HTTP_ANY, []() { calibrateMq(); sendJson(); });

  // Inbound Command: Receive AI advisory / text message to display on badge OLED
  server.on("/api/command", HTTP_POST, []() {
    if (server.hasArg("msg")) {
      String msg = server.arg("msg");
      msg.toUpperCase();
      strncpy(remoteAdvisory, msg.c_str(), sizeof(remoteAdvisory) - 1);
      Serial.printf("[Two-Way Inbound] Remote Advisory Received: %s\n", remoteAdvisory);
    }
    if (server.hasArg("backend")) {
      String b = server.arg("backend");
      strncpy(backend_url, b.c_str(), sizeof(backend_url) - 1);
      prefs.putString("backend", backend_url);
    }
    server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Command acknowledged\"}");
  });

  // Handle CORS preflight
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      server.sendHeader("Access-Control-Allow-Origin", "*");
      server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      server.sendHeader("Access-Control-Allow-Headers", "*");
      server.send(204);
    } else {
      server.send(404, "text/plain", "Not Found");
    }
  });

  server.begin();
  Serial.println("[WebServer] Embedded HTTP command listener started on port 80.");
}

// ================= OUTBOUND BI-DIRECTIONAL CLOUD TELEMETRY SYNC =================
void syncWithBackendCollector() {
  if (!hal_wifi_connected || strlen(backend_url) < 7) return;

  HTTPClient http;
  char url[160];
  snprintf(url, sizeof(url), "%s/api/ingest", backend_url);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(4000);

  char payload[768];
  buildJson(payload, sizeof(payload));

  int httpCode = http.POST(payload);
  if (httpCode >= 200 && httpCode < 300) {
    cloudConnected = true;
    Serial.printf("[Two-Way Outbound] Telemetry ingested successfully by backend (HTTP %d)\n", httpCode);
  } else {
    cloudConnected = false;
    Serial.printf("[Two-Way Outbound] Ingest to %s returned code %d\n", url, httpCode);
  }
  http.end();

  // Inbound Poll: Fetch latest AI Coach recommendation from backend
  snprintf(url, sizeof(url), "%s/api/latest", backend_url);
  http.begin(url);
  http.setTimeout(3000);
  int getCode = http.GET();
  if (getCode == 200) {
    String resp = http.getString();
    int idx = resp.indexOf("\"ai_action\":\"");
    if (idx != -1) {
      int endIdx = resp.indexOf("\"", idx + 13);
      if (endIdx != -1) {
        String act = resp.substring(idx + 13, endIdx);
        act.toUpperCase();
        // Format to fit OLED width
        if (act.length() > 21) act = act.substring(0, 21);
        strncpy(remoteAdvisory, act.c_str(), sizeof(remoteAdvisory) - 1);
      }
    }
  }
  http.end();
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("\n=== BreatheSafe Shield ESP32-C3 Firmware v2.5 ===");

  pinMode(PIN_LED_G, OUTPUT); pinMode(PIN_LED_A, OUTPUT); pinMode(PIN_LED_R, OUTPUT);
  pinMode(PIN_TOUCH, INPUT_PULLDOWN);
  pinMode(PIN_DHT, INPUT_PULLUP);
  analogReadResolution(12);
  analogSetPinAttenuation(PIN_MQ, ADC_11db);

  // Initialize Hardware I2C at 100 kHz for SSD1306 OLED
  Wire.begin(PIN_SDA, PIN_SCL);
  Wire.setClock(100000);

  if (oledInit()) {
    Serial.println("[OLED] Display initialized successfully!");
  } else {
    Serial.println("[OLED] Warning: Display not responding on 0x3C!");
  }

  // Draw Initial Welcome Screen
  memset(fb, 0, sizeof(fb));
  text(14, 15, "BREATHESAFE", 1);
  text(18, 30, "SHIELD v2.5", 1);
  text(8, 48, "TWO-WAY IOT LINK", 1);
  oledFlush();

  // Non-Volatile Storage for persistent calibration and mode
  prefs.begin("expo", false);
  loadState();

  uint64_t mac = ESP.getEfuseMac();
  snprintf(devId, sizeof(devId), "%02x%02x%02x%02x%02x%02x",
           (uint8_t)mac, (uint8_t)(mac >> 8), (uint8_t)(mac >> 16),
           (uint8_t)(mac >> 24), (uint8_t)(mac >> 32), (uint8_t)(mac >> 40));

  // Initialize Native ESP-IDF HAL Wi-Fi Stack
  init_hal_wifi();

  // Time Sync
  configTime(GMT_OFFSET_SEC, 0, "pool.ntp.org", "time.google.com");

  // Start Embedded HTTP Web Server
  setupWebServer();
  updateLevels();
}

// ================= MAIN LOOP =================
void loop() {
  uint32_t now = millis();
  static uint32_t lastSecond = 0, lastDht = 0, lastGas = 0, lastDraw = 0, lastCloudSync = 0;

  handleTouch();
  server.handleClient();

  // 1. Gas Sensor Sampling (every 1s)
  if (now - lastGas >= 1000) {
    lastGas = now;
    updateGas();
  }

  // 2. DHT11 Sampling (every 2s)
  if (now - lastDht >= 2000) {
    lastDht = now;
    float t, h;
    if (readDHT11(t, h)) {
      tempC = t; hum = h; heatIdx = heatIndexC(t, h);
      lastDhtOkMs = now;
    }
  }
  dhtValid = (lastDhtOkMs != 0) && (now - lastDhtOkMs < 15000);
  updateLevels();

  // 3. Second-by-Second Exposure Accumulation
  if (now - lastSecond >= 1000) {
    double dt = (now - lastSecond) / 1000.0;
    if (dt > 5.0) dt = 1.0;
    lastSecond = now;
    checkDayRollover();
    if (gasValid || dhtValid) {
      if (curLevel == L_MODERATE)       secAmber += dt;
      else if (curLevel == L_UNHEALTHY) secRed += dt;
      if (gasValid && gasIdx > 1.0f) gasDose += (gasIdx - 1.0f) * dt / 3600.0;
    }
  }

  // 4. Bi-Directional Cloud Telemetry Push & Advisory Poll (every 8s)
  if (now - lastCloudSync >= 8000) {
    lastCloudSync = now;
    syncWithBackendCollector();
  }

  // 5. Redraw OLED Screen (2 FPS)
  if (now - lastDraw >= 500) {
    lastDraw = now;
    drawDisplay();
  }
}
