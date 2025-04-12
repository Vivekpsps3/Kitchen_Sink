import Link from "next/link"
import Navbar from "@/components/navbar"

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-gaya text-4xl md:text-5xl mb-4">Recipe Not Found</h1>
        <p className="font-matina text-lg mb-8">
          We couldn't find the recipe you're looking for. It might have been removed or never existed.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/" className="btn-primary">
            Return Home
          </Link>
          <Link href="/search" className="px-6 py-2 border border-gray-300 rounded-md font-matina hover:bg-gray-100">
            Search Recipes
          </Link>
        </div>
      </div>
    </>
  )
}
