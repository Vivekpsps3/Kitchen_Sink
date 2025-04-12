"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, ShoppingCart, Check, X, Search } from "lucide-react"
import Navbar from "@/components/navbar"
import { createClient } from "@/lib/supabase/client"

interface Recipe {
  id: string
  title: string
  description: string
  image: string
  ingredients: string[]
}

interface ShoppingItem {
  id: string
  name: string
  checked: boolean
  recipeId: string
}

export default function ShoppingListPage() {
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([])
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([])
  const [newItem, setNewItem] = useState("")
  const [loading, setLoading] = useState(true)
  const [cheapestStore, setCheapestStore] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchLikedRecipes()
  }, [])

  const fetchLikedRecipes = async () => {
    setLoading(true)

    try {
      // In a real app, we would fetch the user's liked recipes
      // For demo purposes, we'll fetch some recipes and pretend they're liked
      const { data, error } = await supabase
        .from("recipes")
        .select(`
          id,
          title,
          description,
          image_url,
          ingredients (name, amount)
        `)
        .limit(5)

      if (error) {
        throw error
      }

      const transformedRecipes = data.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description || "A delicious recipe",
        image: recipe.image_url || "/placeholder.svg?height=100&width=100",
        ingredients: recipe.ingredients.map((ing: any) => `${ing.amount ? ing.amount + " " : ""}${ing.name}`),
      }))

      setLikedRecipes(transformedRecipes)
    } catch (error) {
      console.error("Error fetching liked recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  const addRecipeToShoppingList = (recipe: Recipe) => {
    const newItems = recipe.ingredients.map((ingredient, index) => ({
      id: `${recipe.id}-${index}`,
      name: ingredient,
      checked: false,
      recipeId: recipe.id,
    }))

    setShoppingList((prev) => {
      // Filter out any items that are already in the list from this recipe
      const filteredList = prev.filter((item) => item.recipeId !== recipe.id)
      return [...filteredList, ...newItems]
    })
  }

  const removeRecipeFromShoppingList = (recipeId: string) => {
    setShoppingList((prev) => prev.filter((item) => item.recipeId !== recipeId))
  }

  const toggleItemChecked = (itemId: string) => {
    setShoppingList((prev) => prev.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)))
  }

  const addCustomItem = () => {
    if (!newItem.trim()) return

    setShoppingList((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: newItem.trim(),
        checked: false,
        recipeId: "custom",
      },
    ])

    setNewItem("")
  }

  const removeItem = (itemId: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== itemId))
  }

  const findCheapestStore = () => {
    // In a real app, this would call an API to find the cheapest store
    // For demo purposes, we'll just simulate a response
    const stores = ["Aldi", "Walmart", "Kroger", "Publix", "Trader Joe's"]
    const randomStore = stores[Math.floor(Math.random() * stores.length)]
    setCheapestStore(randomStore)
  }

  const isRecipeInShoppingList = (recipeId: string) => {
    return shoppingList.some((item) => item.recipeId === recipeId)
  }

  return (
    <>
      <Navbar showShoppingCart={false} showSearch={true} centeredSearch={true} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-gaya text-3xl md:text-4xl text-center mb-8">Shopping List</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Liked Recipes */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-gaya text-2xl">Liked Recipes</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    className="pl-8 pr-4 py-2 rounded-full border border-gray-300 font-matina text-sm focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>

              {loading ? (
                <p className="font-matina text-center py-8">Loading recipes...</p>
              ) : likedRecipes.length > 0 ? (
                <div className="space-y-4">
                  {likedRecipes.map((recipe) => (
                    <div key={recipe.id} className="flex items-center border-b border-gray-100 pb-4">
                      <div className="relative h-16 w-16 rounded-md overflow-hidden">
                        <Image
                          src={recipe.image || "/placeholder.svg"}
                          alt={recipe.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-grow">
                        <h3 className="font-matina font-bold">{recipe.title}</h3>
                        <p className="font-matina text-sm text-gray-600 line-clamp-1">{recipe.description}</p>
                      </div>
                      <button
                        onClick={() =>
                          isRecipeInShoppingList(recipe.id)
                            ? removeRecipeFromShoppingList(recipe.id)
                            : addRecipeToShoppingList(recipe)
                        }
                        className={`p-2 rounded-full ${
                          isRecipeInShoppingList(recipe.id)
                            ? "bg-[#e80b07]/10 text-[#e80b07] hover:bg-[#e80b07]/20"
                            : "bg-[#32c94e]/10 text-[#32c94e] hover:bg-[#32c94e]/20"
                        }`}
                      >
                        {isRecipeInShoppingList(recipe.id) ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="font-matina">You haven't liked any recipes yet.</p>
                  <a href="/search" className="font-matina text-[#3cbbf1] hover:underline mt-2 inline-block">
                    Discover recipes to like
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Shopping List */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-gaya text-2xl">Shopping List</h2>
                <ShoppingCart className="h-6 w-6 text-[#32c94e]" />
              </div>

              {shoppingList.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {shoppingList.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleItemChecked(item.id)}
                          className={`h-5 w-5 rounded border flex items-center justify-center mr-3 ${
                            item.checked ? "bg-[#32c94e] border-[#32c94e] text-white" : "border-gray-300"
                          }`}
                        >
                          {item.checked && <Check className="h-3 w-3" />}
                        </button>
                        <span className={`font-matina ${item.checked ? "line-through text-gray-400" : ""}`}>
                          {item.name}
                        </span>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-[#e80b07]">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 mb-6">
                  <p className="font-matina">Your shopping list is empty.</p>
                  <p className="font-matina text-gray-500 mt-2">
                    Add items from your liked recipes or add custom items below.
                  </p>
                </div>
              )}

              {/* Add Custom Item */}
              <div className="flex mb-6">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add custom item..."
                  className="flex-grow px-4 py-2 border rounded-l-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                  onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
                />
                <button
                  onClick={addCustomItem}
                  className="bg-[#32c94e] text-white px-4 py-2 rounded-r-md hover:bg-[#1aa033]"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {/* Find Cheapest Store */}
              <div className="text-center">
                <button
                  onClick={findCheapestStore}
                  className="btn-primary font-matina py-3 px-6"
                  disabled={shoppingList.length === 0}
                >
                  Find Cheapest Store
                </button>

                {cheapestStore && (
                  <div className="mt-4 p-4 bg-[#32c94e]/10 rounded-lg">
                    <p className="font-matina">The cheapest store for your shopping list is:</p>
                    <p className="font-gaya text-xl mt-2">{cheapestStore}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
