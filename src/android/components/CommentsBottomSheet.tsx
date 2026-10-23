import React, { useState, useEffect } from 'react';
import { X, Send, Trash2, Heart, CornerDownRight, Loader2 } from 'lucide-react';
import { Post, Comment } from '../../types/bizmunity';
import { useAuth } from '../../context/AuthContext';
import { subscribeComments, addComment, deleteComment } from '../../firebase/firestoreService';

interface CommentsBottomSheetProps {
  post: Post | null;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const CommentsBottomSheet: React.FC<CommentsBottomSheetProps> = ({
  post,
  onClose,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newText, setNewText] = useState('');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!post) return;
    const unsub = subscribeComments(post.id, (list) => {
      setComments(list);
    });
    return () => unsub();
  }, [post]);

  if (!post) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!newText.trim()) return;

    setLoading(true);
    try {
      await addComment(post.id, newText.trim(), post.authorId, replyingId || undefined);
      setNewText('');
      setReplyingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('Delete this comment?')) {
      await deleteComment(commentId, post.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-[420px] mx-auto bg-white dark:bg-zinc-950 rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh] border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom duration-200 overflow-hidden">
        {/* Android drag handle indicator */}
        <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto my-2 shrink-0" />

        {/* Header */}
        <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-xs text-zinc-900 dark:text-white">
            Comments ({comments.length})
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable comments stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-center text-xs text-zinc-400 py-10">
              No comments yet. Start the conversation!
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className={`text-xs p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 ${
                  c.parentCommentId ? 'ml-5 border-l-2 border-l-orange-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white">{c.authorName}</span>
                    <span className="text-[10px] text-zinc-400">@{c.authorUsername}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                    <span>
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {currentUser?.uid === c.authorId && (
                      <button onClick={() => handleDelete(c.id)} className="hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed">{c.content}</p>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-400">
                  <button
                    onClick={() => setReplyingId(c.id)}
                    className="hover:text-orange-500 flex items-center gap-1 font-semibold"
                  >
                    <CornerDownRight className="w-3 h-3" /> Reply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 shrink-0">
          {replyingId && (
            <div className="flex items-center justify-between text-[11px] text-orange-600 dark:text-orange-400 pb-1.5 px-1 font-semibold">
              <span>Replying to comment...</span>
              <button onClick={() => setReplyingId(null)} className="hover:underline">
                Cancel
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Add comment..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={loading || !newText.trim()}
              className="p-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-bold shadow-sm disabled:opacity-50 transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
