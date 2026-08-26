// Smoke test bulk awards endpoint
async function main() {
  const students = ['st-3', 'st-4']
  const body = {
    session_type: 'game',
    awards: students.map(sid => ({ student_id: sid, score: 5, note: '[TEST] Diem tham gia' })),
  }
  const res = await fetch('http://localhost:3005/api/evaluations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  console.log('status:', res.status)
  console.log(await res.json())

  // Virtual id should be skipped
  const res2 = await fetch('http://localhost:3005/api/evaluations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_type: 'game',
      awards: [{ student_id: 'p1', score: 10, note: 'x' }, { student_id: 'st-5', score: 5, note: '[TEST] Diem tham gia' }],
    }),
  })
  console.log('virtual-id test:', await res2.json())
}
main().catch(e => { console.error(e); process.exit(1) })
