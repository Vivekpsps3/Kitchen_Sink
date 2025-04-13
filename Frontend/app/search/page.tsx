"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Heart, IceCreamCone, Salad, Clock, Carrot, Beef, Fish, Search, Wand2, Sunrise, Sun, MoonStar } from "lucide-react"
import RecipeCard from "@/components/recipe-card"
import Navbar from "@/components/navbar"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams } from "next/navigation"

interface Category {
  id: string
  icon: React.ReactNode
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const searchQuery = searchParams.q || ""
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const categories: Category[] = [
    { id: "liked", icon: <Heart className="h-6 w-6 text-pink-500" /> },
    { id: "quick & easy", icon: <Clock className="h-6 w-6" /> },
    { id: "healthy", icon: <Carrot className="h-6 w-6" /> },
    { id: "vegetarian", icon: <Salad className="h-6 w-6" /> },
    { id: "meat", icon: <Beef className="h-6 w-6" /> },
    { id: "seafood", icon: <Fish className="h-6 w-6" /> },
    { id: "breakfast", icon: <Sunrise className="h-6 w-6" /> },
    { id: "lunch", icon: <Sun className="h-6 w-6" /> },
    { id: "dinner", icon: <MoonStar className="h-6 w-6" /> },
    { id: "dessert", icon: <IceCreamCone className="h-6 w-6" /> },
  ]

  // Update searchTerm when URL changes
  useEffect(() => {
    setSearchTerm(searchQuery)
  }, [searchQuery])

  const fetchRecipes = async () => {
    setLoading(true)

    try {
      // TODO: API endpoint integration coming soon
      // For now, simulate loading state
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const query = supabase
        .from("recipes")
        .select(`
          *,
          users (username, avatar_url),
          recipe_tags (
            tags (*)
          )
        `)
        .order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Transform the data
      const transformedRecipes = data.map((recipe: any) => {
        // Extract tags from recipe_tags
        const tags = recipe.recipe_tags?.map((rt: any) => rt.tags?.name).filter(Boolean) || []

        // Extract dietary restrictions from tags
        const dietaryRestrictions = tags.filter((tag: string) =>
          [
            "Vegan",
            "Vegetarian",
            "Gluten-Free",
            "Dairy-Free",
            "Nut-Free",
            "Egg-Free",
            "Fish-Free",
            "Meat-Free",
          ].includes(tag),
        )

        return {
          id: recipe.id,
          title: recipe.title,
          image: recipe.image_url || "/placeholder.svg?height=300&width=400",
          tags: tags.filter(
            (tag: string) =>
              ![
                "Vegan",
                "Vegetarian",
                "Gluten-Free",
                "Dairy-Free",
                "Nut-Free",
                "Egg-Free",
                "Fish-Free",
                "Meat-Free",
              ].includes(tag),
          ),
          dietaryRestrictions,
          rating: 4.5, // We'll calculate this from comments in a real implementation
          commentCount: 10, // This would be a count from comments table
          difficulty: recipe.difficulty || "Intermediate",
        }
      })

      setRecipes(transformedRecipes)
    } catch (error) {
      console.error("Error fetching recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  const filterRecipes = () => {
    if (!searchTerm && selectedCategory === null) {
      return recipes
    }

    return recipes.filter((recipe) => {
      // Filter by search term
      const matchesSearch =
        !searchTerm ||
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filter by category
      const matchesCategory =
        selectedCategory === null ||
        selectedCategory === "liked" ||
        recipe.tags.some((tag: string) => tag.toLowerCase() === selectedCategory.toLowerCase()) ||
        recipe.dietaryRestrictions.some(
          (restriction: string) => restriction.toLowerCase() === selectedCategory.toLowerCase(),
        )

      return matchesSearch && matchesCategory
    })
  }

  const filteredRecipes = filterRecipes()

  return (
    <div className="min-h-screen bg-[#fff8e7]">
      <Navbar showSearch={false} />
      <div className="container mx-auto px-4 pt-24">
        {/* Search Header - Removed the search input since it's now in the navbar */}
        <div className="max-w-3xl mx-auto mb-10">
          <h1 className="font-gaya text-3xl md:text-4xl text-center mb-6 mt-4">Find Your Perfect Recipe</h1>
        </div>

        {/* Search Bar Section */}
        <section className="mb-12">
          <div className="max-w-2xl mx-auto relative">
            <form action="/search" method="GET" className="relative">
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search recipes by name, ingredient, or cuisine..."
                className="w-full py-3 px-12 rounded-full border border-gray-300 shadow-sm font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </form>
          </div>
        </section>

        {/* Categories */}
        <div className="mt-5 mb-5 overflow-y-hidden pt-3 pb-8">
          <div className="flex gap-4 px-4 w-full mx-auto md:justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className="relative flex flex-col items-center justify-center transition-all group"
              >
                <div
                  className={`p-3 rounded-full border ${
                    selectedCategory === category.id ? "border-[#32c94e]" : "border-gray-300"
                  } bg-white hover:shadow-md`}
                >
                  {category.icon}
                </div>
                <span
                  className={`mt-2.5 text-sm text-gray-700 absolute top-full transition-opacity ${
                    selectedCategory === category.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {category.id.charAt(0).toUpperCase() + category.id.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <p className="font-matina text-lg">Loading recipes...</p>
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} {...recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h3 className="font-gaya text-xl mb-2">No recipes found</h3>
            <p className="font-matina text-gray-600 mb-6">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-matina px-8 py-3 rounded-full flex items-center gap-2 mx-auto transition-colors">
              <Wand2 className="h-5 w-5" />
              Generate Recipe
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
