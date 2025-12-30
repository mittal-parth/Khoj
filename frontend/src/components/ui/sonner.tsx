import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { ToasterProps } from "../../types"


const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      {...props}
    />
  )
}

export { Toaster }
