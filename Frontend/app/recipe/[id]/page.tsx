import Image from "next/image"
import { Star, Clock, Users, BarChart } from "lucide-react"
import CommentSection from "@/components/comment-section"
import { getRecipeById, getRecipeComments } from "@/lib/supabase/recipes"
import { notFound } from "next/navigation"
import Navbar from "@/components/navbar"
import { DietaryLabel } from "@/components/dietary-icon"

export default async function RecipePage({ params }: { params: { id: string } }) {
  console.log(`Rendering recipe page for ID: ${params.id}`)

  const recipe = await getRecipeById(params.id)
  const comments = await getRecipeComments(params.id)

  if (!recipe) {
    console.error(`Recipe not found for ID: ${params.id}`)
    notFound()
  }

  // Extract tags from recipe_tags, with fallback for missing data
  const tags = recipe.recipe_tags?.map((rt: any) => rt.tags?.name).filter(Boolean) || []

  // Extract dietary restrictions from tags
  const dietaryRestrictions = tags.filter((tag: string) =>
    ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Nut-Free", "Egg-Free", "Fish-Free", "Meat-Free"].includes(
      tag,
    ),
  )

  // Calculate average rating from comments
  let averageRating = 0
  let ratingCount = 0

  comments.forEach((comment: any) => {
    if (comment.rating) {
      averageRating += comment.rating
      ratingCount++
    }
  })

  averageRating = ratingCount > 0 ? averageRating / ratingCount : 0

  // Ensure ingredients and instructions are arrays
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : []

  return (
    <>
      <Navbar showSearch={true} centeredSearch={true} />

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row">
        {/* Left side - Image */}
        <div className="md:w-1/2 relative h-[400px] md:h-[600px]">
          <Image
            src={recipe.image_url || "/placeholder.svg?height=600&width=1200"}
            alt={recipe.title || "Recipe Image"}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right side - Recipe Info */}
        <div className="md:w-1/2 p-6 md:p-10 bg-white">
          <h1 className="font-gaya text-3xl md:text-4xl font-bold mb-4">{recipe.title || "Untitled Recipe"}</h1>

          <p className="font-matina text-lg mb-8">{recipe.description || "No description available."}</p>

          {/* Dietary Restrictions */}
          {dietaryRestrictions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {dietaryRestrictions.map((restriction, index) => (
                <DietaryLabel key={index} type={restriction} className="bg-[#32c94e]/10 text-[#32c94e]" />
              ))}
            </div>
          )}

          {/* Recipe Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#fff8e7] p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                <span className="font-matina font-bold">Cook Time</span>
              </div>
              <p className="font-matina mt-1">{recipe.cook_time || "30 minutes"}</p>
            </div>

            <div className="bg-[#fff8e7] p-4 rounded-lg">
              <div className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                <span className="font-matina font-bold">Difficulty</span>
              </div>
              <p className="font-matina mt-1">{recipe.difficulty || "Intermediate"}</p>
            </div>

            <div className="bg-[#fff8e7] p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                <span className="font-matina font-bold">Servings</span>
              </div>
              <p className="font-matina mt-1">{recipe.servings || 4} servings</p>
            </div>

            <div className="bg-[#fff8e7] p-4 rounded-lg">
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                <span className="font-matina font-bold">Rating</span>
              </div>
              <div className="flex mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap mb-4">
              {tags
                .filter(
                  (tag) =>
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
                )
                .map((tag, index) => (
                  <span key={index} className="tag-pill font-matina">
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Ingredients */}
            <div className="md:col-span-1">
              <h2 className="font-gaya text-2xl mb-4">Ingredients</h2>
              <ul className="bg-white rounded-lg p-6 shadow-md">
                {ingredients.length > 0 ? (
                  ingredients.map((ingredient: any, index: number) => (
                    <li key={ingredient.id || index} className="font-matina mb-2 flex">
                      <span className="mr-2">•</span>
                      {ingredient.amount && <span className="font-bold">{ingredient.amount}</span>}
                      <span className={ingredient.amount ? "ml-2" : ""}>{ingredient.name}</span>
                    </li>
                  ))
                ) : (
                  <li className="font-matina text-gray-500">No ingredients listed</li>
                )}
              </ul>
            </div>

            {/* Instructions */}
            <div className="md:col-span-2">
              <h2 className="font-gaya text-2xl mb-4">Instructions</h2>
              <ol className="bg-white rounded-lg p-6 shadow-md list-decimal list-inside space-y-4">
                {instructions.length > 0 ? (
                  instructions
                    .sort((a: any, b: any) => (a.step_number || 0) - (b.step_number || 0))
                    .map((instruction: any, index: number) => {
                      // Highlight ingredients in instructions
                      let highlightedInstruction = instruction.content || `Step ${index + 1}`

                      if (ingredients.length > 0) {
                        ingredients.forEach((ing: any) => {
                          if (ing.name) {
                            const regex = new RegExp(`\\b${ing.name}\\b`, "gi")
                            highlightedInstruction = highlightedInstruction.replace(
                              regex,
                              `<span class="font-bold text-primary">${ing.name}${ing.amount ? ` (${ing.amount})` : ""}</span>`,
                            )
                          }
                        })
                      }

                      return (
                        <li key={instruction.id || index} className="font-matina">
                          <span dangerouslySetInnerHTML={{ __html: highlightedInstruction }} />
                        </li>
                      )
                    })
                ) : (
                  <li className="font-matina text-gray-500">No instructions provided</li>
                )}
              </ol>
            </div>
          </div>

          {/* Comments Section */}
          <CommentSection recipeId={params.id} comments={comments} />
        </div>
      </div>
    </>
  )
}
