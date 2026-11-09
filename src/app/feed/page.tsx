
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Comment = {
  id: number;
  post_id: number;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

type Post = {
  id: number;
  user_id: string;
  author_name: string;
  content: string;
  category: string;
  created_at: string;
  like_count: number;
  is_liked: boolean;
};

const categories = [
  "General",
  "Achievement",
  "Question",
  "Technology",
  "Career",
  "Culture",
];

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>(
    {}
  );
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");

  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("General");

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [liking, setLiking] = useState<number | null>(null);
  const [commenting, setCommenting] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState("");

  // Load posts and logged-in user ID
  async function loadPosts() {
    try {
      setError("");

      const response = await fetch("/api/posts", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load posts");
      }

      setPosts(data.posts || []);
      setCurrentUserId(data.currentUserId || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  // Create a post
  async function createPost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!content.trim()) return;

    setPosting(true);
    setError("");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create post");
      }

      setPosts((previous) => [data.post, ...previous]);
      setContent("");
      setCategory("General");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setPosting(false);
    }
  }

  // Like or unlike a post
  async function toggleLike(postId: number) {
    if (liking !== null) return;

    setLiking(postId);
    setError("");

    try {
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update like");
      }

      setPosts((previous) =>
        previous.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: data.isLiked,
                like_count: data.likeCount,
              }
            : post
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLiking(null);
    }
  }

  // Start editing a post
  function startEditing(post: Post) {
    setEditingPost(post.id);
    setEditContent(post.content);
    setEditCategory(post.category);
    setError("");
  }

  // Cancel editing
  function cancelEditing() {
    setEditingPost(null);
    setEditContent("");
    setEditCategory("General");
  }

  // Save edited post
  async function saveEdit(postId: number) {
    if (!editContent.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    if (editContent.trim().length > 2000) {
      setError("Post cannot exceed 2000 characters");
      return;
    }

    setSavingEdit(true);
    setError("");

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editContent.trim(),
          category: editCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update post");
      }

      setPosts((previous) =>
        previous.map((post) =>
          post.id === postId
            ? {
                ...post,
                content: data.post?.content ?? editContent.trim(),
                category: data.post?.category ?? editCategory,
              }
            : post
        )
      );

      cancelEditing();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update post"
      );
    } finally {
      setSavingEdit(false);
    }
  }

  // Delete a post
  async function deletePost(postId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post? Its comments and likes will also be deleted."
    );

    if (!confirmed) return;

    setDeleting(postId);
    setError("");

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete post");
      }

      setPosts((previous) =>
        previous.filter((post) => post.id !== postId)
      );

      setComments((previous) => {
        const updated = { ...previous };
        delete updated[postId];
        return updated;
      });

      if (expandedPost === postId) {
        setExpandedPost(null);
      }

      if (editingPost === postId) {
        cancelEditing();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete post"
      );
    } finally {
      setDeleting(null);
    }
  }

  // Load comments
  async function loadComments(postId: number) {
    try {
      const response = await fetch(
        `/api/posts/comments?postId=${postId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load comments");
      }

      setComments((previous) => ({
        ...previous,
        [postId]: data.comments || [],
      }));

      if (data.currentUserId) {
        setCurrentUserId(data.currentUserId);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load comments"
      );
    }
  }

  // Show or hide comments
  async function toggleComments(postId: number) {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }

    setExpandedPost(postId);
    await loadComments(postId);
  }

  // Add a comment
  async function addComment(postId: number) {
    const comment = (commentInputs[postId] || "").trim();

    if (!comment) return;

    setCommenting(postId);
    setError("");

    try {
      const response = await fetch("/api/posts/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to add comment");
      }

      setComments((previous) => ({
        ...previous,
        [postId]: [
          ...(previous[postId] || []),
          data.comment,
        ],
      }));

      setCommentInputs((previous) => ({
        ...previous,
        [postId]: "",
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to add comment"
      );
    } finally {
      setCommenting(null);
    }
  }

  // Delete your own comment
  async function deleteComment(commentId: number, postId: number) {
    if (
      !window.confirm("Are you sure you want to delete this comment?")
    ) {
      return;
    }

    setDeleting(commentId);
    setError("");

    try {
      const response = await fetch("/api/posts/comments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete comment");
      }

      setComments((previous) => ({
        ...previous,
        [postId]: (previous[postId] || []).filter(
          (comment) => comment.id !== commentId
        ),
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete comment"
      );
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0F0A0A] px-4 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="text-sm text-yellow-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-8 mt-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
            Nammavaru Community
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Community Feed
          </h1>

          <p className="mt-2 text-gray-400">
            Share ideas, celebrate achievements and connect with
            Kannadigas everywhere.
          </p>
        </div>

        {/* Create Post */}
        <form
          onSubmit={createPost}
          className="mb-8 rounded-2xl border border-white/10 bg-[#1A1212] p-5"
        >
          <h2 className="mb-4 text-lg font-semibold">
            Create a post
          </h2>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in your world?"
            maxLength={2000}
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-[#0F0A0A] p-4 text-white outline-none focus:border-yellow-400"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0F0A0A] px-3 py-2 text-sm text-white outline-none"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={posting || !content.trim()}
              className="rounded-lg bg-yellow-400 px-6 py-2.5 font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
            >
              {posting ? "Posting..." : "Share Post"}
            </button>
          </div>

          <p className="mt-2 text-right text-xs text-gray-500">
            {content.length}/2000
          </p>
        </form>

        {/* Error */}
        {error && (
          <p className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {/* Posts Heading */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Posts</h2>

          <button
            onClick={loadPosts}
            className="text-sm text-yellow-400 hover:underline"
          >
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <p className="py-10 text-center text-gray-400">
            Loading community posts...
          </p>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#1A1212] p-10 text-center">
            <p className="text-4xl">💬</p>

            <h3 className="mt-3 text-lg font-semibold">
              No posts yet
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Be the first to share something with the community!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const postComments = comments[post.id] || [];
              const isOwner =
                Boolean(currentUserId) &&
                post.user_id === currentUserId;

              return (
                <article
                  key={post.id}
                  className="rounded-2xl border border-white/10 bg-[#1A1212] p-5"
                >
                  {/* Post Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {post.author_name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleString()}
                      </p>
                    </div>

                    <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-400">
                      {post.category}
                    </span>
                  </div>

                  {/* Owner Actions */}
                  {isOwner && editingPost !== post.id && (
                    <div className="mt-4 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => startEditing(post)}
                        className="rounded-lg border border-yellow-400/30 px-3 py-1.5 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400/10"
                      >
                        ✏️ Edit Post
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePost(post.id)}
                        disabled={deleting === post.id}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {deleting === post.id
                          ? "Deleting..."
                          : "🗑️ Delete Post"}
                      </button>
                    </div>
                  )}

                  {/* Edit Form */}
                  {editingPost === post.id ? (
                    <div className="mt-4 rounded-xl border border-yellow-400/20 bg-[#0F0A0A] p-4">
                      <h4 className="mb-3 font-semibold text-yellow-400">
                        Edit your post
                      </h4>

                      <textarea
                        value={editContent}
                        onChange={(e) =>
                          setEditContent(e.target.value)
                        }
                        maxLength={2000}
                        rows={4}
                        className="w-full resize-none rounded-lg border border-white/10 bg-[#1A1212] p-3 text-white outline-none focus:border-yellow-400"
                      />

                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <select
                          value={editCategory}
                          onChange={(e) =>
                            setEditCategory(e.target.value)
                          }
                          className="rounded-lg border border-white/10 bg-[#1A1212] px-3 py-2 text-sm text-white outline-none"
                        >
                          {categories.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={savingEdit}
                            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => saveEdit(post.id)}
                            disabled={
                              savingEdit || !editContent.trim()
                            }
                            className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-50"
                          >
                            {savingEdit ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>

                      <p className="mt-2 text-right text-xs text-gray-500">
                        {editContent.length}/2000
                      </p>
                    </div>
                  ) : (
                    <p className="mt-4 whitespace-pre-wrap break-words leading-7 text-gray-200">
                      {post.content}
                    </p>
                  )}

                  {/* Like and Comments */}
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-white/10 pt-4">
                    <button
                      onClick={() => toggleLike(post.id)}
                      disabled={liking !== null}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        post.is_liked
                          ? "bg-red-500/10 text-red-400"
                          : "text-gray-400 hover:bg-white/5 hover:text-red-400"
                      } disabled:opacity-50`}
                    >
                      {post.is_liked ? "❤️ Liked" : "🤍 Like"}
                      <span>({post.like_count})</span>
                    </button>

                    <button
                      onClick={() => toggleComments(post.id)}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-yellow-400"
                    >
                      💬 Comments
                      {comments[post.id] !== undefined && (
                        <span className="ml-1">
                          ({postComments.length})
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedPost === post.id && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <h4 className="mb-4 font-semibold">
                        Discussion
                      </h4>

                      <div className="space-y-3">
                        {postComments.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No comments yet. Start the discussion!
                          </p>
                        ) : (
                          postComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="rounded-xl bg-[#0F0A0A] p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold">
                                  {comment.author_name}
                                </p>

                                {comment.user_id === currentUserId && (
                                  <button
                                    onClick={() =>
                                      deleteComment(
                                        comment.id,
                                        post.id
                                      )
                                    }
                                    disabled={
                                      deleting === comment.id
                                    }
                                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                                  >
                                    {deleting === comment.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                )}
                              </div>

                              <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-300">
                                {comment.content}
                              </p>

                              <p className="mt-2 text-xs text-gray-600">
                                {new Date(
                                  comment.created_at
                                ).toLocaleString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment */}
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((previous) => ({
                              ...previous,
                              [post.id]: e.target.value,
                            }))
                          }
                          maxLength={1000}
                          placeholder="Write a comment..."
                          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0F0A0A] px-4 py-3 text-sm text-white outline-none focus:border-yellow-400"
                        />

                        <button
                          onClick={() => addComment(post.id)}
                          disabled={
                            commenting === post.id ||
                            !(commentInputs[post.id] || "").trim()
                          }
                          className="rounded-lg bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-50"
                        >
                          {commenting === post.id
                            ? "Sending..."
                            : "Comment"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
