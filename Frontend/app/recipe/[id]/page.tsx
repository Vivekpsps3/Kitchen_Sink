import { getRecipeById } from "@/lib/api/recipes"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Clock, Users, BarChart } from "lucide-react"
import Navbar from "@/components/navbar"

export default async function RecipePage({ params }: { params: { id: string } }) {
  const recipe = await getRecipeById(params.id)
  
  if (!recipe) {
    notFound()
  }

  console.log('Recipe Data:', JSON.stringify(recipe, null, 2))

  return (
    <div className="min-h-screen bg-[#fff8e7]">
      <Navbar showSearch={true} centeredSearch={true} />
      <div className="container mx-auto px-4 pt-24">
        {/* Recipe Header */}
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="font-gaya text-4xl md:text-5xl mb-4 font-['Times_New_Roman']">{recipe.title}</h1>
          <p className="font-matina text-lg text-gray-600 font-['Times_New_Roman']">{recipe.cuisine}</p>
        </div>

        {/* Recipe Metadata */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-[#32c94e]" />
              <span className="font-matina font-bold font-['Times_New_Roman']">Prep Time</span>
            </div>
            <p className="font-matina font-['Times_New_Roman']"><span className="font-['Times_New_Roman']">{recipe.prep_time_minutes}</span> minutes</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-[#32c94e]" />
              <span className="font-matina font-bold font-['Times_New_Roman']">Cook Time</span>
            </div>
            <p className="font-matina font-['Times_New_Roman']"><span className="font-['Times_New_Roman']">{recipe.cook_time_minutes}</span> minutes</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-[#32c94e]" />
              <span className="font-matina font-bold font-['Times_New_Roman']">Servings</span>
            </div>
            <p className="font-matina font-['Times_New_Roman']"><span className="font-['Times_New_Roman']">{recipe.servings}</span> servings</p>
          </div>
        </div>

        {/* Tags */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag: string, index: number) => (
              <span key={index} className="bg-[#32c94e]/10 text-[#32c94e] px-4 py-2 rounded-full font-matina text-sm font-['Times_New_Roman']">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Ingredients */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="font-gaya text-2xl mb-6 font-['Times_New_Roman']">Ingredients</h2>
          {recipe.ingredient_sections.map((section: any, sectionIndex: number) => (
            <div key={sectionIndex} className="mb-8">
              <h3 className="font-matina font-bold text-lg mb-4 font-['Times_New_Roman']">{section.section_name}</h3>
              <ul className="space-y-2">
                {section.ingredients.map((ingredient: any, index: number) => (
                  <li key={index} className="font-matina flex items-start gap-2 font-['Times_New_Roman']">
                    <span className="text-[#32c94e]">•</span>
                    <span>
                      <span className="font-['Times_New_Roman']">{ingredient.amount}</span> {ingredient.unit} {ingredient.name}
                      {ingredient.notes && <span className="text-gray-500"> ({ingredient.notes})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="font-gaya text-2xl mb-6 font-['Times_New_Roman']">Instructions</h2>
          <ol className="space-y-4">
            {recipe.steps.map((step: string, index: number) => (
              <li key={index} className="font-matina flex gap-4 font-['Times_New_Roman']">
                <span className="font-bold text-[#32c94e] font-['Times_New_Roman']">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Notes */}
        {recipe.notes && (
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="font-gaya text-2xl mb-6 font-['Times_New_Roman']">Notes</h2>
            <p className="font-matina text-gray-600 font-['Times_New_Roman']">{recipe.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
