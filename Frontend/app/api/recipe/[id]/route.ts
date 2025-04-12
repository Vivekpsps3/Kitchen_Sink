import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Fetch recipe from Supabase
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_tags (
          tags (
            name
          )
        ),
        recipe_ingredients (
          ingredients (
            name,
            amount,
            unit,
            notes
          )
        ),
        recipe_steps (
          step_number,
          instruction
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Transform the data to match the expected format
    const transformedRecipe = {
      id: recipe.id,
      created_at: recipe.created_at,
      title: recipe.title,
      cuisine: recipe.cuisine,
      tags: recipe.recipe_tags?.map((rt: any) => rt.tags?.name).filter(Boolean) || [],
      ingredients: recipe.recipe_ingredients?.map((ri: any) => ({
        name: ri.ingredients?.name,
        amount: ri.ingredients?.amount,
        unit: ri.ingredients?.unit,
        notes: ri.ingredients?.notes
      })) || [],
      steps: recipe.recipe_steps
        ?.sort((a: any, b: any) => a.step_number - b.step_number)
        .map((step: any) => step.instruction) || [],
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      notes: recipe.notes
    }

    return NextResponse.json(transformedRecipe)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 