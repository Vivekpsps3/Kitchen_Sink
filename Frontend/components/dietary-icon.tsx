import { Leaf, Wheat, Nut, Milk, Fish, Egg, Beef } from "lucide-react"

type DietaryType =
  | "Vegan"
  | "Vegetarian"
  | "Gluten-Free"
  | "Dairy-Free"
  | "Nut-Free"
  | "Egg-Free"
  | "Fish-Free"
  | "Meat-Free"

interface DietaryIconProps {
  type: DietaryType
  className?: string
}

export function DietaryIcon({ type, className = "" }: DietaryIconProps) {
  switch (type) {
    case "Vegan":
      return <Leaf className={`${className}`} />
    case "Vegetarian":
      return <Leaf className={`${className}`} />
    case "Gluten-Free":
      return <Wheat className={`${className}`} />
    case "Dairy-Free":
      return <Milk className={`${className}`} />
    case "Nut-Free":
      return <Nut className={`${className}`} />
    case "Egg-Free":
      return <Egg className={`${className}`} />
    case "Fish-Free":
      return <Fish className={`${className}`} />
    case "Meat-Free":
      return <Beef className={`${className}`} />
    default:
      return null
  }
}

export function DietaryLabel({ type, className = "" }: DietaryIconProps) {
  return (
    <div className={`flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full ${className}`}>
      <DietaryIcon type={type} className="h-3 w-3" />
      <span className="text-xs font-matina">{type}</span>
    </div>
  )
}
