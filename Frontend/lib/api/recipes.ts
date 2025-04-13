export async function getRecipeById(id: string) {
  const apiUrl = process.env.KITCHEN_SINK_REST_URL

  console.log(`API URL: ${apiUrl}/recipe/${id}`)
  if (!apiUrl) {
    throw new Error('API URL is not configured. Please set NEXT_PUBLIC_API_URL in your environment variables.')
  }

  console.log(`Attempting to fetch recipe from: ${apiUrl}/recipe/${id}`)

  try {
    const response = await fetch(`${apiUrl}/recipe/${id}`)
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Recipe not found')
        return null
      }
      const errorText = await response.text()
      console.error('Error response:', errorText)
      throw new Error(`Failed to fetch recipe: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Raw API response:', JSON.stringify(data, null, 2))
    
    if (!data) {
      console.error('Empty response from API')
      throw new Error('Invalid response from API')
    }

    return data
  } catch (error) {
    console.error('Error fetching recipe:', error)
    throw error
  }
} 