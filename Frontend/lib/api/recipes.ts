export async function getRecipeById(id: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    throw new Error('API URL is not configured. Please set NEXT_PUBLIC_API_URL in your environment variables.')
  }

  try {
    const response = await fetch(`${apiUrl}/recipe/${id}`)
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch recipe: ${response.statusText}`)
    }
    const data = await response.json()
    return data.content.recipe
  } catch (error) {
    console.error('Error fetching recipe:', error)
    // Return mock data for development
    return {
      title: "Palak Paneer Lasagna Roll-Ups with Makhani Béchamel",
      cuisine: "Indian-Italian Fusion",
      tags: ["vegetarian", "fusion", "make-ahead", "comfort food"],
      ingredient_sections: [
        {
          section_name: "For the Palak Paneer Filling",
          ingredients: [
            {
              name: "Paneer",
              amount: "1",
              unit: "block (12-14 ounces)",
              notes: "crumbled or grated"
            },
            {
              name: "Baby spinach",
              amount: "10",
              unit: "ounces",
              notes: "fresh, washed"
            }
          ]
        }
      ],
      steps: [
        "Preheat oven to 375°F (190°C).",
        "Prepare the Palak Paneer Filling: Blanch spinach in boiling water for 1 minute, then immediately transfer to an ice bath.",
        "In a pan, heat canola oil. Add onion and sauté until translucent."
      ],
      prep_time_minutes: 30,
      cook_time_minutes: 40,
      servings: 4,
      difficulty: "medium",
      notes: "The Makhani Béchamel sauce can be made ahead of time. Store in the refrigerator for up to 2 days and reheat before using."
    }
  }
} 