"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Heart, Coffee, Utensils, Cake, Salad, Clock, Carrot, Beef, Fish, Sandwich, Search, Wand2 } from "lucide-react"
import RecipeCard from "@/components/recipe-card"
import Navbar from "@/components/navbar"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams } from "next/navigation"

interface Category {
  id: string
  name: string
  icon: React.ReactNode
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ""
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const categories: Category[] = [
    {
      id: "liked",
      name: "Liked Recipes",
      icon: (
        <Heart
          className={`h-6 w-6 ${
            selectedCategory === "liked" ? "text-white" : "text-pink-500"
          }`}
        />
      ),
    },
    {
      id: "quick",
      name: "Quick & Easy",
      icon: (
        <Clock
          className={`h-6 w-6 ${
            selectedCategory === "quick" ? "text-white" : "text-yellow-500"
          }`}
        />
      ),
    },
    {
      id: "healthy",
      name: "Healthy",
      icon: (
        <Carrot
          className={`h-6 w-6 ${
            selectedCategory === "healthy" ? "text-white" : "text-orange-500"
          }`}
        />
      ),
    },
    { id: "breakfast", name: "Breakfast", icon: <Coffee className="h-6 w-6" /> },
    { id: "lunch", name: "Lunch", icon: <Sandwich className="h-6 w-6" /> },
    { id: "dinner", name: "Dinner", icon: <Utensils className="h-6 w-6" /> },
    { id: "dessert", name: "Dessert", icon: <Cake className="h-6 w-6" /> },
    { id: "vegetarian", name: "Vegetarian", icon: <Salad className="h-6 w-6" /> },
    { id: "meat", name: "Meat", icon: <Beef className="h-6 w-6" /> },
    { id: "seafood", name: "Seafood", icon: <Fish className="h-6 w-6" /> },
  ]

  // Update searchTerm when URL changes
  useEffect(() => {
    setSearchTerm(searchQuery)
  }, [searchQuery])

  const fetchRecipes = async () => {
    setLoading(true)

    try {
      console.log(`${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/recipes?search=${encodeURIComponent(searchTerm)}`)

      const response = await fetch(`${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/recipes?search=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      console.log(JSON.stringify(data))
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch recipes')
      }

      setRecipes(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      console.error("Error fetching recipes:", error)
      // Set recipes to empty array on error
      setRecipes([])
      // You might want to show this error to the user in the UI
      alert(error instanceof Error ? error.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Fetch recipes when search term changes
  useEffect(() => {
    fetchRecipes()
  }, [searchTerm])

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

        {/* Search Header - Removed the search input since it's now in the navbar */}
        <div className="max-w-3xl mx-auto mb-10">
          <h1 className="font-gaya text-3xl md:text-4xl text-center mb-6">Find Your Perfect Recipe</h1>
        </div>

        {/* Categories */}
        <div className="mb-10 overflow-x-auto pb-4">
          <div className="flex space-x-4 px-4 min-w-max mx-auto md:justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg min-w-[100px] transition-all ${
                  selectedCategory === category.id
                    ? category.id === "liked"
                      ? "bg-pink-500 text-white shadow-md"
                      : category.id === "quick"
                      ? "bg-yellow-500 text-white shadow-md"
                      : category.id === "healthy"
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-[#32c94e] text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 shadow"
                }`}
              >
                <div
                  className={`p-3 rounded-full mb-2 ${
                    selectedCategory === category.id ? "bg-white/20" : "bg-[#fff8e7]"
                  }`}
                >
                  {category.icon}
                </div>
                <span className="font-matina text-sm whitespace-nowrap">{category.name}</span>
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
              <RecipeCard 
                key={recipe.id} 
                id={recipe.id}
                title={recipe.title}
                image={recipe.image || "/placeholder.svg"}
                tags={recipe.tags}
                rating={recipe.rating || 0}
                commentCount={recipe.comments?.length || 0}
                difficulty={recipe.difficulty}
              />
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
