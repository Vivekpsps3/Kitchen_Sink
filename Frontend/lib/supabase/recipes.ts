"use server"

import { revalidatePath } from "next/cache"

export async function getRecipes() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/recipes?sort_type=popular&limit=6`)
    if (!response.ok) {
      throw new Error('Failed to fetch recipes')
    }
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return []
  }
}

export async function getFeaturedRecipes() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/featuredRecipes`)
    if (!response.ok) {
      throw new Error('Failed to fetch featured recipes')
    }
    const data = await response.json()
    return data || []
  } catch (error) {
    console.error("Error fetching featured recipes:", error)
    return []
  }
}

export async function getRecipeById(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/recipe/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch recipe')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching recipe with id ${id}:`, error)
    return getMockRecipe(id)
  }
}

// Helper function to generate a mock recipe for demo purposes
function getMockRecipe(id: string) {
  return {
    id: id,
    title: "Delicious Demo Recipe",
    description: "This is a mock recipe for demonstration purposes.",
    image_url:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3",
    cook_time: "30 minutes",
    servings: 4,
    difficulty: "Intermediate",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    users: {
      username: "Demo Chef",
      avatar_url: null,
    },
    ingredients: [
      { id: "ing-1", recipe_id: id, name: "Ingredient 1", amount: "1 cup" },
      { id: "ing-2", recipe_id: id, name: "Ingredient 2", amount: "2 tbsp" },
      { id: "ing-3", recipe_id: id, name: "Ingredient 3", amount: "3 pieces" },
    ],
    instructions: [
      { id: "inst-1", recipe_id: id, step_number: 1, content: "Prepare all ingredients." },
      { id: "inst-2", recipe_id: id, step_number: 2, content: "Mix everything together." },
      { id: "inst-3", recipe_id: id, step_number: 3, content: "Cook for 30 minutes and serve." },
    ],
    recipe_tags: [{ tags: { name: "Quick" } }, { tags: { name: "Dinner" } }, { tags: { name: "Gluten-Free" } }],
  }
}

export async function getRecipeComments(recipeId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/recipe/${recipeId}/comments`)
    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }
    const data = await response.json()
    return data || []
  } catch (error) {
    console.error(`Error fetching comments for recipe ${recipeId}:`, error)
    return []
  }
}

export async function createRecipe(recipeData: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recipeData),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create recipe')
    }
    
    const data = await response.json()
    revalidatePath("/recipes")
    revalidatePath("/")
    return data
  } catch (error) {
    console.error("Error creating recipe:", error)
    return null
  }
}
