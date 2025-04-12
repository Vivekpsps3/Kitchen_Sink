import { Search } from "lucide-react"
import RecipeCard from "@/components/recipe-card"
import FeaturedCarousel from "@/components/featured-carousel"
import { getRecipes, getFeaturedRecipes } from "@/lib/supabase/recipes"
import Navbar from "@/components/navbar"

export default async function Home() {
  console.log("Rendering home page")

  // Fetch recipes and featured recipes from Supabase
  const recipesData = await getRecipes()
  const featuredRecipesData = await getFeaturedRecipes()

  console.log(`Fetched ${recipesData.length} recipes and ${featuredRecipesData.length} featured recipes`)

  // Transform the data to match our component props
  const recipes = recipesData.map((recipe: any) => {
    // Extract tags from recipe_tags
    const tags = recipe.recipe_tags?.map((rt: any) => rt.tags?.name).filter(Boolean) || []

    // Extract dietary restrictions from tags
    const dietaryRestrictions = tags.filter((tag: string) =>
      ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Nut-Free", "Egg-Free", "Fish-Free", "Meat-Free"].includes(
        tag,
      ),
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

  // Transform featured recipes data
  const featuredMeals = featuredRecipesData.map((featured: any) => {
    const recipe = featured.recipes
    return {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image_url || "/placeholder.svg?height=600&width=1200",
      chef: recipe.users?.username || "Anonymous Chef",
      description: recipe.description || "A delicious recipe prepared with care and premium ingredients.",
    }
  })

  // If we don't have enough featured recipes, use some mock data
  if (featuredMeals.length < 3) {
    const mockFeaturedMeals = [
      {
        id: "featured-1",
        title: "Seasonal Harvest Bowl with Fresh Vegetables",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        chef: "Emma Rodriguez",
        description:
          "A vibrant, nutrient-packed bowl featuring the season's freshest produce. This colorful dish combines roasted root vegetables, leafy greens, and protein-rich quinoa, all topped with a zesty homemade dressing that brings the flavors together perfectly.",
      },
      {
        id: "featured-2",
        title: "Artisanal Sourdough with Heirloom Tomato Bruschetta",
        image:
          "https://images.unsplash.com/photo-1639667870243-ec729a155145?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        chef: "Marco Olivetti",
        description:
          "Handcrafted sourdough bread topped with heirloom tomatoes, fresh basil, and extra virgin olive oil. This simple yet elegant appetizer showcases the pure flavors of quality ingredients and traditional techniques.",
      },
      {
        id: "featured-3",
        title: "Farm-to-Table Seasonal Vegetable Platter",
        image:
          "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        chef: "Sophia Chen",
        description:
          "A stunning arrangement of locally-sourced vegetables, perfectly roasted and seasoned to enhance their natural flavors. This versatile dish works beautifully as a main course or as a complement to any protein.",
      },
    ]

    // Add mock data to fill in if we have fewer than 3 featured recipes
    while (featuredMeals.length < 3) {
      featuredMeals.push(mockFeaturedMeals[featuredMeals.length % mockFeaturedMeals.length])
    }
  }

  // If we don't have enough recipes, use some mock data
  if (recipes.length < 6) {
    const mockRecipes = [
      {
        id: "1",
        title: "Classic Spaghetti Carbonara",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        tags: ["Italian", "Pasta", "Quick"],
        dietaryRestrictions: ["Egg-Free", "Nut-Free"],
        rating: 4.8,
        commentCount: 24,
        difficulty: "Intermediate",
      },
      {
        id: "2",
        title: "Vegetarian Buddha Bowl",
        image:
          "https://images.unsplash.com/photo-1639667870243-ec729a155145?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        tags: ["Healthy", "Bowl"],
        dietaryRestrictions: ["Vegetarian", "Gluten-Free"],
        rating: 4.5,
        commentCount: 18,
        difficulty: "Beginner",
      },
      {
        id: "3",
        title: "Chocolate Chip Cookies",
        image:
          "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        tags: ["Dessert", "Baking", "Snack"],
        dietaryRestrictions: ["Nut-Free"],
        rating: 4.9,
        commentCount: 32,
        difficulty: "Beginner",
      },
    ]

    // Add mock data to fill in if we have fewer than 6 recipes
    while (recipes.length < 6) {
      recipes.push(mockRecipes[recipes.length % mockRecipes.length])
    }
  }

  return (
    <>
      <Navbar showSearch={false} />
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section with Search */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h1 className="font-gaya text-4xl md:text-5xl mb-4">Discover Culinary Excellence</h1>
            <p className="font-matina text-lg text-gray-600 max-w-2xl mx-auto">
              Explore thousands of professional recipes, create your own culinary masterpieces, and connect with
              passionate food lovers.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-8 relative">
            <form action="/search" method="GET" className="relative">
              <input
                type="text"
                name="q"
                placeholder="Search recipes by name, ingredient, or cuisine..."
                className="w-full py-3 px-12 rounded-full border border-gray-300 shadow-sm font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </form>
          </div>
        </section>

        {/* Featured Meals Carousel */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-gaya text-2xl md:text-3xl">Today's Featured Meals</h2>
            <a href="/featured" className="font-matina text-[#3cbbf1] hover:underline">
              View all
            </a>
          </div>
          <FeaturedCarousel meals={featuredMeals} />
        </section>

        {/* Popular Recipes */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-gaya text-2xl md:text-3xl">Popular Recipes</h2>
            <a href="/recipes" className="font-matina text-[#3cbbf1] hover:underline">
              View all
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} {...recipe} />
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <h2 className="font-gaya text-2xl md:text-3xl mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Breakfast", "Lunch", "Dinner", "Dessert", "Vegetarian", "Gluten-Free", "Quick & Easy", "Gourmet"].map(
              (category) => (
                <a
                  key={category}
                  href={`/search?category=${category.toLowerCase().replace(" & ", "-")}`}
                  className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-gaya text-lg">{category}</h3>
                  <p className="font-matina text-sm text-gray-500 mt-1">Explore recipes</p>
                </a>
              ),
            )}
          </div>
        </section>
      </div>
    </>
  )
} 