"use client"

import type React from "react"

import { useState } from "react"
import { Plus, X, Upload, Leaf, Wheat, Milk, Nut, Egg, Fish, Beef, Search, MessageSquare } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"

interface Ingredient {
  name: string
  amount: string
  unit: 'grams' | 'kilograms' | 'ounces' | 'pounds'
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

export default function PostRecipePage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "", amount: "", unit: 'grams' }])
  const [instructions, setInstructions] = useState<Instruction[]>([{ text: "" }])
  const [tags, setTags] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState("")
  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryType[]>([])
  const [author, setAuthor] = useState("")
  const [prepTime, setPrepTime] = useState("")
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
    setIngredients([...ingredients, { name: "", amount: "", unit: 'grams' }])
  }

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...ingredients]
    newIngredients.splice(index, 1)
    setIngredients(newIngredients)
  }

  const handleIngredientChange = (index: number, field: "name" | "amount" | "unit", value: string) => {
    const newIngredients = [...ingredients]
    if (field === "unit") {
      newIngredients[index][field] = value as 'grams' | 'kilograms' | 'ounces' | 'pounds'
    } else {
      newIngredients[index][field] = value
    }
    setIngredients(newIngredients)

    // Add new row if this is the last row and it's not empty
    if (index === ingredients.length - 1 && (value.trim() !== '' || newIngredients[index].name.trim() !== '' || newIngredients[index].amount.trim() !== '')) {
      handleAddIngredient()
    }
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

    // Add new row if this is the last row and it's not empty
    if (index === instructions.length - 1 && value.trim() !== '') {
      handleAddInstruction()
    }
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
        // Check if Supabase is properly configured
        if (!supabase) {
          throw new Error('Supabase client not properly configured')
        }

        const file = e.target.files[0]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please upload an image file')
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image size should be less than 5MB')
        }

        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `recipes/${fileName}`

        console.log('Attempting to upload to path:', filePath)
        console.log('File details:', {
          name: file.name,
          type: file.type,
          size: file.size
        })

        // Upload image to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("recipes")
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Supabase upload error:', uploadError)
          console.error('Error details:', {
            message: uploadError.message,
            name: uploadError.name
          })
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        console.log('Upload successful:', uploadData)

        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from("recipes")
          .getPublicUrl(filePath)

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get public URL for uploaded image')
        }

        console.log('Public URL:', urlData.publicUrl)
        setImages([...images, urlData.publicUrl])
      } catch (error) {
        console.error("Upload error:", error)
        if (error instanceof Error) {
          console.error("Error stack:", error.stack)
          console.error("Error name:", error.name)
        }
        setErrors(prev => ({ 
          ...prev, 
          images: error instanceof Error ? error.message : "Failed to upload image. Please try again." 
        }))
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

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      const newTag = customTagInput.trim()
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag])
      }
      setCustomTagInput("")
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Check required fields
    if (!title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!author.trim()) {
      newErrors.author = "Author name is required"
    }

    const hasValidIngredient = ingredients.some(ing => ing.name.trim())
    if (!hasValidIngredient) {
      newErrors.ingredients = "At least one ingredient is required"
    }

    const hasValidInstruction = instructions.some(inst => inst.text.trim())
    if (!hasValidInstruction) {
      newErrors.instructions = "At least one instruction is required"
    }

    setErrors(newErrors)
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateForm()
    if (!validation.isValid) return

    setIsSubmitting(true)

    try {
      // Prepare recipe data
      const recipeData = {
        title,
        description,
        cuisine: tags.find(tag => ['Italian', 'Mexican', 'Asian', 'Indian', 'American'].includes(tag)) || null,
        tags: [...tags, ...dietaryRestrictions],
        ingredients: ingredients
          .filter(ing => ing.name.trim())
          .map(ing => ({
            name: ing.name.trim(),
            amount: ing.amount.trim(),
            unit: ing.unit
          })),
        steps: instructions
          .filter(inst => inst.text.trim())
          .map(inst => inst.text.trim()),
        prep_time_minutes: parseInt(prepTime) || 0,
        cook_time_minutes: parseInt(cookTime) || 0,
        servings: parseInt(servings) || 0,
        difficulty,
        notes,
        featured: false,
        image_urls: images
      }

      // Send to API
      const response = await fetch('/api/recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData)
      })

      if (!response.ok) {
        throw new Error('Failed to create recipe')
      }

      const data = await response.json()
      
      // Redirect to the recipe page
      router.push(`/r?id=${data.recipeId}`)
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
        <div className="md:w-1/2 relative bg-gray-200 flex items-center justify-center min-h-[400px]">
          {images.length > 0 ? (
            <div className="relative w-full h-full">
              <Image src={images[0] || "/placeholder.svg"} alt="Recipe preview" fill className="object-cover" />
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(0)}
                  className="bg-transparent border-2 border-[#e80b07] text-[#e80b07] p-2 hover:bg-[#e80b07] hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
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
                  className={`bg-transparent border-2 border-[#32c94e] text-[#32c94e] p-2 hover:bg-[#32c94e] hover:text-white transition-colors cursor-pointer ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Upload className="h-5 w-5" />
                </label>
              </div>
            </div>
          ) : (
            <div className="text-center p-6">
              <Upload className="h-16 w-16 text-black mx-auto mb-4" />
              <p className="font-matina text-black mb-2">Upload a tasty image for your recipe</p>
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
                className={`bg-white border-2 border-[#32c94e] text-[#32c94e] font-matina inline-block cursor-pointer mt-4 px-4 py-1.5 hover:bg-[#32c94e] hover:text-white transition-colors ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
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
                Recipe Title <span className="text-[#e80b07]">*</span>
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
              ></textarea>
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
                        : "bg-white text-black border border-gray-300 hover:bg-[#32c94e] hover:text-white"
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
                <label htmlFor="prepTime" className="block font-matina text-sm mb-1">
                  Prep Time (in minutes)
                </label>
                <input
                  id="prepTime"
                  type="number"
                  min="0"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full px-4 py-2 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                />
              </div>

              <div>
                <label htmlFor="cookTime" className="block font-matina text-sm mb-1">
                  Cook Time (in minutes)
                </label>
                <input
                  id="cookTime"
                  type="number"
                  min="0"
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  placeholder="e.g. 30"
                  className="w-full px-4 py-2 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                />
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
                />
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
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>

              <div className="col-span-2">
                <label htmlFor="author" className="block font-matina text-sm mb-1">
                  Your Name <span className="text-[#e80b07]">*</span>
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
          </form>
        </div>
      </div>

      <div className="container mx-auto py-8">
        <div className="mx-auto w-full px-4">
          {/* Ingredients */}
          <div className="mb-8">
            <h2 className="font-gaya text-2xl mb-4">
              Ingredients <span className="text-[#e80b07]">*</span>
            </h2>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="space-y-4">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                        placeholder="Ingredient name"
                        className="w-full px-4 py-3 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                        required
                      />
                    </div>
                    <div className="w-1/3">
                      <input
                        type="number"
                        value={ingredient.amount}
                        onChange={(e) => handleIngredientChange(index, "amount", e.target.value)}
                        placeholder="Amount (e.g. 100 or 0.5)"
                        className="w-full px-4 py-3 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                      />
                    </div>
                    <div className="w-1/4">
                      <select
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, "unit", e.target.value)}
                        className="w-full px-4 py-3 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                      >
                        <option value="grams">grams</option>
                        <option value="kilograms">kilograms</option>
                        <option value="ounces">ounces</option>
                        <option value="pounds">pounds</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="text-[#e80b07] border-2 border-[#e80b07] hover:bg-[#e80b07] hover:text-white p-1.5 transition-colors"
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
                className="flex items-center mt-6 text-[#32c94e] font-matina border-2 border-[#32c94e] px-4 py-1.5 hover:bg-[#32c94e] hover:text-white transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Ingredient
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <h2 className="font-gaya text-2xl mb-4">
              Instructions <span className="text-[#e80b07]">*</span>
            </h2>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="space-y-6">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex items-center justify-center bg-[#32c94e] text-white rounded-full w-8 h-8 mt-2 font-matina font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <textarea
                        value={instruction.text}
                        onChange={(e) => handleInstructionChange(index, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        rows={3}
                        className="w-full px-4 py-3 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                        required
                      ></textarea>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInstruction(index)}
                      className="text-[#e80b07] border-2 border-[#e80b07] hover:bg-[#e80b07] hover:text-white p-1.5 transition-colors mt-2"
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
                className="flex items-center mt-6 text-[#32c94e] font-matina border-2 border-[#32c94e] px-4 py-1.5 hover:bg-[#32c94e] hover:text-white transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Step
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-8">
            <h2 className="font-gaya text-2xl mb-4">Notes</h2>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes, tips, or variations for this recipe"
                rows={4}
                className="w-full px-4 py-3 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Tags and Upload Button */}
      <div className="pb-8">
        <div className="container mx-auto px-4">
          {/* Tags */}
          <div className="bg-white rounded-lg p-6 shadow-md mb-8">
            <h2 className="font-gaya text-xl mb-4">Tags</h2>
            <p className="font-matina text-black mb-4">Select all that apply:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full font-matina text-sm ${
                    tags.includes(tag) 
                      ? "bg-[#32c94e] text-white border-1 border-[#32c94e]" 
                      : "bg-white text-black border border-gray-300 hover:bg-[#32c94e] hover:text-white hover:border-[#32c94e]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder="Add a custom tag"
                className="w-full px-4 py-2 border rounded-full font-matina text-sm focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customTagInput.trim() && !tags.includes(customTagInput.trim())) {
                    setTags([...tags, customTagInput.trim()])
                    setCustomTagInput("")
                  }
                }}
                className="bg-transparent border border-[#32c94e] text-[#32c94e] px-4 py-2 font-matina text-sm hover:bg-[#32c94e] hover:text-white transition-colors"
              >
                Add Tag
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-4">
                <p className="font-matina text-sm text-black mb-2">Your tags:</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="bg-[#32c94e] text-white border-1 border-[#32c94e] px-4 py-2 rounded-full font-matina text-sm flex items-center gap-2"
                    >
                      {tag}
                      <X className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Section */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              {Object.keys(errors).length > 0 && (
                <div className="text-[#e80b07] font-matina text-sm">
                  <p>Please fill in all required fields:</p>
                  <ul className="list-disc list-inside mt-1">
                    {errors.title && <li>Recipe title</li>}
                    {errors.author && <li>Your name</li>}
                    {errors.ingredients && <li>At least one ingredient</li>}
                    {errors.instructions && <li>At least one instruction</li>}
                  </ul>
                </div>
              )}
              <div className="w-full flex justify-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full sm:w-auto bg-[#32c94e] text-white font-matina text-lg px-8 py-3 rounded-lg hover:bg-[#2a9e3d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Upload Recipe
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}