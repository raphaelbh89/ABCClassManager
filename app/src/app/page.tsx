// src/app/page.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  if (userId) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
