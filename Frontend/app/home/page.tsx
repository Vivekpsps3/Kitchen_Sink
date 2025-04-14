import { Search, Sparkle } from "lucide-react"
import RecipeCard, { RecipeCardProps } from "@/components/recipe-card"
import FeaturedCarousel from "@/components/featured-carousel"
import { getRecipes, getFeaturedRecipes } from "@/lib/supabase/recipes"
import Navbar from "@/components/navbar"

type DietaryType =
  | "Vegan"
  | "Vegetarian"
  | "Gluten-Free"
  | "Dairy-Free"
  | "Nut-Free"
  | "Egg-Free"
  | "Fish-Free"
  | "Meat-Free"

interface Recipe {
  id: string
  title: string
  image_url?: string
  tags: string[]
  difficulty?: string
  comments?: any[]
}

export default async function Home() {
  console.log("Rendering home page")

  // Fetch recipes and featured recipes from Supabase
  const recipesData = await getRecipes()
  const featuredRecipesData = await getFeaturedRecipes()

  console.log(`Fetched ${recipesData?.length || 0} recipes and ${featuredRecipesData?.length || 0} featured recipes`)

  // Transform the data to match our component props
  const recipes = (recipesData || []).map((recipe: Recipe) => {
    if (!recipe) return null;
    
    // Extract tags from recipe_tags
    const tags = recipe.tags || []

    // Extract dietary restrictions from tags
    const dietaryRestrictions = tags.filter((tag: string): tag is DietaryType =>
      ["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Nut-Free", "Egg-Free", "Fish-Free", "Meat-Free"].includes(
        tag,
      ),
    )

    return {
      id: recipe.id || "unknown",
      title: recipe.title || "Untitled Recipe",
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
      commentCount: recipe.comments?.length || 0,
      difficulty: recipe.difficulty || "Intermediate",
    }
  }).filter(Boolean) as RecipeCardProps[];

  // Transform featured recipes data
  const featuredMeals = (featuredRecipesData || []).map((featured: any) => {
    if (!featured?.recipes) return null;
    
    const recipe = featured.recipes;
    return {
      id: recipe.id || "unknown",
      title: recipe.title || "Untitled Recipe",
      image: recipe.image_url || "/placeholder.svg?height=600&width=1200",
      chef: recipe.users?.username || "Anonymous Chef",
      description: recipe.description || "A delicious recipe prepared with care and premium ingredients.",
    }
  }).filter(Boolean);

  // If we don't have enough featured recipes, use some mock data
  if (featuredMeals.length < 3) {
    const mockFeaturedMeals = [
      {
        id: "20",
        title: "Vegetarian Buddha Bowl",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        chef: "Emma Rodriguez",
        description:
          "A vibrant, nutrient-packed bowl featuring the season's freshest produce. This colorful dish combines roasted root vegetables, leafy greens, and protein-rich quinoa, all topped with a zesty homemade dressing that brings the flavors together perfectly.",
      },
      {
        id: "21",
        title: "Lion's Mane and Tomato on Toast",
        image:
          "https://images.unsplash.com/photo-1592757063751-8957c6619772?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        chef: "Marco Olivetti",
        description:
          "Handcrafted sourdough bread topped with lion's mane, sundried tomatoes, and extra virgin olive oil. This simple yet elegant appetizer showcases the pure flavors of quality ingredients and traditional techniques.",
      },
      {
        id: "22",
        title: "Garden-to-Table Pesto Farfalle",
        image:
          "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        chef: "Sophia Chen",
        description:
          "Freshly made pesto from home-grown basil, garlic, and pine nuts. Tossed with farfalle pasta and seasonal vegetables, this dish is a celebration of summer's bounty. Each bite is a burst of flavor, making it a perfect choice for any occasion.",
      },
    ]

    // Add mock data to fill in if we have fewer than 3 featured recipes
    while (featuredMeals.length < 3) {
      featuredMeals.push(mockFeaturedMeals[featuredMeals.length % mockFeaturedMeals.length])
    }
  }

  // If we don't have enough recipes, use some mock data
  if (recipes.length < 1) {
    const mockRecipes = [
      {
        id: "1",
        title: "Vegetarian Buddha Bowl",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        tags: ["Healthy", "Quick", "Easy"],
        dietaryRestrictions: ["Vegetarian", "Nut-Free"],
        rating: 4.8,
        commentCount: 24,
        difficulty: "Beginner",
      },
      {
        id: "2",
        title: "Lion's Mane and Tomato on Toast",
        image:
          "https://images.unsplash.com/photo-1639667870243-ec729a155145?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        tags: ["Gourmet", "Healthy"],
        dietaryRestrictions: ["Vegetarian", "Gluten-Free"],
        rating: 4.5,
        commentCount: 18,
        difficulty: "Intermediate",
      },
      {
        id: "3",
        title: "Chocolate Chip Cookies",
        image:
          "https://images.unsplash.com/photo-1625876981820-be17a6807189?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        tags: ["Dessert", "Baking", "Snack"],
        dietaryRestrictions: ["Nut-Free"],
        rating: 4.9,
        commentCount: 32,
        difficulty: "Beginner",
      },
      {
        id: "4",
        title: "Traditional Spaghetti Carbonara",
        image:
          "https://images.unsplash.com/photo-1692071097529-320eb2b32292?q=80&w=1976&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        tags: ["Italian", "Pasta", "Quick"],
        dietaryRestrictions: ["Egg-Free", "Nut-Free"],
        rating: 4.8,
        commentCount: 39,
        difficulty: "Intermediate",
      },
      {
        id: "5",
        title: "Classic Katsu Curry Don",
        image:
          "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?q=80&w=1964&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        tags: ["Healthy", "Bowl"],
        dietaryRestrictions: ["Nut-Free"],
        rating: 4.5,
        commentCount: 45,
        difficulty: "Advanced",
      },
      {
        id: "6",
        title: "Hearty English Breakfast",
        image:
          "https://images.unsplash.com/photo-1588625436591-c6d853288b60?q=80&w=1929&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        tags: ["Breakfast"],
        dietaryRestrictions: ["Nut-Free"],
        rating: 4.9,
        commentCount: 13,
        difficulty: "Beginner",
      },

    ]

    // Add mock data to fill in if we have fewer than 6 recipes
    while (recipes.length < 6) {
      const baseRecipe = mockRecipes[recipes.length % mockRecipes.length]
      recipes.push({
        ...baseRecipe,
        id: `${baseRecipe.id}-${recipes.length + 1}` // Ensure unique IDs
      })
    }
  }

  return (
    <>
      <Navbar showSearch={false} />
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section with Search */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <span className="relative inline-block">
              <h1 className="font-gaya text-4xl md:text-5xl mb-4">Meal Planning Made Easy</h1>
              <Sparkle className="text-4xl text-yellow-400 absolute top-[-15.2px] right-[-32px] h-[40px] w-[40px] rotate-[4deg]" />
            </span>
            <p className="font-matina text-lg text-gray-600 max-w-2xl mx-auto">
              Explore thousands of professional recipes, variety of difficulties for your novice cooks to the master chefs, and get your meals at the lowest costs.
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
            <h2 className="font-gaya text-2xl md:text-3xl">Flavors of the week</h2>
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
                  <h3 className="font-gaya text-lg">
                    {category.split(" & ").map((part, index) => (
                      <span key={index}>
                        {part}
                        {index < category.split(" & ").length - 1 && (
                          <span className="font-serif font-bold"> & </span>
                        )}
                      </span>
                    ))}
                  </h3>
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