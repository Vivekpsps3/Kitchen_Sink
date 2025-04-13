import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const time = searchParams.get('time')
    const diet = searchParams.get('diet')

    let query = supabase
      .from('recipes')
      .select(`
        *,
        users (username, avatar_url),
        recipe_tags (
          tags (*)
        )
      `)

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply category filter if provided
    if (category) {
      query = query.eq('category', category)
    }

    // Apply difficulty filter if provided
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    // Apply time filter if provided
    if (time) {
      query = query.eq('cooking_time', time)
    }

    // Apply diet filter if provided
    if (diet) {
      query = query.eq('dietary_restrictions', diet)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recipes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recipes' },
        { status: 500 }
      )
    }

    // Transform the data to match the frontend's expected format
    const transformedRecipes = data.map((recipe: any) => {
      const tags = recipe.recipe_tags?.map((rt: any) => rt.tags?.name).filter(Boolean) || []
      
      const dietaryRestrictions = tags.filter((tag: string) =>
        [
          "Vegan",
          "Vegetarian",
          "Gluten-Free",
          "Dairy-Free",
          "Nut-Free",
          "Egg-Free",
          "Fish-Free",
          "Meat-Free",
        ].includes(tag)
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
            ].includes(tag)
        ),
        dietaryRestrictions,
        rating: recipe.rating || 4.5,
        commentCount: recipe.comment_count || 10,
        difficulty: recipe.difficulty || "Intermediate",
      }
    })

    return NextResponse.json(transformedRecipes)
  } catch (error) {
    console.error('Error in recipes endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 