"use client"

import { useState } from "react"
import { Star } from "lucide-react"

interface Comment {
  id: string
  user_name?: string
  rating?: number
  content: string
  created_at: string
}

interface CommentSectionProps {
  recipeId: string
  comments?: Comment[]
}

export default function CommentSection({ recipeId, comments = [] }: CommentSectionProps) {
  // Initialize with sample comments or the ones passed in
  const sampleComments: Comment[] = [
    {
      id: '1',
      user_name: 'Sarah Johnson',
      rating: 5,
      content: 'This recipe was amazing! My family loved it and asked for seconds. The flavors blended perfectly.',
      created_at: '2025-03-15T09:24:00Z'
    },
    {
      id: '2',
      user_name: 'Michael Chen',
      rating: 4,
      content: 'Great recipe! I added a bit more garlic and it was perfect. Will definitely make again.',
      created_at: '2025-03-10T14:32:00Z'
    },
    {
      id: '3',
      user_name: 'Emma Rodriguez',
      rating: 5,
      content: "I've made this three times now and it's been a hit every time. The instructions are clear and easy to follow.",
      created_at: '2025-03-05T11:17:00Z'
    }
  ]
  
  const [userRating, setUserRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentList, setCommentList] = useState<Comment[]>(comments.length > 0 ? comments : sampleComments)

  const handleRatingChange = (rating: number) => {
    setUserRating(rating)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!comment.trim()) return
    
    setIsSubmitting(true)
    
    try {
      // This would be a real API call in production
      // const response = await fetch(`/api/recipes/${recipeId}/comments`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     rating: userRating,
      //     content: comment,
      //   }),
      // });
      
      // const data = await response.json();
      
      // For now, just simulate adding a comment
      const newComment: Comment = {
        id: Date.now().toString(),
        user_name: "You",
        rating: userRating,
        content: comment,
        created_at: new Date().toISOString(),
      }
      
      setCommentList([newComment, ...commentList])
      setComment("")
      setUserRating(0)
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mb-12">
      <h2 className="font-gaya text-2xl mb-6">Comments</h2>
      
      {/* Add a comment */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h3 className="font-matina font-bold text-xl mb-4">Leave a comment</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-matina mb-2">Your Rating</label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => handleRatingChange(rating)}
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    className={`h-6 w-6 ${
                      rating <= (hoveredRating || userRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="comment" className="block font-matina mb-2">
              Your Comment
            </label>
            <textarea
              id="comment"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 font-matina focus:outline-none focus:ring-2 focus:ring-[#32c94e]"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this recipe..."
            ></textarea>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#32c94e] hover:bg-[#1aa033] text-white font-matina rounded-md transition-colors disabled:bg-gray-400"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>
      
      {/* Comment list */}
      {commentList.length > 0 ? (
        <div className="space-y-6">
          {commentList.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-matina font-bold">{comment.user_name || 'Anonymous'}</h4>
                {comment.rating && (
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= comment.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="font-matina mb-1">{comment.content}</p>
              <p className="font-matina text-sm text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 shadow-md text-center">
          <p className="font-matina text-gray-500">No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
}
