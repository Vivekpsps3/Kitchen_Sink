"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  ShoppingCart,
  Check,
  X,
  Search,
  Clock,
  BarChart,
  MessageSquare,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/navbar";
import { createClient } from "@/lib/supabase/client";
import { parseCookies } from "nookies";
import Loader from "@/components/Loader";

interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  ingredients: Array<
    | {
        name: string;
        unit: string;
        amount: string;
        notes?: string;
      }
    | string
  >;
  tags?: string[];
  rating?: number;
  commentCount?: number;
  difficulty?: string;
}

interface ShoppingItem {
  id: string;
  name: string;
  amount?: string;
  unit?: string;
  checked: boolean;
  recipeId: string;
}

interface PriceComparison {
  store: string;
  price: number;
  items: Array<{
    name: string;
    brand: string;
    price: number;
    quantity: string;
    checked?: boolean;
  }>;
}

interface FailedItem {
  name: string;
  checked: boolean;
}

export default function ShoppingListPage() {
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [loading, setLoading] = useState(true);
  const [cheapestStore, setCheapestStore] = useState<string | null>(null);
  const [storePrice, setStorePrice] = useState<number | null>(null);
  const [priceComparisons, setPriceComparisons] = useState<PriceComparison[]>(
    []
  );
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [failedItems, setFailedItems] = useState<FailedItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchLikedRecipes();
  }, []);

  const fetchLikedRecipes = async () => {
    setLoading(true);

    try {
      // Get liked recipes from cookies
      const cookies = parseCookies();

      // Parse the cookie to get liked recipe IDs
      let likedRecipeIds: string[] = [];

      if (cookies.likedRecipes) {
        try {
          // Try standard JSON parsing first
          likedRecipeIds = JSON.parse(cookies.likedRecipes);
        } catch (e) {
          // If standard parsing fails, handle URL-encoded format
          const decodedCookie = decodeURIComponent(cookies.likedRecipes);

          // Remove brackets and split by comma
          if (decodedCookie.startsWith("[") && decodedCookie.endsWith("]")) {
            const content = decodedCookie.substring(
              1,
              decodedCookie.length - 1
            );
            likedRecipeIds = content.split(",");
          }
        }
      }

      if (likedRecipeIds.length === 0) {
        // If no liked recipes in cookies, fall back to fetching from Supabase for demo
        const { data, error } = await supabase
          .from("recipes")
          .select(
            `
            id,
            title,
            description,
            image_url,
            ingredients (name, amount, unit, notes)
          `
          )
          .limit(5);

        if (error) {
          throw error;
        }

        const transformedRecipes = data.map((recipe: any) => ({
          id: recipe.id,
          title: recipe.title,
          description: recipe.description || "A delicious recipe",
          image: recipe.image_url || "/placeholder.svg?height=100&width=100",
          ingredients: recipe.ingredients.map((ing: any) =>
            typeof ing === "string"
              ? ing
              : {
                  name: ing.name || "",
                  amount: ing.amount || "",
                  unit: ing.unit || "units",
                  notes: ing.notes,
                }
          ),
          difficulty: "Intermediate",
          rating: 4.5,
          commentCount: Math.floor(Math.random() * 20),
          tags: ["Dinner", "Healthy"],
        }));

        setLikedRecipes(transformedRecipes);
      } else {
        // Fetch each liked recipe by ID
        const likedRecipesPromises = likedRecipeIds.map(async (id: string) => {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/recipe/${id}`,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) {
              return null;
            }

            const responseData = await response.json();
            // API returns an array of recipes, we need to get the first item
            const recipeData = Array.isArray(responseData)
              ? responseData[0]
              : responseData;

            if (!recipeData) {
              return null;
            }

            // Transform the recipe data to match our Recipe interface
            return {
              id: recipeData.id || id,
              title: recipeData.title || "Untitled Recipe",
              description: recipeData.description || "No description available",
              image:
                recipeData.image_url || "/placeholder.svg?height=100&width=100",
              ingredients: recipeData.ingredients.map((ing: any) =>
                typeof ing === "string"
                  ? ing
                  : {
                      name: ing.name || "",
                      amount: ing.amount || "",
                      unit: ing.unit || "units",
                      notes: ing.notes,
                    }
              ),
              tags: Array.isArray(recipeData.tags) ? recipeData.tags : [],
              rating: recipeData.likes || 0,
              commentCount: recipeData.comments?.length || 0,
              difficulty: recipeData.difficulty || "Intermediate",
            };
          } catch (error) {
            console.error(`Error fetching recipe ${id}:`, error);
            return null;
          }
        });

        const likedRecipesResults = await Promise.all(likedRecipesPromises);
        const validRecipes = likedRecipesResults.filter(
          (recipe) => recipe !== null
        ) as Recipe[];

        setLikedRecipes(validRecipes);
      }
    } catch (error) {
      console.error("Error fetching liked recipes:", error);
      setLikedRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const addRecipeToShoppingList = (recipe: Recipe) => {
    const newItems = recipe.ingredients.map((ingredient, index) => {
      // Handle both string and object formats for ingredients
      let amount = "";
      let unit = "";
      let name = "";

      if (typeof ingredient === "string") {
        // Parse ingredient string (legacy format)
        name = ingredient;
        const matches = ingredient.match(
          /^(\d+(\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/
        );
        if (matches) {
          amount = matches[1] || "";
          unit = matches[3] || "units";
          name = matches[4] || ingredient;
        }
      } else {
        // Use structured ingredient object
        name = ingredient.name;
        amount = ingredient.amount || "";
        unit = ingredient.unit || "units";
      }

      return {
        id: `${recipe.id}-${index}`,
        name,
        amount,
        unit,
        checked: false,
        recipeId: recipe.id,
      };
    });

    setShoppingList((prev) => {
      // Filter out any items that are already in the list from this recipe
      const filteredList = prev.filter((item) => item.recipeId !== recipe.id);

      // Combine filtered list with new items and sort by similarity
      const combinedList = [...filteredList, ...newItems];
      return organizeIngredientsBySimilarity(combinedList);
    });
  };

  // Function to clean ingredient text for comparison
  const cleanIngredientText = (text: string): string[] => {
    // Remove numbers, common units and punctuation
    const cleanText = text
      .replace(/\d+(\.\d+)?/g, "")
      .replace(
        /(cup|cups|tbsp|tsp|teaspoon|teaspoons|tablespoon|tablespoons|oz|ounce|ounces|lb|pound|pounds|g|gram|grams|kg|kilogram|kilograms|ml|milliliter|milliliters|l|liter|liters|pinch|dash|to taste)/gi,
        ""
      )
      .replace(/[^\w\s]/gi, "")
      .toLowerCase()
      .trim();

    // Split into words and filter out short words and empty strings
    return cleanText.split(/\s+/).filter((word) => word.length > 2);
  };

  // Calculate similarity score between two ingredients
  const calculateSimilarity = (
    item1: ShoppingItem,
    item2: ShoppingItem
  ): number => {
    const words1 = cleanIngredientText(item1.name);
    const words2 = cleanIngredientText(item2.name);

    // Count matching words
    const matches = words1.filter((word) => words2.includes(word));

    // Return number of matching words as similarity score
    return matches.length;
  };

  // Organize shopping list to group similar ingredients together
  const organizeIngredientsBySimilarity = (
    items: ShoppingItem[]
  ): ShoppingItem[] => {
    if (items.length <= 1) return items;

    const result: ShoppingItem[] = [];
    const processed = new Set<string>();

    // Process each item
    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i];

      // Skip if already processed
      if (processed.has(currentItem.id)) continue;

      // Mark current item as processed
      processed.add(currentItem.id);
      result.push(currentItem);

      // Find similar items
      const similarItems = items
        .filter((item) => !processed.has(item.id))
        .map((item) => ({
          item,
          similarity: calculateSimilarity(currentItem, item),
        }))
        .filter(({ similarity }) => similarity > 0)
        .sort((a, b) => b.similarity - a.similarity);

      // Add similar items to result
      for (const { item } of similarItems) {
        processed.add(item.id);
        result.push(item);
      }
    }

    return result;
  };

  const removeRecipeFromShoppingList = (recipeId: string) => {
    setShoppingList((prev) => {
      const filteredList = prev.filter((item) => item.recipeId !== recipeId);
      return organizeIngredientsBySimilarity(filteredList);
    });
  };

  const toggleItemChecked = (itemId: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // Add function to toggle store item checked state
  const toggleStoreItemChecked = (storeIndex: number, itemIndex: number) => {
    setPriceComparisons((prev) => {
      const newComparisons = [...prev];
      const items = [...newComparisons[storeIndex].items];
      items[itemIndex] = {
        ...items[itemIndex],
        checked: !items[itemIndex].checked
      };
      newComparisons[storeIndex] = {
        ...newComparisons[storeIndex],
        items
      };
      return newComparisons;
    });
  };

  const addCustomItem = () => {
    if (!newItem.trim()) return;

    // Parse custom item for amount, unit, and name
    let amount = "";
    let unit = "";
    let name = newItem.trim();

    // Extract amount and unit from custom item string
    const matches = newItem
      .trim()
      .match(/^(\d+(\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/);
    if (matches) {
      amount = matches[1] || "";
      unit = matches[3] || "units";
      name = matches[4] || newItem.trim();
    }

    setShoppingList((prev) => {
      const newShoppingItem = {
        id: `custom-${Date.now()}`,
        name,
        amount,
        unit,
        checked: false,
        recipeId: "custom",
      };

      const updatedList = [...prev, newShoppingItem];
      return organizeIngredientsBySimilarity(updatedList);
    });

    setNewItem("");
  };

  const removeItem = (itemId: string) => {
    setShoppingList((prev) => {
      const filteredList = prev.filter((item) => item.id !== itemId);
      return organizeIngredientsBySimilarity(filteredList);
    });
  };

  const findCheapestStore = async () => {
    if (shoppingList.length === 0) return;

    setFetchingPrices(true);
    setFailedItems([]); // Reset failed items

    try {
      // Step 1: Transform shopping list for the API call
      const ingredients = shoppingList.map((item) => ({
        name: item.name,
        amount: parseFloat(item.amount || "1") || 1,
        unit: item.unit || "units",
      }));

      // Step 2: Make GET request to /shoppingList
      console.log(ingredients);
      console.log(
        `${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/shoppingList`
      );
      const shoppingListResponse = await fetch(
        `${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/shoppingList`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ingredients,
          }),
        }
      );

      if (!shoppingListResponse.ok) {
        throw new Error("Failed to fetch shopping list");
      }

      const shoppingListData = await shoppingListResponse.json();

      // Step 3: For each item in the response, query /ingredients
      const storeComparisons: Record<string, PriceComparison> = {};
      const failedItemsList: string[] = [];

      for (const item of shoppingListData.shopping_list) {
        // Convert quantity to amount for the /ingredients endpoint
        const ingredientRequest = {
          ingredient: item.ingredient,
          amount: parseFloat(item.quantity.split(" ")[0]),
          unit: "ounces",
        };

        console.log(ingredientRequest);

        try {
          const ingredientResponse = await fetch(
            `${process.env.NEXT_PUBLIC_KITCHEN_SINK_REST_URL}/ingredients`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(ingredientRequest),
            }
          );

          console.log(ingredientResponse);

          if (!ingredientResponse.ok) {
            console.error(`Failed to fetch prices for ${item.ingredient}`);
            failedItemsList.push(item.ingredient);
            continue;
          }

          const priceData = await ingredientResponse.json();

          // Process each store's price data
          Object.entries(priceData).forEach(
            ([store, storeData]: [string, any]) => {
              if (!storeComparisons[store]) {
                storeComparisons[store] = {
                  store,
                  price: 0,
                  items: [],
                };
              }

              storeComparisons[store].price += storeData.price;
              storeComparisons[store].items.push({
                name: storeData.itemName,
                brand: storeData.brand,
                price: storeData.price,
                quantity: `${storeData.unitAmountOz} oz`,
                checked: false,
              });
            }
          );
        } catch (error) {
          console.error(`Error fetching ${item.ingredient}:`, error);
          failedItemsList.push(item.ingredient);
        }
      }

      // Update failed items state
      setFailedItems(failedItemsList.map(item => ({ name: item, checked: false })));

      // Convert store comparisons to array and sort by price
      const comparisons = Object.values(storeComparisons).sort(
        (a, b) => a.price - b.price
      );
      setPriceComparisons(comparisons);

      // Set cheapest store and price
      if (comparisons.length > 0) {
        setCheapestStore(comparisons[0].store);
        setStorePrice(comparisons[0].price);
      }
    } catch (error) {
      console.error("Error finding cheapest store:", error);
    } finally {
      setFetchingPrices(false);
    }
  };

  const isRecipeInShoppingList = (recipeId: string) => {
    return shoppingList.some((item) => item.recipeId === recipeId);
  };

  // Add a function to remove a store from comparisons
  const removeStore = (storeIndex: number) => {
    setPriceComparisons((prev) => {
      const newComparisons = [...prev];
      newComparisons.splice(storeIndex, 1);
      
      // Update cheapest store if needed
      if (newComparisons.length > 0) {
        const cheapestStore = newComparisons.reduce((min, current) => 
          current.price < min.price ? current : min, newComparisons[0]);
        setCheapestStore(cheapestStore.store);
        setStorePrice(cheapestStore.price);
      } else {
        setCheapestStore(null);
        setStorePrice(null);
      }
      
      return newComparisons;
    });
  };

  // Add a function to remove a store item
  const removeStoreItem = (storeIndex: number, itemIndex: number) => {
    setPriceComparisons((prev) => {
      const newComparisons = [...prev];
      const store = { ...newComparisons[storeIndex] };
      
      // Remove the item and calculate new price
      const removedItem = store.items[itemIndex];
      store.price -= removedItem.price;
      store.items = store.items.filter((_, idx) => idx !== itemIndex);
      
      newComparisons[storeIndex] = store;
      
      // Update cheapest store if needed
      if (newComparisons.length > 0) {
        const cheapestStore = newComparisons.reduce((min, current) => 
          current.price < min.price ? current : min, newComparisons[0]);
        setCheapestStore(cheapestStore.store);
        setStorePrice(cheapestStore.price);
      }
      
      return newComparisons;
    });
  };

  // Add toggle function for failed items
  const toggleFailedItemChecked = (index: number) => {
    setFailedItems(prev => 
      prev.map((item, idx) => 
        idx === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <>
      <Navbar
        showShoppingCart={false}
        showSearch={true}
        centeredSearch={true}
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-gaya text-3xl md:text-4xl text-center mb-8">
          Add Recipes to Shopping List
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Liked Recipes */}
          <div className="lg:w-1/2 relative">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20 z-10 max-h-[calc(100vh-10rem)] overflow-y-auto" id="liked-recipes">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-gaya text-2xl">Liked Recipes</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    className="pl-8 pr-4 py-2 rounded-full border border-gray-300 font-matina text-sm focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                  />
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </div>

              {loading ? (
                <p className="text-center w-full font-matina text-xl text-gray-500">Loading recipes...</p>
              ) : likedRecipes.length > 0 ? (
                <div className="space-y-4">
                  {likedRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
                    >
                      {/* External Link Icon */}
                      <a
                        href={`/r?id=${recipe.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/70 text-gray-700 hover:bg-white z-10"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>

                      {/* Image with fixed aspect ratio */}
                      <div className="relative w-1/3 h-28">
                        <Image
                          src={recipe.image || "/placeholder.svg"}
                          alt={recipe.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="w-2/3 p-3 flex flex-col justify-between">
                        <div>
                          <h3 className="font-matina font-bold text-sm line-clamp-1">
                            {recipe.title}
                          </h3>
                          <p className="font-matina text-xs text-gray-600 line-clamp-1 mb-1">
                            {recipe.description}
                          </p>

                          {/* Metadata */}
                          <div className="flex items-center gap-2 mt-1">
                            {recipe.difficulty && (
                              <div className="flex items-center text-xs text-gray-500">
                                <BarChart className="h-3 w-3 mr-1" />
                                <span>{recipe.difficulty}</span>
                              </div>
                            )}

                            {recipe.commentCount !== undefined && (
                              <div className="flex items-center text-xs text-gray-500">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                <span>{recipe.commentCount}</span>
                              </div>
                            )}

                            {recipe.rating !== undefined && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>{recipe.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          {/* Tags */}
                          <div className="flex gap-1">
                            {recipe.tags &&
                              recipe.tags.slice(0, 1).map((tag, index) => (
                                <span
                                  key={index}
                                  className="bg-[#32c94e]/10 text-[#32c94e] text-[10px] px-1.5 py-0.5 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>

                          {/* Add/Remove button - updated with arrow icon and more pronounced styling */}
                          <button
                            onClick={() =>
                              isRecipeInShoppingList(recipe.id)
                                ? removeRecipeFromShoppingList(recipe.id)
                                : addRecipeToShoppingList(recipe)
                            }
                            className={`p-1.5 rounded-full ${
                              isRecipeInShoppingList(recipe.id)
                                ? "bg-[#e80b07] text-white hover:bg-[#c70906]"
                                : "bg-[#32c94e] text-white hover:bg-[#28a53f]"
                            }`}
                          >
                            {isRecipeInShoppingList(recipe.id) ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <ArrowRight className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="font-matina">
                    You haven't liked any recipes yet.
                  </p>
                  <a
                    href="/search"
                    className="font-matina text-[#3cbbf1] hover:underline mt-2 inline-block"
                  >
                    Discover recipes to like
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Shopping List */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-gaya text-2xl">Shopping List</h2>
                <ShoppingCart className="h-6 w-6 text-[#32c94e]" />
              </div>

              {shoppingList.length > 0 ? (
                <ul className="space-y-1 mb-6 list-none">
                  {shoppingList.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between py-1.5"
                    >
                      <div className="flex items-center">
                        <span
                          className={item.checked ? "line-through text-gray-400" : ""}
                        >
                          {item.amount && `${item.amount} `}
                          {item.unit &&
                            item.unit !== "units" &&
                            `${item.unit} `}
                          {item.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-[#e80b07]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 mb-6">
                  <p className="font-matina">Your shopping list is empty.</p>
                  <p className="font-matina text-gray-500 mt-2">
                    Add items from your liked recipes or add custom items below.
                  </p>
                </div>
              )}

              {/* Add Custom Item */}
              <div className="flex mb-6">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add custom item..."
                  className="flex-grow px-4 py-2 border rounded-l-md font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                  onKeyDown={(e) => e.key === "Enter" && addCustomItem()}
                />
                <button
                  onClick={addCustomItem}
                  className="bg-[#32c94e] text-white px-4 py-2 rounded-r-md hover:bg-[#1aa033]"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {/* Find Cheapest Store */}
              <div className="text-center">
                <button
                  onClick={findCheapestStore}
                  className="btn-primary font-matina py-3 px-6 !rounded-none flex items-center justify-center"
                  disabled={shoppingList.length === 0 || fetchingPrices}
                >
                  {fetchingPrices ? (
                    <Loader />
                  ) : (
                    "Find Cheapest Store"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Price Comparison Section - Updated with row checkboxes */}
        {cheapestStore && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md w-full">
            <div className="text-center mb-6">
              <p className="font-matina text-lg">
                The cheapest store for your shopping list is likely
              </p>
              <p className="font-gaya text-3xl mt-2">{cheapestStore}</p>
              {storePrice && (
                <p className="font-gaya text-4xl mt-1 text-[#32c94e]">
                  ${storePrice.toFixed(2)}+
                </p>
              )}
            </div>

            {priceComparisons.length > 0 && (
              <div className="mt-4">
                <h3 className="font-gaya text-2xl mb-4 text-center">
                  Comparison of Priced Items
                </h3>
                <div className="flex flex-col md:flex-row md:gap-6">
                  {priceComparisons.map((comparison, index) => (
                    <div
                      key={comparison.store}
                      className="mb-3 flex-1 flex flex-col"
                    >
                      {/* Store header with title and total in its own row */}
                      <div 
                        className={`flex justify-between items-center p-4 mb-2 rounded-md md:rounded-lg shadow-sm ${
                          comparison.store.toLowerCase().includes('kroger') 
                            ? "bg-green-200" 
                            : comparison.store.toLowerCase().includes('walmart')
                              ? "bg-blue-200"
                              : "bg-gray-200"
                        }`}
                      >
                        <div className="flex gap-2">
                          <p className="font-matina font-bold text-2xl">
                            {comparison.store} <span className="font-normal font-serif text-lg text-gray-600">({comparison.items.length} items)</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {index === 0 && (
                            <span className="flex items-center text-sm text-black font-gaya bg-[#ffdf00] px-2.5 pt-1.5 pb-1 rounded-full text-center shadow-md border border-gray-300">
                              Best Price
                            </span>
                          )}
                          <p className="font-gaya font-bold text-3xl">
                            ${comparison.price.toFixed(2)}
                          </p>
                          <button 
                            onClick={() => removeStore(index)}
                            className="text-[#e80b07] hover:text-[#c70906] p-1 rounded-full hover:bg-red-50 transition-colors"
                            aria-label="Remove store"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Items list in a separate card */}
                      <div className={`p-4 rounded-md md:rounded-lg ${
                        comparison.store.toLowerCase().includes('kroger') 
                          ? "bg-green-50" 
                          : comparison.store.toLowerCase().includes('walmart')
                            ? "bg-blue-50"
                            : "bg-gray-50"
                      }`}>
                        <ul className="space-y-0.5">
                          {comparison.items.map((item, itemIndex) => (
                            <li
                              key={itemIndex}
                              className="flex justify-between items-center p-1.5 rounded hover:bg-white/50 transition-colors"
                            >
                              <div className="flex items-center flex-1 cursor-pointer" 
                                onClick={() => toggleStoreItemChecked(index, itemIndex)}>
                                <div className={`h-4 w-4 rounded border flex items-center justify-center mr-2 ${
                                  item.checked
                                    ? "bg-[#32c94e] border-[#32c94e] text-white"
                                    : "border-gray-300"
                                }`}>
                                  {item.checked && <Check className="h-2.5 w-2.5" />}
                                </div>
                                <p className={`text-sm ${item.checked ? "line-through text-gray-400" : ""}`}>
                                  {item.brand} {item.name} ({item.quantity})
                                </p>
                              </div>
                              <div className="flex items-center">
                                <p className={`font-gaya text-base mr-2 ${item.checked ? "line-through text-gray-400" : ""}`}>
                                  ${item.price.toFixed(2)}
                                </p>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeStoreItem(index, itemIndex);
                                  }}
                                  className="text-[#e80b07] hover:text-[#c70906] p-1 rounded-full hover:bg-red-50 transition-colors"
                                  aria-label="Remove item"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Not in Database Section */}
        {failedItems.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-md w-full">
            <div className="text-center mb-6">
              <h3 className="font-gaya text-2xl mb-4">
                Not Found in Database
              </h3>
              <p className="font-matina text-gray-600">
                These items couldn't be found in our price database.
              </p>
            </div>

            <div className="mt-4">
              <div className="rounded-md md:rounded-lg bg-gray-200 p-4 mb-2 shadow-sm">
                <div className="flex gap-2">
                  <p className="font-matina font-bold text-2xl text-gray-800">
                    Missing Items <span className="text-gray-600 font-normal font-serif text-lg">({failedItems.length} items)</span>
                  </p>
                </div>
              </div>
              
              <div className="p-4 rounded-md md:rounded-lg bg-gray-50">
                <ul className="space-y-0.5">
                  {failedItems.map((item, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center p-1.5 rounded hover:bg-white/70 transition-colors"
                    >
                      <div className="flex items-center flex-1 cursor-pointer" 
                        onClick={() => toggleFailedItemChecked(index)}>
                        <div className={`h-4 w-4 rounded border flex items-center justify-center mr-2 ${
                          item.checked
                            ? "bg-[#32c94e] border-[#32c94e] text-white"
                            : "border-gray-300"
                        }`}>
                          {item.checked && <Check className="h-2.5 w-2.5" />}
                        </div>
                        <p className={`text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}>
                          {item.name}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setFailedItems(prev => prev.filter((_, idx) => idx !== index));
                        }}
                        className="text-[#e80b07] hover:text-[#c70906] p-1 rounded-full hover:bg-red-50 transition-colors"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
