'use client';

import { useEffect, useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar";

interface FeaturedRecipe {
  id: string;
  title: string;
  description: string;
  chef: string;
  image: string;
}

export default function FeaturedPage() {
  const [recipes, setRecipes] = useState<FeaturedRecipe[]>([]);

  useEffect(() => {
    // Fetch data or use mock data
    const mockFeaturedRecipes = [
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
          "https://images.unsplash.com/photo-1639667870243-ec729a155145?q=80&w=2487&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
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
      }
    ];

    setRecipes(mockFeaturedRecipes);
  }, []);

  return (
    <div className="min-h-screen bg-[#fff8e7]">
      <Navbar showSearch={true} centeredSearch={true} />
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-gaya text-4xl md:text-5xl mb-8 text-center">Featured Recipes</h1>
        <p className="font-matina text-lg text-gray-600 max-w-3xl mx-auto text-center mb-12">
          Explore our hand-picked selection of exceptional recipes crafted by talented chefs from around the world.
        </p>

        <div className="grid grid-cols-1 gap-12">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-2/5 relative h-[300px]">
                  <Image
                    src={recipe.image}
                    alt={recipe.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="md:w-3/5 p-8">
                  <h2 className="font-gaya text-3xl mb-2">{recipe.title}</h2>
                  <p className="font-matina text-gray-600 mb-4">By {recipe.chef}</p>
                  <p className="font-matina mb-6">{recipe.description}</p>
                  <Link href={`/r?id=${recipe.id}`}>
                    <button className="px-6 py-3 bg-[#32c94e] hover:bg-[#1aa033] text-white font-matina rounded-md transition-colors">
                      View Recipe
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 