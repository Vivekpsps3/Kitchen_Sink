"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Heart, IceCreamCone, Salad, Clock, Carrot, Beef, Fish, Search, Wand2, Sunrise, Sun, MoonStar } from "lucide-react"
import RecipeCard from "@/components/recipe-card"
import Navbar from "@/components/navbar"
import { createClient } from "@/lib/supabase/client"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { parseCookies } from 'nookies'

// Simple custom toast component
const Toast = ({ message, isVisible, onClose }: { message: string, isVisible: boolean, onClose: () => void }) => {
  const [isExiting, setIsExiting] = useState(false);
  
  // Auto close after 2 seconds
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      setIsExiting(true);
      
      // Wait for animation to complete before removing from DOM
      setTimeout(() => {
        setIsExiting(false);
        onClose();
      }, 300); // Match animation duration
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [isVisible, onClose]);
  
  // Early return after hooks
  if (!isVisible && !isExiting) return null;
  
  const animationClass = isExiting ? 'animate-fade-out-up' : 'animate-fade-in-down';
  
  return (
    <div className={`fixed rounded-xl top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 shadow-lg z-50 ${animationClass}`}>
      {message}
    </div>
  );
};

interface Category {
  id: string
  icon: React.ReactNode
}

export default function SearchPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ""
  const filterParam = searchParams.get('filter')
  const categoryParam = searchParams.get('category')
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [mounted, setMounted] = useState(false)
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

  // Mark component as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Set selected category based on filter param
  useEffect(() => {
    if (filterParam === 'liked') {
      setSelectedCategory('liked')
    } else if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [filterParam, categoryParam])

  // Update searchTerm when URL changes
  useEffect(() => {
    setSearchTerm(searchQuery)
  }, [searchQuery])

  const fetchLikedRecipes = async () => {
    setLoading(true)
    try {
      // Get liked recipes from cookies
      const cookies = parseCookies()
      
      // Parse the URL-encoded cookie format
      let likedRecipeIds: string[] = []
      
      if (cookies.likedRecipes) {
        try {
          // First try standard JSON parsing
          likedRecipeIds = JSON.parse(cookies.likedRecipes)
        } catch (e) {
          // If standard parsing fails, handle the URL-encoded format [6%2C9]
          const decodedCookie = decodeURIComponent(cookies.likedRecipes)
          console.log('Decoded cookie:', decodedCookie)
          
          // Remove the brackets and split by comma
          if (decodedCookie.startsWith('[') && decodedCookie.endsWith(']')) {
            const content = decodedCookie.substring(1, decodedCookie.length - 1)
            likedRecipeIds = content.split(',')
          }
        }
      }
      
      console.log('Liked recipe IDs:', likedRecipeIds)
      
      if (likedRecipeIds.length === 0) {
        setRecipes([])
        setLoading(false)
        return
      }

      // Fetch each liked recipe by ID
      const likedRecipesPromises = likedRecipeIds.map(async (id: string) => {
        const response = await fetch(`http://localhost:8000/recipe/${id}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) {
          return null
        }
        
        const responseData = await response.json()
        // API returns an array of recipes, we need to get the first item
        const recipeData = Array.isArray(responseData) ? responseData[0] : responseData
        
        if (!recipeData) {
          console.error(`No recipe data found for ID: ${id}`)
          return null
        }
        
        console.log(`Recipe data for ID ${id}:`, recipeData)
        
        // Ensure the recipe data is formatted correctly for RecipeCard
        return {
          id: recipeData.id || id,
          title: recipeData.title || 'Untitled Recipe',
          image_url: recipeData.image_url || '/placeholder.svg',
          tags: Array.isArray(recipeData.tags) ? recipeData.tags : [],
          rating: recipeData.likes || 0,
          comments: recipeData.comments || [],
          difficulty: recipeData.difficulty || 'Intermediate',
          dietaryRestrictions: recipeData.dietaryRestrictions || []
        }
      })

      const likedRecipesResults = await Promise.all(likedRecipesPromises)
      const validRecipes = likedRecipesResults.filter(recipe => recipe !== null)
      
      console.log("Processed liked recipes:", validRecipes)
      setRecipes(validRecipes)
    } catch (error) {
      console.error("Error fetching liked recipes:", error)
      setRecipes([])
    } finally {
      setLoading(false)
    }
  }

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
      // Show toast notification instead of alert
      setToastMessage(error instanceof Error ? error.message : 'An unknown error occurred')
      setShowToast(true)
    } finally {
      setLoading(false)
    }
  }

  // Fetch recipes based on filter
  useEffect(() => {
    if (filterParam === 'liked') {
      fetchLikedRecipes()
    } else {
      fetchRecipes()
    }
  }, [searchTerm, filterParam, selectedCategory])

  const toggleCategory = (categoryId: string) => {
    // If the category is already selected, unselect it
    const newCategory = selectedCategory === categoryId ? null : categoryId
    setSelectedCategory(newCategory)
    
    // Update URL with the new category
    const params = new URLSearchParams()
    
    // When unchecking a category, refresh with just query parameter
    if (newCategory === null) {
      // Only keep the search query if it exists
      if (searchQuery) {
        params.set('q', searchQuery)
      }
      // Perform a full page refresh with the clean URL
      window.location.href = `${pathname}${params.toString() ? '?' + params.toString() : ''}`
      return
    }
    
    // For setting a category, keep existing parameters
    params.set('category', newCategory)
    
    // Preserve existing query parameter if it exists
    if (searchQuery) {
      params.set('q', searchQuery)
    }
    
    // Preserve filter parameter if it exists
    if (filterParam) {
      params.set('filter', filterParam)
    }
    
    // Update the URL without refreshing the page
    router.push(`${pathname}?${params.toString()}`)
  }

  const filterRecipes = () => {
    // If we're showing liked recipes via URL param, just return all recipes
    if (filterParam === 'liked') {
      return recipes
    }

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
      {mounted && <Toast 
        message={toastMessage} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />}
      <div className="container mx-auto px-4 pt-24">
        {/* Search Header - Removed the search input since it's now in the navbar */}
        <div className="max-w-3xl mx-auto mb-10">
          <h1 className="font-gaya text-3xl md:text-4xl text-center mb-6 mt-4">
            {filterParam === 'liked' ? 'Your Liked Recipes' : 'Find Your Perfect Recipe'}
          </h1>
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
                    selectedCategory === category.id 
                      ? "border-2 border-[#32c94e] bg-[#32c94e]/10" 
                      : "border border-gray-300 bg-white"
                  } hover:shadow-md transition-all duration-200`}
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
              <RecipeCard 
                key={recipe.id} 
                id={recipe.id}
                title={recipe.title}
                image={recipe.image_url || "/placeholder.svg"}
                tags={Array.isArray(recipe.tags) ? recipe.tags : []}
                rating={recipe.rating || 0}
                commentCount={recipe.comments?.length || 0}
                difficulty={recipe.difficulty || 'Intermediate'}
                dietaryRestrictions={recipe.dietaryRestrictions || []}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h3 className="font-gaya text-xl mb-2">
              {filterParam === 'liked' ? 'No liked recipes yet' : 'No recipes found'}
            </h3>
            <p className="font-matina text-gray-600 mb-6">
              {filterParam === 'liked' 
                ? 'Start liking recipes to see them here.'
                : 'Try adjusting your search or filters to find what you\'re looking for.'}
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
