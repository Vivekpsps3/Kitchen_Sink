"use client"

import type React from "react"
import { useState } from "react"
import { Star, ThumbsUp, ThumbsDown, Reply } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Comment {
  id: string
  content: string
  rating?: number
  created_at: string
  users: {
    username: string
    avatar_url: string | null
  }
  replies?: Comment[]
  comment_votes: {
    vote_type: "upvote" | "downvote"
    user_id: string
  }[]
}

interface CommentSectionProps {
  recipeId: string
  comments: Comment[]
}

export default function CommentSection({ recipeId, comments = [] }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [rating, setRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real app, we would get the user ID from auth
      // For now, we'll use a placeholder user ID
      const userId = "placeholder-user-id"

      const { error } = await supabase.from("comments").insert({
        recipe_id: recipeId,
        user_id: userId,
        content: newComment,
        rating: rating,
      })

      if (error) {
        console.error("Error submitting comment:", error)
        alert("Failed to submit comment. Please try again.")
      } else {
        setNewComment("")
        setRating(5)
        // Refresh the page to show the new comment
        router.refresh()
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (commentId: string, voteType: "upvote" | "downvote") => {
    try {
      // In a real app, we would get the user ID from auth
      const userId = "placeholder-user-id"

      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from("comment_votes")
        .select("*")
        .eq("comment_id", commentId)
        .eq("user_id", userId)
        .single()

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote if clicking the same button
          await supabase.from("comment_votes").delete().eq("comment_id", commentId).eq("user_id", userId)
        } else {
          // Update vote if changing vote type
          await supabase
            .from("comment_votes")
            .update({ vote_type: voteType })
            .eq("comment_id", commentId)
            .eq("user_id", userId)
        }
      } else {
        // Add new vote
        await supabase.from("comment_votes").insert({
          comment_id: commentId,
          user_id: userId,
          vote_type: voteType,
        })
      }

      // Refresh the page to update vote counts
      router.refresh()
    } catch (error) {
      console.error("Error voting:", error)
    }
  }

  // Calculate upvotes and downvotes for a comment
  const getVoteCounts = (votes: any[] = []) => {
    const upvotes = votes.filter((vote) => vote.vote_type === "upvote").length
    const downvotes = votes.filter((vote) => vote.vote_type === "downvote").length
    return { upvotes, downvotes }
  }

  return (
    <div>
      <h2 className="font-gaya text-2xl mb-6">Comments</h2>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmitComment} className="bg-white rounded-lg p-6 shadow-md mb-8">
        <div className="mb-4">
          <label className="block font-matina mb-2">Your Rating</label>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                <Star className={`h-6 w-6 ${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
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
            rows={4}
            className="w-full px-3 py-2 border rounded-md font-matina focus:outline-none focus:ring-2 focus:ring-primary"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
          ></textarea>
        </div>

        <button type="submit" className="btn-primary font-matina" disabled={isSubmitting}>
          {isSubmitting ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="font-matina text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => {
            const { upvotes, downvotes } = getVoteCounts(comment.comment_votes)

            return (
              <div key={comment.id} className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex justify-between mb-2">
                  <span className="font-matina font-bold">{comment.users?.username || "Anonymous"}</span>
                  <span className="font-matina text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>

                {comment.rating && (
                  <div className="flex mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= comment.rating! ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                )}

                <p className="font-matina mb-4">{comment.content}</p>

                <div className="flex items-center space-x-4">
                  <button
                    className="flex items-center text-gray-500 hover:text-primary"
                    onClick={() => handleVote(comment.id, "upvote")}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span className="font-matina text-sm">{upvotes}</span>
                  </button>
                  <button
                    className="flex items-center text-gray-500 hover:text-error"
                    onClick={() => handleVote(comment.id, "downvote")}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    <span className="font-matina text-sm">{downvotes}</span>
                  </button>
                  <button className="flex items-center text-gray-500 hover:text-link">
                    <Reply className="h-4 w-4 mr-1" />
                    <span className="font-matina text-sm">Reply</span>
                  </button>
                </div>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-6 space-y-4">
                    {comment.replies.map((reply) => {
                      const replyVotes = getVoteCounts(reply.comment_votes)

                      return (
                        <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between mb-2">
                            <span className="font-matina font-bold">{reply.users?.username || "Anonymous"}</span>
                            <span className="font-matina text-sm text-gray-500">
                              {new Date(reply.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-matina mb-3">{reply.content}</p>
                          <div className="flex items-center space-x-4">
                            <button
                              className="flex items-center text-gray-500 hover:text-primary"
                              onClick={() => handleVote(reply.id, "upvote")}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              <span className="font-matina text-sm">{replyVotes.upvotes}</span>
                            </button>
                            <button
                              className="flex items-center text-gray-500 hover:text-error"
                              onClick={() => handleVote(reply.id, "downvote")}
                            >
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              <span className="font-matina text-sm">{replyVotes.downvotes}</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
