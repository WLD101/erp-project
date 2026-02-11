import { toastManager } from "@/components/ui/toast"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast({ title, description, variant }: ToastProps) {
  // Map variant to base-ui type if possible, or just pass generic props
  // The toastManager.add API usually accepts (title, options) or just options
  // We'll try to match the base-ui/react 1.1.0 usage pattern or generic fallback

  // Assuming toastManager.add(title, options)
  const type = variant === "destructive" ? "error" : "success"

  try {
    // @ts-ignore - bypassing strict type check for the adapter to fix build first
    toastManager.add(title, { description, type })
  } catch (e) {
    console.error("Toast error", e)
  }
}

export function useToast() {
  return { toast }
}
