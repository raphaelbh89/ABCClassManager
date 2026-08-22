// src/utils/colorDetection.ts
// Thuật toán nhận diện thẻ màu của học sinh client-side qua Canvas API & HSV Color Space
// Không gửi ảnh lên server, xử lý tức thì trên điện thoại giáo viên.

export type CardColor = 'red' | 'green' | 'yellow' | 'blue' | 'unknown'

export interface ColorThresholds {
  // Hue ranges (0 - 360)
  red: [number, number][] // Red nằm ở 2 đầu: 0-20 và 330-360
  green: [number, number]
  yellow: [number, number]
  blue: [number, number]
  // Saturation & Value min
  minSaturation: number // 0 - 1
  minValue: number // 0 - 1
}

export const DEFAULT_THRESHOLDS: ColorThresholds = {
  red: [
    [0, 20],
    [330, 360],
  ],
  green: [80, 160],
  yellow: [35, 75],
  blue: [180, 260],
  minSaturation: 0.35,
  minValue: 0.3,
}

/** Chuyển đổi RGB sang HSV (Hue: 0-360, Saturation: 0-1, Value: 0-1) */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  const s = max === 0 ? 0 : diff / max
  const v = max

  if (diff !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / diff) % 6)
    } else if (max === g) {
      h = 60 * ((b - r) / diff + 2)
    } else {
      h = 60 * ((r - g) / diff + 4)
    }
  }

  if (h < 0) h += 360
  return [h, s, v]
}

/** Phân loại 1 pixel sang màu thẻ */
export function classifyColor(
  h: number,
  s: number,
  v: number,
  thresholds: ColorThresholds = DEFAULT_THRESHOLDS
): CardColor {
  if (s < thresholds.minSaturation || v < thresholds.minValue) {
    return 'unknown'
  }

  // Check Red
  for (const [minH, maxH] of thresholds.red) {
    if (h >= minH && h <= maxH) return 'red'
  }

  // Check Green
  if (h >= thresholds.green[0] && h <= thresholds.green[1]) return 'green'

  // Check Yellow
  if (h >= thresholds.yellow[0] && h <= thresholds.yellow[1]) return 'yellow'

  // Check Blue
  if (h >= thresholds.blue[0] && h <= thresholds.blue[1]) return 'blue'

  return 'unknown'
}

export interface ScanResult {
  counts: {
    red: number
    green: number
    yellow: number
    blue: number
  }
  totalDetected: number
}

/**
 * Quét toàn bộ frame từ video / canvas và đếm số lượng cụm thẻ màu.
 * Lấy mẫu cách pixel (stride) để tăng tốc độ xử lý 60fps trên điện thoại.
 */
export function scanCardColors(
  canvas: HTMLCanvasElement,
  thresholds: ColorThresholds = DEFAULT_THRESHOLDS,
  sampleStep = 8
): ScanResult {
  const ctx = canvas.getContext('2d')
  if (!ctx) return { counts: { red: 0, green: 0, yellow: 0, blue: 0 }, totalDetected: 0 }

  const width = canvas.width
  const height = canvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data

  let redPixels = 0
  let greenPixels = 0
  let yellowPixels = 0
  let bluePixels = 0

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      const [h, s, v] = rgbToHsv(r, g, b)
      const color = classifyColor(h, s, v, thresholds)

      if (color === 'red') redPixels++
      else if (color === 'green') greenPixels++
      else if (color === 'yellow') yellowPixels++
      else if (color === 'blue') bluePixels++
    }
  }

  // Chuyển đổi số lượng pixel ước lượng thành số thẻ (ước tính trung bình 1 thẻ giơ lên chiếm ~150-300 pixel sample)
  const PIXELS_PER_CARD = 120

  const counts = {
    red: Math.round(redPixels / PIXELS_PER_CARD),
    green: Math.round(greenPixels / PIXELS_PER_CARD),
    yellow: Math.round(yellowPixels / PIXELS_PER_CARD),
    blue: Math.round(bluePixels / PIXELS_PER_CARD),
  }

  const totalDetected = counts.red + counts.green + counts.yellow + counts.blue

  return { counts, totalDetected }
}
