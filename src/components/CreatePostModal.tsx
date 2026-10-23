import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Video,
  Megaphone,
  Tag,
  Calendar,
  Loader2,
  Trash2,
  UploadCloud,
  CheckCircle,
} from 'lucide-react';
import { PostType, Community } from '../types/bizmunity';
import { createPost } from '../firebase/firestoreService';
import { compressImage } from '../utils/imageCompressor';
import { useAuth } from '../context/AuthContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  communities: Community[];
  initialCommunityId?: string;
  onPostCreated?: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  communities,
  initialCommunityId,
  onPostCreated,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [selectedCommunityId, setSelectedCommunityId] = useState(initialCommunityId || '');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');

  // Offer fields
  const [offerCode, setOfferCode] = useState('');
  const [offerDiscount, setOfferDiscount] = useState(15);
  const [offerExpiresAt, setOfferExpiresAt] = useState('');

  // Event fields
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setLoading(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const compressed = await compressImage(file, 900, 900, 0.8);
          newUrls.push(compressed);
        }
      }
      setMediaUrls((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setErrorMsg('Failed to process image: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaUrls.length === 0 && postType === 'text') {
      setErrorMsg('Please write some content or attach an image.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const selectedComm = communities.find((c) => c.id === selectedCommunityId);

      const allMedia = [...mediaUrls];
      if (videoUrl.trim()) {
        allMedia.push(videoUrl.trim());
      }

      const extra: any = {};
      if (postType === 'offer') {
        extra.offerDetails = {
          code: offerCode.toUpperCase() || 'BIZSAVE',
          discountPercent: Number(offerDiscount) || 10,
          expiresAt: offerExpiresAt || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        };
      } else if (postType === 'event') {
        extra.eventDetails = {
          title: eventTitle || 'Community Event',
          date: eventDate || new Date().toISOString().split('T')[0],
          location: eventLocation || 'Online Meetup',
        };
      }

      await createPost(
        content,
        postType,
        allMedia,
        selectedCommunityId || undefined,
        selectedComm?.name || undefined,
        extra
      );

      setSuccess(true);
      if (onPostCreated) onPostCreated();

      setTimeout(() => {
        onClose();
        setContent('');
        setMediaUrls([]);
        setVideoUrl('');
        setSuccess(false);
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {userProfile?.avatar ? (
                <img src={userProfile.avatar} alt="You" className="w-full h-full object-cover" />
              ) : (
                userProfile?.name?.charAt(0) || 'U'
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Create New Post</h3>
              <p className="text-[11px] text-zinc-400">Share updates with the Bizmunity network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Post published successfully! (+20 Loyalty Points)</span>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Post Type
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium">
              <button
                type="button"
                onClick={() => setPostType('text')}
                className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  postType === 'text'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span>Discussion</span>
              </button>
              <button
                type="button"
                onClick={() => setPostType('announcement')}
                className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  postType === 'announcement'
                    ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Notice</span>
              </button>
              <button
                type="button"
                onClick={() => setPostType('offer')}
                className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  postType === 'offer'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Offer</span>
              </button>
              <button
                type="button"
                onClick={() => setPostType('event')}
                className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                  postType === 'event'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Event</span>
              </button>
            </div>
          </div>

          {/* Community selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Publish To Community (Optional)
            </label>
            <select
              value={selectedCommunityId}
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">🌐 Public Feed (All Bizmunity)</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  👥 {c.name} (@{c.handle})
                </option>
              ))}
            </select>
          </div>

          {/* Main textarea */}
          <div>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What are you building, sharing, or offering today?"
              className="w-full p-3 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-zinc-400 resize-none"
            />
          </div>

          {/* Conditional Offer details */}
          {postType === 'offer' && (
            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> Offer & Discount Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    placeholder="SUMMER20"
                    className="w-full uppercase font-mono px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Discount %</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={offerDiscount}
                    onChange={(e) => setOfferDiscount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={offerExpiresAt}
                  onChange={(e) => setOfferExpiresAt(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Conditional Event details */}
          {postType === 'event' && (
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Event Details
              </h4>
              <div>
                <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Founder Mixer & Demo Night"
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-600 dark:text-zinc-400 mb-1">Location or Link</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Bangalore or Zoom link"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Media preview list */}
          {mediaUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 group">
                  <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Video URL attachment */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Video URL (YouTube, Vimeo, MP4 stream)
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                <span>Add Image</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="py-2 px-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-orange-500/20 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
