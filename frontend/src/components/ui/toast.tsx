import { toast as sonnerToast } from "sonner"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Info, AlertCircle } from "lucide-react"
import * as React from "react"

type ToastOptions = Parameters<typeof sonnerToast>[1] & {
  description?: string
}

const createToastWithAlert = (
  icon: React.ReactNode,
  title: string,
  variant: "default" | "destructive" = "default",
  options?: ToastOptions
) => {
  const { description, ...toastOptions } = options || {}
  
  return sonnerToast.custom(
    () => (
      <Alert variant={variant}>
        {icon}
        <AlertTitle>{title}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
      </Alert>
    ),
    {
      ...toastOptions,
      // When updating a loading toast (has id), explicitly set a finite duration and make it dismissible
      // Loading toasts have duration: Infinity by default, so we need to override it
      duration: toastOptions?.id && !toastOptions?.duration ? 4000 : (toastOptions?.duration ?? 4000),
      dismissible: true,
    }
  )
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return createToastWithAlert(
      <CheckCircle2 />,
      message,
      "default",
      options
    )
  },
  error: (message: string, options?: ToastOptions) => {
    return createToastWithAlert(
      <XCircle />,
      message,
      "destructive",
      options
    )
  },
  info: (message: string, options?: ToastOptions) => {
    return createToastWithAlert(
      <Info />,
      message,
      "default",
      options
    )
  },
  warning: (message: string, options?: ToastOptions) => {
    return createToastWithAlert(
      <AlertCircle />,
      message,
      "default",
      options
    )
  },
  loading: (message: string, options?: ToastOptions) => {
    // Keep loading toasts as regular sonner toasts since they're often updated by ID
    return sonnerToast.loading(message, options)
  },
  // Expose other sonner methods as needed
  custom: sonnerToast.custom,
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
}

