import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function generateUserId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${random}`
}

export async function POST(request: Request) {
  try {
    const recipeData = await request.json()
    const cookieStore = await cookies()
    
    // Get or create user ID from cookie
    let userId = cookieStore.get('userId')?.value
    if (!userId) {
      userId = generateUserId()
      const response = NextResponse.json({ 
        message: 'Recipe created successfully',
        recipeId: null 
      }, { status: 201 })
      
      response.cookies.set('userId', userId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      
      return response
    }

    // Validate required fields
    if (!recipeData.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Insert recipe into Supabase
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title: recipeData.title,
        cuisine: recipeData.cuisine,
        prep_time_minutes: recipeData.prep_time_minutes,
        cook_time_minutes: recipeData.cook_time_minutes,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty,
        notes: recipeData.notes,
        featured: recipeData.featured || false,
        user_id: userId // Add the user ID from cookie
      })
      .select()
      .single()

    if (recipeError) {
      return NextResponse.json({ error: recipeError.message }, { status: 500 })
    }

    // Handle ingredients
    if (recipeData.ingredients && recipeData.ingredients.length > 0) {
      const ingredientsToInsert = recipeData.ingredients.map((ingredient: any) => ({
        recipe_id: recipe.id,
        ...ingredient
      }))

      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert)

      if (ingredientsError) {
        console.error('Error adding ingredients:', ingredientsError)
      }
    }

    // Handle steps
    if (recipeData.steps && recipeData.steps.length > 0) {
      const stepsToInsert = recipeData.steps.map((step: string, index: number) => ({
        recipe_id: recipe.id,
        step_number: index + 1,
        instruction: step
      }))

      const { error: stepsError } = await supabase
        .from('recipe_steps')
        .insert(stepsToInsert)

      if (stepsError) {
        console.error('Error adding steps:', stepsError)
      }
    }

    // Handle tags
    if (recipeData.tags && recipeData.tags.length > 0) {
      for (const tagName of recipeData.tags) {
        // Check if tag exists
        const { data: existingTag, error: tagError } = await supabase
          .from('tags')
          .select('*')
          .eq('name', tagName)
          .single()

        if (tagError && tagError.code !== 'PGRST116') {
          console.error('Error checking tag:', tagError)
          continue
        }

        let tagId

        if (!existingTag) {
          // Create tag if it doesn't exist
          const { data: newTag, error: createTagError } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select()
            .single()

          if (createTagError || !newTag) {
            console.error('Error creating tag:', createTagError)
            continue
          }

          tagId = newTag.id
        } else {
          tagId = existingTag.id
        }

        // Associate tag with recipe
        const { error: recipeTagError } = await supabase
          .from('recipe_tags')
          .insert({
            recipe_id: recipe.id,
            tag_id: tagId
          })

        if (recipeTagError) {
          console.error('Error associating tag with recipe:', recipeTagError)
        }
      }
    }

    return NextResponse.json({ 
      message: 'Recipe created successfully',
      recipeId: recipe.id 
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json({ 
      error: 'Failed to create recipe' 
    }, { status: 500 })
  }
} 