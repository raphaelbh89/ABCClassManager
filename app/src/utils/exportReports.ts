// src/utils/exportReports.ts
// Xuất báo cáo Điểm danh & Đánh giá học sinh ra file Excel và PDF
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import type { Student, AttendanceSession } from '@/types'

/** Xuất danh sách học sinh & điểm số ra file Excel (.xlsx) */
export function exportStudentsToExcel(
  className: string,
  students: Student[],
  scoreMap: Record<string, number> = {}
) {
  const data = students.map((s, idx) => ({
    STT: idx + 1,
    'Họ và Tên': s.name,
    'Vị trí ghế': s.seat_row != null ? `Hàng ${s.seat_row + 1} - Cột ${(s.seat_col ?? 0) + 1}` : 'Chưa xếp',
    'Điểm RPG': scoreMap[s.id] || 0,
    'Cấp độ': Math.min(5, Math.floor((scoreMap[s.id] || 0) / 100) + 1),
    'Trạng thái': s.is_active ? 'Đang học' : 'Đã nghỉ',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DanhSachHocSinh')

  const fileName = `Danh_Sach_Hoc_Sinh_${className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

/** Xuất báo cáo điểm danh ra file Excel (.xlsx) */
export function exportAttendanceToExcel(
  className: string,
  students: Student[],
  sessions: AttendanceSession[]
) {
  const data = sessions.map(session => {
    const presentCount = session.records?.filter(r => r.status === 'present').length || 0
    const absentCount = session.records?.filter(r => r.status === 'absent').length || 0
    const lateCount = session.records?.filter(r => r.status === 'late').length || 0

    return {
      'Ngày điểm danh': session.date,
      'Tổng học sinh': students.length,
      'Có mặt': presentCount,
      'Vắng mặt': absentCount,
      'Đi trễ': lateCount,
      'Tỷ lệ chuyên cần': `${Math.round((presentCount / (students.length || 1)) * 100)}%`,
      'Trạng thái': session.confirmed_at ? 'Đã xác nhận' : 'Chưa xác nhận',
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'LichSuDiemDanh')

  const fileName = `Bao_Cao_Diem_Danh_${className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

/** Xuất phiếu báo cáo tổng kết lớp học ra file PDF */
export function exportSummaryPDF(
  className: string,
  teacherName: string,
  studentsCount: number,
  averageAttendanceRate: number
) {
  const doc = new jsPDF()

  doc.setFontSize(20)
  doc.text('BAO CAO TONG KET LOP HOC', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.text(`Lop hoc: ${className}`, 20, 40)
  doc.text(`Giao vien chu nhiem: ${teacherName}`, 20, 50)
  doc.text(`Ngay xuat bao cao: ${new Date().toLocaleDateString('vi-VN')}`, 20, 60)

  doc.setLineWidth(0.5)
  doc.line(20, 65, 190, 65)

  doc.setFontSize(14)
  doc.text('1. Thong ke Si so & Chuyen can', 20, 75)

  doc.setFontSize(11)
  doc.text(`- Tong so hoc sinh trong danh sach: ${studentsCount} hoc sinh`, 25, 85)
  doc.text(`- Ty le chuyen can trung binh: ${averageAttendanceRate}%`, 25, 95)

  doc.setFontSize(14)
  doc.text('2. Danh gia & Game hoa lop hoc (RPG Stats)', 20, 110)
  doc.setFontSize(11)
  doc.text('- Cac tieu chi theo doi: Hoc tap, Ky luat, Hop tac nhom, Sang tao, Chuyen can', 25, 120)
  doc.text('- Ung dung: ClassManager Pro (Display + Mobile Scanner)', 25, 130)

  doc.text('Nguoi lap bao cao', 150, 160, { align: 'center' })
  doc.text('(Ky va ghi ro ho ten)', 150, 168, { align: 'center' })
  doc.text(teacherName, 150, 195, { align: 'center' })

  const fileName = `Bao_Cao_${className.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)
}
