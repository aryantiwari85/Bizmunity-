import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Trash2,
  Tag,
  Calendar,
  Megaphone,
  Check,
  Send,
  MoreVertical,
  CornerDownRight,
  Sparkles,
} from 'lucide-react';
import { Post, Comment } from '../types/bizmunity';
import { useAuth } from '../context/AuthContext';
import {
  toggleLikePost,
  toggleSavePost,
  deletePost,
  subscribeComments,
  addComment,
  deleteComment,
} from '../firebase/firestoreService';

interface PostCardProps {
  post: Post;
  isLiked?: boolean;
  isSaved?: boolean;
  onCommunityClick?: (communityId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  onOpenAuth?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  isLiked = false,
  isSaved = false,
  onCommunityClick,
  onAuthorClick,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [saved, setSaved] = useState(isSaved);
  const [savesCount, setSavesCount] = useState(post.savesCount || 0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  useEffect(() => {
    setLikesCount(post.likesCount || 0);
  }, [post.likesCount]);

  // Subscribe to live comments when expanded
  useEffect(() => {
    if (!showComments) return;
    const unsub = subscribeComments(post.id, (list) => {
      setComments(list);
    });
    return () => unsub();
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleLikePost(post, liked);
    } catch (err) {
      // Revert on error
      setLiked(liked);
      setLikesCount(post.likesCount || 0);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const nextSaved = !saved;
    setSaved(nextSaved);
    setSavesCount((prev) => (nextSaved ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleSavePost(post.id, saved);
    } catch (err) {
      setSaved(saved);
      setSavesCount(post.savesCount || 0);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDeletePost = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      await deletePost(post.id);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      await addComment(post.id, newCommentText.trim(), post.authorId, replyingToCommentId || undefined);
      setNewCommentText('');
      setReplyingToCommentId(null);
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('Delete this comment?')) {
      await deleteComment(commentId, post.id);
    }
  };

  const isAuthor = currentUser?.uid === post.authorId;

  return (
    <article className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Post Header */}
      <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            onClick={() => onAuthorClick && onAuthorClick(post.authorId)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden cursor-pointer shrink-0"
          >
            {post.authorAvatar ? (
              <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
            ) : (
              post.authorName.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                onClick={() => onAuthorClick && onAuthorClick(post.authorId)}
                className="font-bold text-sm text-zinc-900 dark:text-white hover:underline cursor-pointer"
              >
                {post.authorName}
              </span>
              <span className="text-xs text-zinc-400">@{post.authorUsername}</span>

              {/* Community Tag */}
              {post.communityName && post.communityId && (
                <span
                  onClick={() => onCommunityClick && onCommunityClick(post.communityId!)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300 hover:underline cursor-pointer"
                >
                  in {post.communityName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-zinc-400">
                {new Date(post.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>

              {/* Type specific badge */}
              {post.type === 'announcement' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <Megaphone className="w-3 h-3" /> Announcement
                </span>
              )}
              {post.type === 'offer' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <Tag className="w-3 h-3" /> Special Deal
                </span>
              )}
              {post.type === 'event' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  <Calendar className="w-3 h-3" /> Event
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Dropdown / Delete */}
        {isAuthor && (
          <button
            onClick={handleDeletePost}
            className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Post Text Content */}
      <div className="px-4 sm:px-5 py-2 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      {/* Special Offer Card */}
      {post.type === 'offer' && post.offerDetails && (
        <div className="mx-4 sm:mx-5 my-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-green-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {post.offerDetails.discountPercent}% OFF
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Exclusive member discount</span>
            </div>
            {post.offerDetails.expiresAt && (
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Valid until {new Date(post.offerDetails.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={() => handleCopyCode(post.offerDetails!.code)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copied!' : post.offerDetails.code}
          </button>
        </div>
      )}

      {/* Event Details Card */}
      {post.type === 'event' && post.eventDetails && (
        <div className="mx-4 sm:mx-5 my-3 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center font-bold text-xs shadow-sm">
              <Calendar className="w-4 h-4 mb-0.5" />
              <span>RSVP</span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                {post.eventDetails.title}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                📅 {new Date(post.eventDetails.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                📍 {post.eventDetails.location}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Media Attachments (Images) */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="mt-2">
          {post.mediaUrls.length === 1 ? (
            <div className="max-h-96 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <img
                src={post.mediaUrls[0]}
                alt="Post attachment"
                className="w-full h-full object-cover max-h-96"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 bg-zinc-100 dark:bg-zinc-800">
              {post.mediaUrls.map((url, i) => (
                <div key={i} className="h-48 overflow-hidden">
                  <img
                    src={url}
                    alt={`Attachment ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Engagement Action Bar */}
      <div className="px-4 sm:px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition font-semibold ${
              liked ? 'text-rose-600 dark:text-rose-500' : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </button>

          {/* Comments */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition font-semibold"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentsCount || comments.length || 0}</span>
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 transition font-semibold ${
              saved ? 'text-amber-600 dark:text-amber-500' : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
            <span>{savesCount}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition font-medium"
        >
          {copiedShare ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          <span>{copiedShare ? 'Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Comments Drawer / Section */}
      {showComments && (
        <div className="bg-zinc-50/70 dark:bg-zinc-950/40 p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          {/* Add comment input */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={replyingToCommentId ? 'Write a reply...' : 'Add a thoughtful comment...'}
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={submittingComment || !newCommentText.trim()}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {replyingToCommentId && (
            <div className="flex items-center justify-between text-[11px] text-orange-600 dark:text-orange-400 px-2">
              <span>Replying to nested comment</span>
              <button
                type="button"
                onClick={() => setReplyingToCommentId(null)}
                className="hover:underline font-bold"
              >
                Cancel Reply
              </button>
            </div>
          )}

          {/* List of comments */}
          <div className="space-y-2.5 max-h-60 overflow-y-auto pt-1">
            {comments.length === 0 ? (
              <p className="text-center text-xs text-zinc-400 py-3">
                No comments yet. Be the first to start the conversation!
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className={`text-xs p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 ${
                    c.parentCommentId ? 'ml-6 border-l-2 border-l-orange-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] text-zinc-400">@{c.authorUsername}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {currentUser?.uid === c.authorId && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-zinc-700 dark:text-zinc-300 leading-normal">{c.content}</p>

                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-zinc-400">
                    <button
                      onClick={() => setReplyingToCommentId(c.id)}
                      className="hover:text-orange-500 flex items-center gap-1 font-medium"
                    >
                      <CornerDownRight className="w-3 h-3" /> Reply
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
};
