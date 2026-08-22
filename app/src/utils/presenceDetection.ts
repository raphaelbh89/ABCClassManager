// src/utils/presenceDetection.ts
// Phát hiện "có người / không có người" theo từng ô ghế
// Góc chụp mặc định: Đứng tại BỤC GIẢNG / BẢNG ĐEN nhìn xuống toàn lớp học
// KHÔNG dùng nhận diện khuôn mặt — chỉ phân tích variance màu/độ sáng theo vị trí ghế

export type SeatPresence = 'present' | 'absent' | 'unsure'
export type CameraAngle = 'from_board' | 'from_back'

export interface SeatZone {
  row: number
  col: number
  x: number
  y: number
  w: number
  h: number
}

export interface PresenceResult {
  row: number
  col: number
  presence: SeatPresence
  variance: number
}

/**
 * Tính variance của độ sáng trong 1 vùng canvas.
 * Variance cao → nhiều chi tiết/chuyển động → có học sinh ngồi.
 * Variance thấp → đồng nhất → ghế trống.
 */
function computeBrightnessVariance(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
): number {
  if (w <= 0 || h <= 0) return 0
  const imageData = ctx.getImageData(x, y, w, h)
  const pixels = imageData.data
  const total = pixels.length / 4

  let sum = 0
  const brightness: number[] = []
  for (let i = 0; i < pixels.length; i += 4) {
    const b = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
    brightness.push(b)
    sum += b
  }
  const mean = sum / total

  let varSum = 0
  for (const b of brightness) {
    varSum += (b - mean) ** 2
  }
  return varSum / total
}

/**
 * Phân tích ảnh chụp lớp học theo lưới sơ đồ ghế.
 *
 * 📐 Góc chụp chuẩn: Đứng tại BỤC GIẢNG / BẢNG ĐEN nhìn xuống:
 * - Đáy bức ảnh (gần camera nhất) = Hàng 0 (Bàn đầu tiên).
 * - Đỉnh bức ảnh (xa camera nhất) = Hàng cuối (Bàn cuối lớp).
 * - Bên trái bức ảnh = Dãy trái (Cột 0).
 * - Bên phải bức ảnh = Dãy phải (Cột cuối).
 */
export function analyzeClassPhoto(
  canvas: HTMLCanvasElement,
  rows: number,
  cols: number,
  options: {
    threshold?: number
    cameraAngle?: CameraAngle
    roi?: { top: number; left: number; bottom: number; right: number }
  } = {}
): PresenceResult[] {
  const ctx = canvas.getContext('2d')
  if (!ctx) return []

  const threshold = options.threshold ?? 180
  const cameraAngle = options.cameraAngle ?? 'from_board' // Mặc định từ bục giảng nhìn xuống
  const roi = options.roi ?? { top: 0.05, left: 0.05, bottom: 0.95, right: 0.95 }

  const imgW = canvas.width
  const imgH = canvas.height

  const roiX = Math.floor(roi.left * imgW)
  const roiY = Math.floor(roi.top * imgH)
  const roiW = Math.floor((roi.right - roi.left) * imgW)
  const roiH = Math.floor((roi.bottom - roi.top) * imgH)

  const cellW = Math.floor(roiW / cols)
  const cellH = Math.floor(roiH / rows)

  const results: PresenceResult[] = []

  for (let gridY = 0; gridY < rows; gridY++) {
    for (let gridX = 0; gridX < cols; gridX++) {
      const pad = Math.min(Math.floor(cellW * 0.1), Math.floor(cellH * 0.1), 8)
      const x = roiX + gridX * cellW + pad
      const y = roiY + gridY * cellH + pad
      const w = cellW - pad * 2
      const h = cellH - pad * 2

      const variance = computeBrightnessVariance(ctx, x, y, w, h)

      let presence: SeatPresence
      if (variance > threshold * 1.3) {
        presence = 'present'
      } else if (variance < threshold * 0.6) {
        presence = 'absent'
      } else {
        presence = 'unsure'
      }

      // Mapping từ tọa độ trên ảnh sang Hàng trong sơ đồ lớp:
      // Khi chụp từ bục giảng: gridY ở đáy ảnh (gridY = rows - 1) là Bàn đầu tiên (row = 0)
      const seatRow = cameraAngle === 'from_board' ? (rows - 1 - gridY) : gridY
      const seatCol = gridX

      results.push({ row: seatRow, col: seatCol, presence, variance })
    }
  }

  return results
}

/**
 * Vẽ overlay kết quả lên canvas để kiểm tra trực quan
 */
export function drawPresenceOverlay(
  canvas: HTMLCanvasElement,
  results: PresenceResult[],
  rows: number,
  cols: number,
  cameraAngle: CameraAngle = 'from_board',
  roi = { top: 0.05, left: 0.05, bottom: 0.95, right: 0.95 }
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const imgW = canvas.width
  const imgH = canvas.height
  const roiX = roi.left * imgW
  const roiY = roi.top * imgH
  const roiW = (roi.right - roi.left) * imgW
  const roiH = (roi.bottom - roi.top) * imgH
  const cellW = roiW / cols
  const cellH = roiH / rows

  const colorMap: Record<SeatPresence, string> = {
    present: 'rgba(76,175,130,0.45)',
    absent:  'rgba(255,82,82,0.40)',
    unsure:  'rgba(255,179,71,0.45)',
  }
  const borderMap: Record<SeatPresence, string> = {
    present: '#4CAF82',
    absent:  '#FF5252',
    unsure:  '#FFB347',
  }

  ctx.save()
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const res of results) {
    // Chuyển ngược seatRow sang vị trí vẽ trên ảnh
    const gridY = cameraAngle === 'from_board' ? (rows - 1 - res.row) : res.row
    const gridX = res.col

    const x = roiX + gridX * cellW
    const y = roiY + gridY * cellH

    ctx.fillStyle = colorMap[res.presence]
    ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4)

    ctx.strokeStyle = borderMap[res.presence]
    ctx.lineWidth = 2
    ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4)

    // Nhãn vị trí ghế
    const icon = res.presence === 'present' ? `✓ H${res.row + 1}` : res.presence === 'absent' ? `✗ H${res.row + 1}` : `? H${res.row + 1}`
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(icon, x + cellW / 2, y + cellH / 2)
  }

  // Vẽ nhãn chỉ dẫn phương hướng trên ảnh overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, imgW, 24)
  ctx.fillStyle = '#FFD54F'
  ctx.font = 'bold 11px sans-serif'
  ctx.fillText('⬆️ PHÍA SAU LỚP HỌC (BÀN CUỐI)', imgW / 2, 12)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, imgH - 24, imgW, 24)
  ctx.fillStyle = '#81C784'
  ctx.fillText('⬇️ VỊ TRÍ BẢNG ĐEN / BỤC GIẢNG (BÀN ĐẦU)', imgW / 2, imgH - 12)

  ctx.restore()
}
