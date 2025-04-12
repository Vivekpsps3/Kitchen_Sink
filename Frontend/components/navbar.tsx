"use client"

import type React from "react"

import Link from "next/link"
import { Search, User, Heart, ShoppingCart, Plus } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

interface NavbarProps {
  showSearch?: boolean
  showAddRecipe?: boolean
  showShoppingCart?: boolean
  centeredSearch?: boolean
}

export default function Navbar({
  showSearch = true,
  showAddRecipe = true,
  showShoppingCart = true,
  centeredSearch = false,
}: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isUploadPage = pathname === "/post-recipe"
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#fff8e7] z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-gaya-italic text-3xl">
            KitchenSink!
          </Link>

          {showSearch && centeredSearch && (
            <div className="hidden md:flex max-w-md w-full mx-4 justify-center">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full py-2 px-10 rounded-full border border-gray-300 shadow-sm font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              </form>
            </div>
          )}

          {/* Removed text links for Recipes, Search, Shopping List */}

          <div className="flex items-center space-x-4">
            
            <Link
              href="/search?filter=liked"
              className="text-gray-700 hover:text-[#32c94e] transition-colors"
              aria-label="Liked Recipes"
            >
              <Heart className="h-5 w-5" />
            </Link>
            {showShoppingCart && (
              <Link
                href="/shopping-list"
                className="text-gray-700 hover:text-[#32c94e] transition-colors"
                aria-label="Shopping List"
              >
                <ShoppingCart className="h-5 w-5" />
              </Link>
            )}
            {showAddRecipe && (
              <Link
                href="/post-recipe"
                className={`flex items-center justify-center gap-1 ${isUploadPage ? "bg-gray-700 text-[var(--background)]" : "text-gray-700 hover:bg-gray-700 hover:text-[var(--background)]"} transition-all duration-200 px-2 py-1 border-gray-700 border-[1.5px] sm:px-1 sm:py-1 sm:border-gray-700 sm:border-[1.5px] sm:rounded-md sm:gap-1`}
                aria-label="Add Recipe"
              >
                <Plus className="h-5 w-5"/>
                <span className="font-matina text-sm relative top-[0.75px] hidden sm:inline">Upload Recipe</span>
              </Link>
            )}
            {/* <button className="text-gray-700 hover:text-[#32c94e] transition-colors" aria-label="User Profile">
              <User className="h-5 w-5" />
            </button> */}
          </div>
        </div>
      </div>
    </nav>
  )
}
