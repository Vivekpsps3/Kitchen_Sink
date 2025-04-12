import { NextResponse } from "next/server"
import { seedDatabase } from "@/lib/supabase/seed"

export async function GET() {
  try {
    const result = await seedDatabase()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in seed route:", error)
    return NextResponse.json({ success: false, message: `Error seeding database: ${error.message}` }, { status: 500 })
  }
}
