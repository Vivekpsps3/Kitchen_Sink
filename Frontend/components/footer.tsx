import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-gaya-italic text-xl mb-4">KitchenSink!</h3>
            <p className="font-matina text-gray-600 mb-4">
              Your ultimate culinary companion for discovering, creating, and sharing exceptional recipes.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#32c94e]">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#32c94e]">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#32c94e]">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#32c94e]">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-gaya text-lg mb-4">Explore</h4>
            <ul className="space-y-2 font-matina">
              <li>
                <Link href="/recipes" className="text-gray-600 hover:text-[#32c94e]">
                  Recipes
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-600 hover:text-[#32c94e]">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/chefs" className="text-gray-600 hover:text-[#32c94e]">
                  Featured Chefs
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-gray-600 hover:text-[#32c94e]">
                  Collections
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-gaya text-lg mb-4">Community</h4>
            <ul className="space-y-2 font-matina">
              <li>
                <Link href="/upload" className="text-gray-600 hover:text-[#32c94e]">
                  Submit a Recipe
                </Link>
              </li>
              <li>
                <Link href="/forums" className="text-gray-600 hover:text-[#32c94e]">
                  Forums
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-gray-600 hover:text-[#32c94e]">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/newsletter" className="text-gray-600 hover:text-[#32c94e]">
                  Newsletter
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-gaya text-lg mb-4">About</h4>
            <ul className="space-y-2 font-matina">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-[#32c94e]">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-[#32c94e]">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-600 hover:text-[#32c94e]">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/press" className="text-gray-600 hover:text-[#32c94e]">
                  Press
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="font-matina text-sm text-gray-500 mb-4 md:mb-0">
            © {new Date().getFullYear()} <span className="font-gaya-italic">KitchenSink!</span> All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="font-matina text-sm text-gray-500 hover:text-[#32c94e]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-matina text-sm text-gray-500 hover:text-[#32c94e]">
              Terms of Service
            </Link>
            <Link href="/cookies" className="font-matina text-sm text-gray-500 hover:text-[#32c94e]">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
