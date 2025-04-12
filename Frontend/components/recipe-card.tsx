import Image from "next/image"
import Link from "next/link"
import { Star, MessageSquare, BarChart } from "lucide-react"
import { DietaryLabel } from "./dietary-icon"

type DietaryType =
  | "Vegan"
  | "Vegetarian"
  | "Gluten-Free"
  | "Dairy-Free"
  | "Nut-Free"
  | "Egg-Free"
  | "Fish-Free"
  | "Meat-Free"

interface RecipeCardProps {
  id: string
  title: string
  image: string
  tags: string[]
  dietaryRestrictions?: DietaryType[]
  rating: number
  commentCount: number
  difficulty?: string
}

export default function RecipeCard({
  id,
  title,
  image,
  tags,
  dietaryRestrictions = [],
  rating,
  commentCount,
  difficulty = "Intermediate",
}: RecipeCardProps) {
  return (
    <Link href={`/recipe/${id}`}>
      <div className="relative h-80 rounded-xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300">
        {/* Background Image */}
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />

        {/* Top Content: Title, Rating, Difficulty */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-gaya text-xl text-white line-clamp-2 pr-2">{title}</h3>

            {/* Dietary Restrictions */}
            {dietaryRestrictions.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end">
                {dietaryRestrictions.slice(0, 2).map((restriction) => (
                  <DietaryLabel key={restriction} type={restriction} />
                ))}
                {dietaryRestrictions.length > 2 && (
                  <div className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
                    <span className="text-xs font-matina">+{dietaryRestrictions.length - 2}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
              <span className="font-matina text-sm text-white">{rating.toFixed(1)}</span>
            </div>

            <div className="flex items-center bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
              <BarChart className="h-3 w-3 text-white mr-1" />
              <span className="font-matina text-xs text-white">{difficulty}</span>
            </div>
          </div>
        </div>

        {/* Bottom Content: Comments Count and Tags */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end">
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 text-white mr-1" />
            <span className="font-matina text-sm text-white">{commentCount} comments</span>
          </div>

          <div className="flex flex-wrap justify-end">
            {tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="bg-[#32c94e] text-white text-xs font-matina px-2 py-1 rounded-full ml-1 mb-1"
              >
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="bg-white/20 text-white text-xs font-matina px-2 py-1 rounded-full ml-1 mb-1 backdrop-blur-sm">
                +{tags.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
