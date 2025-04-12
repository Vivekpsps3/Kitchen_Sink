"use server"

import { createClient } from "./server"

export async function seedDatabase() {
  const supabase = createClient()

  console.log("Starting database seeding...")

  // Check if we already have recipes
  const { data: existingRecipes, error: checkError } = await supabase.from("recipes").select("id").limit(1)

  if (!checkError && existingRecipes && existingRecipes.length > 0) {
    console.log("Database already has recipes, skipping seed")
    return { success: true, message: "Database already seeded" }
  }

  try {
    // Create a test user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        username: "TestChef",
        email: "test@example.com",
      })
      .select()
      .single()

    if (userError) {
      throw new Error(`Error creating test user: ${userError.message}`)
    }

    const userId = user.id

    // Create some recipes
    const recipes = [
      {
        title: "Classic Spaghetti Carbonara",
        description: "A creamy Italian pasta dish with eggs, cheese, pancetta, and black pepper.",
        image_url: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=2671&auto=format&fit=crop",
        cook_time: "25 minutes",
        servings: 4,
        difficulty: "Intermediate",
        user_id: userId,
      },
      {
        title: "Vegetarian Buddha Bowl",
        description: "A nutritious bowl filled with roasted vegetables, grains, and a delicious dressing.",
        image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2680&auto=format&fit=crop",
        cook_time: "35 minutes",
        servings: 2,
        difficulty: "Beginner",
        user_id: userId,
      },
      {
        title: "Chocolate Chip Cookies",
        description: "Classic homemade cookies with chocolate chips and a soft, chewy center.",
        image_url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=2671&auto=format&fit=crop",
        cook_time: "20 minutes",
        servings: 24,
        difficulty: "Beginner",
        user_id: userId,
      },
    ]

    for (const recipe of recipes) {
      // Insert recipe
      const { data: newRecipe, error: recipeError } = await supabase.from("recipes").insert(recipe).select().single()

      if (recipeError) {
        console.error(`Error creating recipe ${recipe.title}:`, recipeError)
        continue
      }

      const recipeId = newRecipe.id

      // Add ingredients based on the recipe
      let ingredients = []

      if (recipe.title === "Classic Spaghetti Carbonara") {
        ingredients = [
          { recipe_id: recipeId, name: "Spaghetti", amount: "400g" },
          { recipe_id: recipeId, name: "Pancetta", amount: "150g" },
          { recipe_id: recipeId, name: "Egg Yolks", amount: "4" },
          { recipe_id: recipeId, name: "Parmesan Cheese", amount: "50g" },
          { recipe_id: recipeId, name: "Black Pepper", amount: "to taste" },
        ]
      } else if (recipe.title === "Vegetarian Buddha Bowl") {
        ingredients = [
          { recipe_id: recipeId, name: "Quinoa", amount: "1 cup" },
          { recipe_id: recipeId, name: "Sweet Potato", amount: "1 large" },
          { recipe_id: recipeId, name: "Chickpeas", amount: "1 can" },
          { recipe_id: recipeId, name: "Avocado", amount: "1" },
          { recipe_id: recipeId, name: "Kale", amount: "2 cups" },
          { recipe_id: recipeId, name: "Tahini Dressing", amount: "3 tbsp" },
        ]
      } else if (recipe.title === "Chocolate Chip Cookies") {
        ingredients = [
          { recipe_id: recipeId, name: "Flour", amount: "2 cups" },
          { recipe_id: recipeId, name: "Butter", amount: "1 cup" },
          { recipe_id: recipeId, name: "Brown Sugar", amount: "1 cup" },
          { recipe_id: recipeId, name: "White Sugar", amount: "1/2 cup" },
          { recipe_id: recipeId, name: "Eggs", amount: "2" },
          { recipe_id: recipeId, name: "Vanilla Extract", amount: "1 tsp" },
          { recipe_id: recipeId, name: "Chocolate Chips", amount: "2 cups" },
        ]
      }

      if (ingredients.length > 0) {
        const { error: ingredientsError } = await supabase.from("ingredients").insert(ingredients)

        if (ingredientsError) {
          console.error(`Error adding ingredients for ${recipe.title}:`, ingredientsError)
        }
      }

      // Add instructions
      let instructions = []

      if (recipe.title === "Classic Spaghetti Carbonara") {
        instructions = [
          {
            recipe_id: recipeId,
            step_number: 1,
            content: "Bring a large pot of salted water to boil and cook spaghetti according to package instructions.",
          },
          {
            recipe_id: recipeId,
            step_number: 2,
            content: "While pasta cooks, fry pancetta in a large pan until crispy.",
          },
          { recipe_id: recipeId, step_number: 3, content: "In a bowl, whisk together egg yolks and grated parmesan." },
          {
            recipe_id: recipeId,
            step_number: 4,
            content: "Drain pasta, reserving some cooking water, and add to the pan with pancetta.",
          },
          {
            recipe_id: recipeId,
            step_number: 5,
            content:
              "Remove from heat, add egg mixture and stir quickly. Add pasta water if needed to create a creamy sauce.",
          },
        ]
      } else if (recipe.title === "Vegetarian Buddha Bowl") {
        instructions = [
          { recipe_id: recipeId, step_number: 1, content: "Cook quinoa according to package instructions." },
          {
            recipe_id: recipeId,
            step_number: 2,
            content: "Preheat oven to 400°F (200°C). Cube sweet potato and roast for 25 minutes.",
          },
          {
            recipe_id: recipeId,
            step_number: 3,
            content: "Drain and rinse chickpeas, then roast with olive oil and spices for 15 minutes.",
          },
          { recipe_id: recipeId, step_number: 4, content: "Massage kale with olive oil and a pinch of salt." },
          {
            recipe_id: recipeId,
            step_number: 5,
            content: "Assemble bowl with quinoa, roasted vegetables, chickpeas, sliced avocado, and kale.",
          },
          { recipe_id: recipeId, step_number: 6, content: "Drizzle with tahini dressing and serve." },
        ]
      } else if (recipe.title === "Chocolate Chip Cookies") {
        instructions = [
          { recipe_id: recipeId, step_number: 1, content: "Preheat oven to 375°F (190°C)." },
          { recipe_id: recipeId, step_number: 2, content: "Cream together butter and sugars until light and fluffy." },
          { recipe_id: recipeId, step_number: 3, content: "Beat in eggs one at a time, then add vanilla." },
          { recipe_id: recipeId, step_number: 4, content: "Mix in flour, baking soda, and salt." },
          { recipe_id: recipeId, step_number: 5, content: "Fold in chocolate chips." },
          {
            recipe_id: recipeId,
            step_number: 6,
            content: "Drop spoonfuls of dough onto baking sheets and bake for 9-11 minutes.",
          },
        ]
      }

      if (instructions.length > 0) {
        const { error: instructionsError } = await supabase.from("instructions").insert(instructions)

        if (instructionsError) {
          console.error(`Error adding instructions for ${recipe.title}:`, instructionsError)
        }
      }

      // Add tags
      const tags = []
      if (recipe.title === "Classic Spaghetti Carbonara") {
        tags.push("Italian", "Pasta", "Dinner", "Egg-Free")
      } else if (recipe.title === "Vegetarian Buddha Bowl") {
        tags.push("Vegetarian", "Healthy", "Bowl", "Gluten-Free")
      } else if (recipe.title === "Chocolate Chip Cookies") {
        tags.push("Dessert", "Baking", "Snack", "Nut-Free")
      }

      for (const tagName of tags) {
        // Check if tag exists
        const { data: existingTag, error: tagError } = await supabase
          .from("tags")
          .select("*")
          .eq("name", tagName)
          .single()

        let tagId

        if (tagError && tagError.code === "PGRST116") {
          // Create tag if it doesn't exist
          const { data: newTag, error: createTagError } = await supabase
            .from("tags")
            .insert({ name: tagName })
            .select()
            .single()

          if (createTagError) {
            console.error(`Error creating tag ${tagName}:`, createTagError)
            continue
          }

          tagId = newTag.id
        } else if (tagError) {
          console.error(`Error checking tag ${tagName}:`, tagError)
          continue
        } else {
          tagId = existingTag.id
        }

        // Associate tag with recipe
        const { error: recipeTagError } = await supabase.from("recipe_tags").insert({
          recipe_id: recipeId,
          tag_id: tagId,
        })

        if (recipeTagError) {
          console.error(`Error associating tag ${tagName} with recipe:`, recipeTagError)
        }
      }

      // Add recipe to featured recipes
      if (recipe.title === "Classic Spaghetti Carbonara") {
        const { error: featuredError } = await supabase.from("featured_recipes").insert({
          recipe_id: recipeId,
          featured_date: new Date().toISOString(),
        })

        if (featuredError) {
          console.error(`Error featuring recipe ${recipe.title}:`, featuredError)
        }
      }
    }

    console.log("Database seeding completed successfully")
    return { success: true, message: "Database seeded successfully" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, message: `Error seeding database: ${error.message}` }
  }
}
