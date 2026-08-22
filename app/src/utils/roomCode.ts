// src/utils/roomCode.ts
// Tạo room code ngẫu nhiên 6 ký tự dùng chữ hoa + số, dễ đọc

const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // bỏ các ký tự dễ nhầm (0,O,I,1)

export function generateRoomCode(length = 6): string {
  let code = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  for (const byte of array) {
    code += SAFE_CHARS[byte % SAFE_CHARS.length]
  }
  return code
}
