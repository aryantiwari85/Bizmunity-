import React, { useState } from 'react';
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Megaphone,
  Tag,
  Calendar,
  Loader2,
  Trash2,
  Send,
} from 'lucide-react';
import { PostType, Community } from '../../types/bizmunity';
import { createPost } from '../../firebase/firestoreService';
import { compressImage } from '../../utils/imageCompressor';
import { useAuth } from '../../context/AuthContext';

interface CreatePostScreenProps {
  communities: Community[];
  initialCommunityId?: string;
  onSuccess: () => void;
  onGoBack: () => void;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  communities,
  initialCommunityId,
  onSuccess,
  onGoBack,
}) => {
  const { userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const defaultCommId = initialCommunityId || (communities.length > 0 ? communities[0].id : '');
  const [selectedCommId, setSelectedCommId] = useState(defaultCommId);
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

    if (!selectedCommId) {
      setErrorMsg('Posts must belong to a community. Please select a community.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const selectedComm = communities.find((c) => c.id === selectedCommId);

      const allMedia = [...mediaUrls];
      if (videoUrl.trim()) {
        allMedia.push(videoUrl.trim());
      }

      const extra: any = {};
      if (postType === 'offer') {
        extra.offerDetails = {
          code: offerCode.toUpperCase() || 'BIZDEAL',
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
        selectedCommId || undefined,
        selectedComm?.name || undefined,
        extra
      );

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-white">
      {/* Top App Bar */}
      <div className="h-12 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <button onClick={onGoBack} className="p-1 text-zinc-600 dark:text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-xs">Create Post</span>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Publish'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs pb-16">
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Post Type Selector */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setPostType('text')}
            className={`py-1.5 rounded-lg transition ${
              postType === 'text' ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500'
            }`}
          >
            Discussion
          </button>
          <button
            type="button"
            onClick={() => setPostType('announcement')}
            className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              postType === 'announcement' ? 'bg-white dark:bg-zinc-800 text-amber-500 shadow-sm font-bold' : 'text-zinc-500'
            }`}
          >
            <Megaphone className="w-3 h-3" /> Notice
          </button>
          <button
            type="button"
            onClick={() => setPostType('offer')}
            className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              postType === 'offer' ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm font-bold' : 'text-zinc-500'
            }`}
          >
            <Tag className="w-3 h-3" /> Offer
          </button>
          <button
            type="button"
            onClick={() => setPostType('event')}
            className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              postType === 'event' ? 'bg-white dark:bg-zinc-800 text-blue-500 shadow-sm font-bold' : 'text-zinc-500'
            }`}
          >
            <Calendar className="w-3 h-3" /> Event
          </button>
        </div>

        {/* Community Selector */}
        <div>
          <label className="block font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
            Select Community <span className="text-orange-500">*</span>
          </label>
          <select
            value={selectedCommId}
            onChange={(e) => setSelectedCommId(e.target.value)}
            required
            className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white"
          >
            {communities.length === 0 ? (
              <option value="">No communities available</option>
            ) : (
              communities.map((c) => (
                <option key={c.id} value={c.id}>
                  👥 {c.name} (@{c.handle})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Text Body */}
        <div>
          <textarea
            rows={5}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening in your business? Share announcements, advice, or ask questions..."
            className="w-full p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-xs"
          />
        </div>

        {/* Special Offer details */}
        {postType === 'offer' && (
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2">
            <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Offer Details</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-500 mb-0.5">Coupon Code</label>
                <input
                  type="text"
                  required
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="PROMO20"
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-0.5">Discount %</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={offerDiscount}
                  onChange={(e) => setOfferDiscount(Number(e.target.value))}
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Event details */}
        {postType === 'event' && (
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-500/30 rounded-2xl space-y-2">
            <h4 className="font-bold text-blue-800 dark:text-blue-300">Event Details</h4>
            <div>
              <label className="block text-zinc-500 mb-0.5">Title</label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Product Launch & Demo Session"
                className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-zinc-500 mb-0.5">Date</label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-0.5">Location</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Online (Google Meet)"
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* Photos Preview */}
        {mediaUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Photo Upload Trigger */}
        <div className="flex gap-2 pt-2">
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold">
            <ImageIcon className="w-4 h-4 text-orange-500" /> Add Image
            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
