"use client"

import type React from "react"

import { useState } from "react"
import { Plus, X, Upload } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { Leaf, Wheat, Milk, Nut, Egg, Fish, Beef } from "lucide-react"

interface Ingredient {
  name: string
  amount: string
}

interface Instruction {
  text: string
}

type DietaryType =
  | "Vegan"
  | "Vegetarian"
  | "Gluten-Free"
  | "Dairy-Free"
  | "Nut-Free"
  | "Egg-Free"
  | "Fish-Free"
  | "Meat-Free"

export default function PostRecipePage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "", amount: "" }])
  const [instructions, setInstructions] = useState<Instruction[]>([{ text: "" }])
  const [tags, setTags] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryType[]>([])
  const [author, setAuthor] = useState("")
  const [cookTime, setCookTime] = useState("")
  const [servings, setServings] = useState("")
  const [difficulty, setDifficulty] = useState("Beginner")
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const supabase = createClient()

  const availableTags = [
    "Italian",
    "Mexican",
    "Asian",
    "Indian",
    "American",
    "Quick",
    "Slow-Cooked",
    "Healthy",
    "Comfort Food",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Dessert",
    "Snack",
    "Appetizer",
    "Main Course",
    "Side Dish",
    "Soup",
    "Salad",
    "Baking",
  ]

  const availableDietaryRestrictions: DietaryType[] = [
    "Vegan",
    "Vegetarian",
    "Gluten-Free",
    "Dairy-Free",
    "Nut-Free",
    "Egg-Free",
    "Fish-Free",
    "Meat-Free",
  ]

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: "" }])
  }

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...ingredients]
    newIngredients.splice(index, 1)
    setIngredients(newIngredients)
  }

  const handleIngredientChange = (index: number, field: "name" | "amount", value: string) => {
    const newIngredients = [...ingredients]
    newIngredients[index][field] = value
    setIngredients(newIngredients)
  }

  const handleAddInstruction = () => {
    setInstructions([...instructions, { text: "" }])
  }

  const handleRemoveInstruction = (index: number) => {
    const newInstructions = [...instructions]
    newInstructions.splice(index, 1)
    setInstructions(newInstructions)
  }

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions]
    newInstructions[index].text = value
    setInstructions(newInstructions)
  }

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag))
    } else {
      setTags([...tags, tag])
    }
  }

  const toggleDietaryRestriction = (restriction: DietaryType) => {
    if (dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions(dietaryRestrictions.filter((r) => r !== restriction))
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction])
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsSubmitting(true)

      try {
        const file = e.target.files[0]
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `recipe-images/${fileName}`

        // Upload image to Supabase Storage
        const { error: uploadError } = await supabase.storage.from("recipes").upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        // Get public URL for the uploaded image
        const { data } = supabase.storage.from("recipes").getPublicUrl(filePath)

        if (data) {
          setImages([...images, data.publicUrl])
        }
      } catch (error) {
        console.error("Error uploading image:", error)
        alert("Failed to upload image. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!description.trim()) {
      newErrors.description = "Description is required"
    }

    if (ingredients.some((ing) => !ing.name.trim())) {
      newErrors.ingredients = "All ingredients must have a name"
    }

    if (instructions.some((inst) => !inst.text.trim())) {
      newErrors.instructions = "All instructions must have content"
    }

    if (!cookTime.trim()) {
      newErrors.cookTime = "Cook time is required"
    }

    if (!servings) {
      newErrors.servings = "Number of servings is required"
    }

    if (!author.trim()) {
      newErrors.author = "Author name is required"
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, we would get the user ID from auth
      // For now, we'll create a user for the author
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", author)
        .single()

      let userId

      if (userError || !userData) {
        // Create a new user if not found
        const { data: newUser, error: createUserError } = await supabase
          .from("users")
          .insert({
            username: author,
            email: `${author.toLowerCase().replace(/\s+/g, ".")}@example.com`, // Dummy email
          })
          .select()
          .single()

        if (createUserError || !newUser) {
          throw new Error("Failed to create user")
        }

        userId = newUser.id
      } else {
        userId = userData.id
      }

      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          title,
          description,
          image_url: images[0], // Use the first image as the main image
          cook_time: cookTime,
          servings: Number.parseInt(servings),
          difficulty,
          user_id: userId,
        })
        .select()
        .single()

      if (recipeError || !recipe) {
        throw new Error("Failed to create recipe")
      }

      // Add ingredients
      const ingredientsToInsert = ingredients
        .filter((ing) => ing.name.trim())
        .map((ing) => ({
          recipe_id: recipe.id,
          name: ing.name.trim(),
          amount: ing.amount.trim(),
        }))

      if (ingredientsToInsert.length > 0) {
        const { error: ingredientsError } = await supabase.from("ingredients").insert(ingredientsToInsert)

        if (ingredientsError) {
          console.error("Error adding ingredients:", ingredientsError)
        }
      }

      // Add instructions
      const instructionsToInsert = instructions
        .filter((inst) => inst.text.trim())
        .map((inst, index) => ({
          recipe_id: recipe.id,
          step_number: index + 1,
          content: inst.text.trim(),
        }))

      if (instructionsToInsert.length > 0) {
        const { error: instructionsError } = await supabase.from("instructions").insert(instructionsToInsert)

        if (instructionsError) {
          console.error("Error adding instructions:", instructionsError)
        }
      }

      // Add tags and dietary restrictions
      const allTags = [...tags, ...dietaryRestrictions]
      for (const tagName of allTags) {
        // Check if tag exists
        const { data: existingTag, error: tagError } = await supabase
          .from("tags")
          .select("*")
          .eq("name", tagName)
          .single()

        if (tagError && tagError.code !== "PGRST116") {
          // PGRST116 is "no rows returned"
          console.error("Error checking tag:", tagError)
          continue
        }

        let tagId

        if (!existingTag) {
          // Create tag if it doesn't exist
          const { data: newTag, error: createTagError } = await supabase
            .from("tags")
            .insert({ name: tagName })
            .select()
            .single()

          if (createTagError || !newTag) {
            console.error("Error creating tag:", createTagError)
            continue
          }

          tagId = newTag.id
        } else {
          tagId = existingTag.id
        }

        // Associate tag with recipe
        const { error: recipeTagError } = await supabase.from("recipe_tags").insert({
          recipe_id: recipe.id,
          tag_id: tagId,
        })

        if (recipeTagError) {
          console.error("Error associating tag with recipe:", recipeTagError)
        }
      }

      // Redirect to the recipe page
      router.push(`/recipe/${recipe.id}`)
    } catch (error) {
      console.error("Error submitting recipe:", error)
      alert("Failed to submit recipe. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar showAddRecipe={false} showSearch={true} centeredSearch={true} />

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row">
        {/* Left side - Image Upload */}
        <div className="md:w-1/2 relative h-[400px] md:h-[600px] bg-gray-100 flex items-center justify-center">
          {images.length > 0 ? (
            <div className="relative w-full h-full">
              <Image src={images[0] || "/placeholder.svg"} alt="Recipe preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveImage(0)}
                className="absolute top-4 right-4 bg-[#e80b07] text-white rounded-full p-2 shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="text-center p-6">
              <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="font-matina text-gray-500 mb-2">Upload a tasty image for your recipe</p>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isSubmitting}
              />
              <label
                htmlFor="image-upload"
                className={`btn-primary font-matina inline-block cursor-pointer mt-4 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? "Uploading..." : "Select Image"}
              </label>
              {errors.images && <p className="text-[#e80b07] font-matina mt-2">{errors.images}</p>}
            </div>
          )}
        </div>

        {/* Right side - Recipe Info */}
        <div className="md:w-1/2 p-6 md:p-10 bg-white">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="title" className="block font-matina text-sm mb-1">
                Recipe Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                className="w-full px-4 py-3 border rounded-md font-gaya text-2xl focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                required
              />
              {errors.title && <p className="text-[#e80b07] font-matina mt-1 text-sm">{errors.title}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block font-matina text-sm mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe your recipe"
                rows={3}
                className="w-full px-4 py-3 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                required
              ></textarea>
              {errors.description && <p className="text-[#e80b07] font-matina mt-1 text-sm">{errors.description}</p>}
            </div>

            {/* Dietary Restrictions */}
            <div className="mb-6">
              <label className="block font-matina text-sm mb-2">Dietary Restrictions</label>
              <div className="flex flex-wrap gap-2">
                {availableDietaryRestrictions.map((restriction) => (
                  <button
                    key={restriction}
                    type="button"
                    onClick={() => toggleDietaryRestriction(restriction)}
                    className={`px-3 py-1 rounded-full font-matina text-sm flex items-center gap-1 ${
                      dietaryRestrictions.includes(restriction)
                        ? "bg-[#32c94e] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <DietaryIcon type={restriction} className="h-3 w-3" />
                    {restriction}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipe Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="cookTime" className="block font-matina text-sm mb-1">
                  Cook Time
                </label>
                <input
                  id="cookTime"
                  type="text"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="e.g. 30 minutes"
                  className="w-full px-4 py-2 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                  required
                />
                {errors.cookTime && <p className="text-[#e80b07] font-matina mt-1 text-sm">{errors.cookTime}</p>}
              </div>

              <div>
                <label htmlFor="servings" className="block font-matina text-sm mb-1">
                  Servings
                </label>
                <input
                  id="servings"
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="e.g. 4"
                  className="w-full px-4 py-2 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                  required
                />
                {errors.servings && <p className="text-[#e80b07] font-matina mt-1 text-sm">{errors.servings}</p>}
              </div>

              <div>
                <label htmlFor="difficulty" className="block font-matina text-sm mb-1">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                  required
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="author" className="block font-matina text-sm mb-1">
                  Your Name
                </label>
                <input
                  id="author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                  required
                />
                {errors.author && <p className="text-[#e80b07] font-matina mt-1 text-sm">{errors.author}</p>}
              </div>
            </div>

            <button type="submit" className="btn-primary font-matina w-full py-3" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Continue to Add Ingredients & Instructions"}
            </button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Ingredients */}
            <div className="md:col-span-1">
              <h2 className="font-gaya text-2xl mb-4">Ingredients</h2>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="space-y-4">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-grow">
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                          placeholder="Ingredient"
                          className="w-full px-4 py-2 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                          required
                        />
                      </div>
                      <div className="w-1/3">
                        <input
                          type="text"
                          value={ingredient.amount}
                          onChange={(e) => handleIngredientChange(index, "amount", e.target.value)}
                          placeholder="Amount"
                          className="w-full px-4 py-2 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="text-error"
                        disabled={ingredients.length === 1}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="flex items-center mt-4 text-primary font-matina"
                >
                  <Plus className="h-5 w-5 mr-1" />
                  Add Ingredient
                </button>
                {errors.ingredients && <p className="text-[#e80b07] font-matina mt-2">{errors.ingredients}</p>}
              </div>
            </div>

            {/* Instructions */}
            <div className="md:col-span-2">
              <h2 className="font-gaya text-2xl mb-4">Instructions</h2>
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="space-y-4">
                  {instructions.map((instruction, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="mt-2 font-matina font-bold">{index + 1}.</div>
                      <div className="flex-grow">
                        <textarea
                          value={instruction.text}
                          onChange={(e) => handleInstructionChange(index, e.target.value)}
                          placeholder={`Step ${index + 1}`}
                          rows={2}
                          className="w-full px-4 py-2 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                          required
                        ></textarea>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(index)}
                        className="text-error mt-2"
                        disabled={instructions.length === 1}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="flex items-center mt-4 text-primary font-matina"
                >
                  <Plus className="h-5 w-5 mr-1" />
                  Add Step
                </button>
                {errors.instructions && <p className="text-[#e80b07] font-matina mt-2">{errors.instructions}</p>}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg p-6 shadow-md mb-8">
            <h2 className="font-gaya text-xl mb-4">Tags</h2>
            <p className="font-matina text-gray-600 mb-4">Select all that apply:</p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full font-matina text-sm ${
                    tags.includes(tag) ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleSubmit}
              className="btn-primary font-matina text-lg px-8 py-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Recipe"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function DietaryIcon({ type, className = "" }: { type: DietaryType; className?: string }) {
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
