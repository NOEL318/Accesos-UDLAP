import {
  Salad,
  Sandwich,
  Soup,
  Drumstick,
  CupSoda,
  Leaf,
  Beef,
  Milk,
  Book,
  Notebook,
  BookMarked,
  BookOpen,
  Library,
  UtensilsCrossed,
} from "lucide-react"
import type { ComponentProps } from "react"

type IconProps = ComponentProps<typeof Salad>

// devuelve el icono lucide para un platillo del comedor segun su nombre
export function getComidaIcon(name: string | undefined, props?: IconProps) {
  const size = props?.size ?? 24
  switch (name) {
    case "salad":
      return <Salad size={size} className="text-green-500" {...props} />
    case "sandwich":
      return <Sandwich size={size} className="text-amber-500" {...props} />
    case "soup":
      return <Soup size={size} className="text-red-500" {...props} />
    case "drumstick":
      return <Drumstick size={size} className="text-orange-500" {...props} />
    case "juice":
      return <CupSoda size={size} className="text-pink-500" {...props} />
    case "vegan":
      return <Leaf size={size} className="text-green-600" {...props} />
    case "burger":
      return <Beef size={size} className="text-amber-700" {...props} />
    case "smoothie":
      return <Milk size={size} className="text-green-400" {...props} />
    default:
      return <UtensilsCrossed size={size} className="text-gray-400" {...props} />
  }
}

// devuelve el icono lucide para una portada de libro segun su nombre
export function getLibroIcon(name: string | undefined, props?: IconProps) {
  const size = props?.size ?? 24
  switch (name) {
    case "book-blue":
      return <Book size={size} className="text-blue-500" {...props} />
    case "book-green":
      return <Book size={size} className="text-green-500" {...props} />
    case "book-orange":
      return <Book size={size} className="text-orange-500" {...props} />
    case "book-red":
      return <Book size={size} className="text-red-500" {...props} />
    case "book-black":
      return <Notebook size={size} className="text-gray-700" {...props} />
    case "book-brown":
      return <BookMarked size={size} className="text-amber-700" {...props} />
    case "book-yellow":
      return <BookOpen size={size} className="text-yellow-500" {...props} />
    default:
      return <Library size={size} className="text-gray-400" {...props} />
  }
}
