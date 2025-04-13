"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface FeaturedMeal {
  id: string
  title: string
  image: string
  chef: string
  description: string
}

interface FeaturedCarouselProps {
  meals: FeaturedMeal[]
}

export default function FeaturedCarousel({ meals }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % meals.length)
  }, [meals.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + meals.length) % meals.length)
  }, [meals.length])

  // Auto-advance slides every 6 seconds
  useEffect(() => {
    const interval = setInterval(nextSlide, 6000)
    return () => clearInterval(interval)
  }, [nextSlide])

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-xl shadow-xl">
      {/* Slides */}
      {meals.map((meal, index) => (
        <div
          key={meal.id}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <div className="relative w-full h-full">
            <Image
              src={meal.image || "/placeholder.svg"}
              alt={meal.title}
              fill
              className="object-cover"
              priority={index === currentIndex}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="max-w-4xl mx-auto">
                <h2 className="font-gaya text-4xl mb-2">{meal.title}</h2>
                <p className="font-matina text-lg mb-4 opacity-90">By {meal.chef}</p>
                <p className="font-matina text-lg max-w-2xl line-clamp-2">{meal.description}</p>
                <Link href={`/r?id=${meal.id}`}>
                  <button className="mt-4 px-6 py-2 bg-[#32c94e] hover:bg-[#1aa033] text-white font-matina rounded-md transition-colors">
                    View Recipe
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 rounded-full p-2 backdrop-blur-sm transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-8 w-8 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 rounded-full p-2 backdrop-blur-sm transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-8 w-8 text-white" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {meals.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-white w-6" : "bg-white/50"}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
