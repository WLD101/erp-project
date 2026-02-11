import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to the main ERP dashboard application
  redirect('/dashboard')
}
