"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Star, Clock, Users, BarChart, Heart } from "lucide-react";
import Navbar from "@/components/navbar";
import CommentSection from "@/components/comment-section";
import Cookies from "js-cookie";

// Simple custom toast component
const Toast = ({
  message,
  isVisible,
  onClose,
}: {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}) => {
  const [isExiting, setIsExiting] = useState(false);

  // Auto close after 2 seconds
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsExiting(true);

      // Wait for animation to complete before removing from DOM
      setTimeout(() => {
        setIsExiting(false);
        onClose();
      }, 300); // Match animation duration
    }, 1500);

    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  // Early return after hooks
  if (!isVisible && !isExiting) return null;

  const animationClass = isExiting
    ? "animate-fade-out-up"
    : "animate-fade-in-down";

  return (
    <div
      className={`fixed rounded-xl top-6 left-1/2 transform -translate-x-1/2 bg-[#1AA033] text-white px-6 py-3 shadow-lg z-50 ${animationClass}`}
    >
      {message}
    </div>
  );
};

interface Ingredient {
  name: string;
  amount?: string | number;
  unit?: string;
  notes?: string;
  id?: string | number;
}

interface Recipe {
  id: string | number;
  title: string;
  cuisine?: string;
  description?: string;
  tags?: string[];
  ingredients?: Ingredient[];
  ingredient_sections?: {
    section_name: string;
    ingredients: Ingredient[];
  }[];
  steps?: string[];
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  difficulty?: string;
  notes?: string;
  image_url?: string;
}

function formatUnit(unit: string, amount: string | number | undefined): string {
  // Don't show "units" at all
  if (unit.toLowerCase() === "units") {
    return "";
  }

  // Check if amount is 1 to remove plural 's'
  if (amount === 1 || amount === "1" || amount === "1.0") {
    // Remove trailing 's' for singular units
    if (unit.endsWith("s") && !unit.endsWith("ss")) {
      return unit.slice(0, -1);
    }
  }

  return unit;
}

export default function RecipePage() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [averageRating] = useState(4.5); // Placeholder rating since we don't have comments yet
  const [checkedIngredients, setCheckedIngredients] = useState<{
    [key: string]: boolean;
  }>({});
  const [isLiked, setIsLiked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Toggle ingredient checked state
  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Function to get liked recipes from cookies
  const getLikedRecipes = (): number[] => {
    try {
      const likedRecipesCookie = Cookies.get("likedRecipes");
      return likedRecipesCookie ? JSON.parse(likedRecipesCookie) : [];
    } catch (error) {
      console.error("Error parsing liked recipes cookie:", error);
      return [];
    }
  };

  // Function to save liked recipes to cookies
  const saveLikedRecipes = (recipes: number[]) => {
    Cookies.set("likedRecipes", JSON.stringify(recipes), { expires: 365 });
  };

  // Function to handle liking/unliking a recipe
  const toggleLike = () => {
    if (!id) return;

    const recipeId = parseInt(id);
    if (isNaN(recipeId)) return;

    const likedRecipes = getLikedRecipes();

    // Check if recipe is already liked
    const index = binarySearch(likedRecipes, recipeId);

    if (index >= 0) {
      // Recipe is liked, remove it
      likedRecipes.splice(index, 1);
      setIsLiked(false);
      setToastMessage("Recipe removed from favorites");
      setShowToast(true);
    } else {
      // Recipe is not liked, add it
      const insertPosition = -(index + 1);
      likedRecipes.splice(insertPosition, 0, recipeId);
      setIsLiked(true);
      setToastMessage("Recipe added to favorites");
      setShowToast(true);
    }

    saveLikedRecipes(likedRecipes);
  };

  // Binary search function for efficient lookup
  const binarySearch = (arr: number[], target: number): number => {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (arr[mid] === target) {
        return mid;
      }

      if (arr[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return -(left + 1); // Return insertion point for not found
  };

  useEffect(() => {
    // Mark component as mounted to avoid hydration mismatch
    setMounted(true);

    if (!id) {
      setIsLoading(false);
      return;
    }

    // Check if current recipe is liked
    const recipeId = parseInt(id);
    if (!isNaN(recipeId)) {
      const likedRecipes = getLikedRecipes();
      const index = binarySearch(likedRecipes, recipeId);
      setIsLiked(index >= 0);
    }

    const fetchRecipe = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching recipe ${id}`);
        console.log(`http://localhost:8000/recipe/${id}`);
        const res = await fetch(`http://localhost:8000/recipe/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(`Fetching recipe ${id}, status: ${res.status}`);

        if (!res.ok) {
          throw new Error(
            `Failed to fetch recipe: ${res.status} ${res.statusText}`
          );
        }

        const data = await res.json();
        console.log(`Recipe data received:`, data);

        // Handle both single object and array response formats
        if (Array.isArray(data) && data.length > 0) {
          setRecipe(data[0]);
        } else if (data && typeof data === "object") {
          setRecipe(data);
        } else {
          throw new Error("Invalid recipe data format received");
        }
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch recipe")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">No Recipe Selected</h1>
        <p>Please provide a recipe ID in the URL (e.g., /r?id=123)</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center w-full font-gaya text-4xl">Loading recipe...</p>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-gaya text-4xl font-bold mb-4">Recipe Not Found</h1>
        <p className="font-matina">The requested recipe could not be loaded.</p>
        {error && <p className="font-matina text-red-500">{error.message}</p>}
      </div>
    );
  }

  // Filter tags for dietary restrictions
  const dietaryRestrictions =
    recipe.tags?.filter((tag) =>
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
    ) || [];

  // Other tags
  const otherTags =
    recipe.tags?.filter(
      (tag) =>
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
    ) || [];

  // Format ingredients and instructions for rendering
  const ingredients = recipe.ingredients || [];
  const instructions =
    recipe.steps?.map((step, index) => ({
      id: index.toString(),
      content: step,
      step_number: index + 1,
    })) || [];

  return (
    <div className="min-h-screen bg-[#fff8e7]">
      <Navbar showSearch={true} centeredSearch={true} />
      {mounted && (
        <Toast
          message={toastMessage}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row">
        {/* Left side - Image */}
        <div className="md:w-1/2 relative h-[300px] md:h-[600px]">
          <Image
            src={recipe.image_url || "/placeholder.svg?height=600&width=1200"}
            alt={recipe.title || "Recipe Image"}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Right side - Recipe Info */}
        <div className="md:w-1/2 p-6 md:p-10 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-gaya text-3xl md:text-4xl font-bold">
              {recipe.title || "Untitled Recipe"}
            </h1>
            <button
              onClick={toggleLike}
              className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={isLiked ? "Unlike recipe" : "Like recipe"}
            >
              <Heart
                className={`h-6 w-6 ${
                  isLiked ? "fill-red-500 text-red-500" : "text-gray-400"
                }`}
              />
            </button>
          </div>

          <p className="font-matina text-lg mb-8">
            {recipe.description ||
              recipe.cuisine ||
              "No description available."}
          </p>

          {/* Dietary Restrictions */}
          {dietaryRestrictions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {dietaryRestrictions.map((restriction, index) => (
                <span
                  key={index}
                  className="bg-[#32c94e]/10 text-[#32c94e] px-4 py-2 rounded-full font-matina text-sm"
                >
                  {restriction}
                </span>
              ))}
            </div>
          )}

          {/* Recipe Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#fff8e7] p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                <span className="font-matina font-bold">Cook Time</span>
              </div>
              <p className="font-matina mt-1">
                {recipe.cook_time_minutes
                  ? `${recipe.cook_time_minutes} minutes`
                  : "30 minutes"}
              </p>
            </div>

            <div className="bg-[#fff8e7] p-4 rounded-lg">
              <div className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                <span className="font-matina font-bold">Difficulty</span>
              </div>
              <p className="font-matina mt-1">
                {recipe.difficulty || "Intermediate"}
              </p>
            </div>

            <div className="bg-[#fff8e7] p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                <span className="font-matina font-bold">Servings</span>
              </div>
              <p className="font-matina mt-1">
                {recipe.servings || 4} servings
              </p>
            </div>

            <div className="bg-[#fff8e7] p-4 rounded-lg">
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                <span className="font-matina font-bold">Rating</span>
              </div>
              <div className="flex mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          {otherTags.length > 0 && (
            <div className="flex flex-wrap mb-4">
              {otherTags
                .filter(
                  (tag) =>
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
                )
                .map((tag, index) => (
                  <span
                    key={index}
                    className="tag-pill font-matina bg-gray-200 text-gray-800 px-3 py-1 rounded-full mr-2 mb-2"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Ingredients */}
            <div className="md:col-span-1">
              <h2 className="font-gaya text-2xl mb-4">Ingredients</h2>
              <ul className="bg-white rounded-lg p-6 shadow-md">
                {ingredients.length > 0 ? (
                  ingredients.map((ingredient, index) => (
                    <li
                      key={index}
                      className="font-matina mb-3 cursor-pointer"
                      onClick={() => toggleIngredient(index)}
                    >
                      <div className="grid grid-cols-[auto_auto_1fr] gap-2 items-start">
                        <input
                          type="checkbox"
                          id={`ingredient-${index}`}
                          checked={checkedIngredients[index] || false}
                          onChange={() => toggleIngredient(index)}
                          className="mt-1 h-5 w-5 rounded accent-[#32c94e]"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          className={`font-bold whitespace-nowrap ${
                            checkedIngredients[index]
                              ? "line-through text-gray-400"
                              : ""
                          }`}
                        >
                          {ingredient.amount || ""}
                          {ingredient.unit
                            ? ` ${formatUnit(
                                ingredient.unit,
                                ingredient.amount
                              )}`
                            : ""}
                        </div>
                        <div
                          className={
                            checkedIngredients[index]
                              ? "line-through text-gray-400"
                              : ""
                          }
                        >
                          {ingredient.name}
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="font-matina text-gray-500">
                    No ingredients listed
                  </li>
                )}
              </ul>
            </div>

            {/* Instructions */}
            <div className="md:col-span-2">
              <h2 className="font-gaya text-2xl mb-4">Instructions</h2>
              <ol className="bg-white rounded-lg p-6 shadow-md space-y-8 list-none ml-0">
                {instructions.length > 0 ? (
                  instructions
                    .sort((a, b) => (a.step_number || 0) - (b.step_number || 0))
                    .map((instruction, index) => {
                      // Highlight ingredients in instructions
                      let highlightedInstruction =
                        instruction.content || `Step ${index + 1}`;

                      // Bold the first word of every sentence
                      highlightedInstruction = highlightedInstruction.replace(
                        /(^|\.\s+|\!\s+|\?\s+)(\w+)/g,
                        (match, p1, p2) => {
                          // Don't add line break for the first sentence
                          if (p1 === "") return `<strong>${p2}</strong>`;
                          // Add line break before other sentences with medium spacing
                          return `${p1}<br /><span class="py-1 block"></span><strong>${p2}</strong>`;
                        }
                      );

                      if (ingredients.length > 0) {
                        ingredients.forEach((ing) => {
                          if (ing.name) {
                            // Create a more flexible regex that can match parts of ingredient names
                            const ingName = ing.name.replace(/,.*$/, "").trim(); // Remove anything after a comma
                            const baseName = ingName
                              .split(" ")
                              .slice(0, 2)
                              .join(" "); // Use first two words for matching
                            const regex = new RegExp(`\\b${baseName}\\b`, "gi");

                            highlightedInstruction =
                              highlightedInstruction.replace(regex, (match) => {
                                const amountDisplay = ing.amount
                                  ? `${ing.amount}${
                                      ing.unit ? ` ${ing.unit}` : ""
                                    }`
                                  : "";
                                return `<span>${match}</span>${
                                  amountDisplay
                                    ? ` <span class="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full ml-1">${amountDisplay}</span>`
                                    : ""
                                }`;
                              });
                          }
                        });
                      }

                      return (
                        <li
                          key={instruction.id || index}
                          className="font-matina relative pl-8"
                        >
                          <span className="absolute left-0 top-0 font-gaya text-2xl font-bold">
                            {index + 1}.
                          </span>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: highlightedInstruction,
                            }}
                          />
                        </li>
                      );
                    })
                ) : (
                  <li className="font-matina text-gray-500">
                    No instructions provided
                  </li>
                )}
              </ol>
            </div>
          </div>

          {/* Notes */}
          {recipe.notes && (
            <div className="bg-white rounded-lg p-6 shadow-md mb-12">
              <h2 className="font-gaya text-2xl mb-4">Notes</h2>
              <p className="font-matina text-gray-800">{recipe.notes}</p>
            </div>
          )}

          {/* Comments Section */}
          <CommentSection recipeId={id} comments={[]} />
        </div>
      </div>
    </div>
  );
}
