import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  PlusCircle,
  Users,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';
import { EventItem, Community } from '../types/bizmunity';
import { useAuth } from '../context/AuthContext';
import { createEvent } from '../firebase/firestoreService';

interface EventsViewProps {
  events: EventItem[];
  communities: Community[];
  onOpenAuth: () => void;
  onCommunityClick: (communityId: string) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  communities,
  onOpenAuth,
  onCommunityClick,
}) => {
  const { currentUser } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCommId, setSelectedCommId] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggleRsvp = (eventId: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const next = new Set(rsvpedIds);
    if (next.has(eventId)) next.delete(eventId);
    else next.add(eventId);
    setRsvpedIds(next);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const comm = communities.find((c) => c.id === selectedCommId);

    setCreating(true);
    setErrorMsg('');
    try {
      await createEvent(
        title,
        date || new Date().toISOString(),
        location || 'Online Meetup',
        description,
        selectedCommId || 'global',
        comm?.name || 'Bizmunity Network'
      );
      setShowCreateModal(false);
      setTitle('');
      setDate('');
      setLocation('');
      setDescription('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create event.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Events, Meetups & Workshops
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            RSVP to community demo days, founder office hours, and local networking meetups
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Schedule Event
        </button>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center shadow-sm">
          <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            No events scheduled yet
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Host a virtual pitch session, product launch, or in-person founder coffee meet!
          </p>
          <button
            onClick={() => {
              if (!currentUser) onOpenAuth();
              else setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            Host First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((ev) => {
            const hasRsvped = rsvpedIds.has(ev.id);
            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {ev.communityName || 'Bizmunity Event'}
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {(ev.rsvpCount || 0) + (hasRsvped ? 1 : 0)} Attending
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">
                    {ev.title}
                  </h3>

                  <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{new Date(ev.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{ev.location}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 mb-4">
                    {ev.description}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleRsvp(ev.id)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm ${
                    hasRsvped
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {hasRsvped ? <CheckCircle className="w-4 h-4" /> : null}
                  {hasRsvped ? 'RSVP Confirmed ✓' : 'RSVP to Attend (+10 pts)'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden text-xs">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" /> Schedule Community Event
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && <div className="mb-3 p-2 rounded bg-red-50 text-red-600">{errorMsg}</div>}

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block font-semibold mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Founders Pitch Day & Networking"
                  className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Location or Meeting Link</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Zoom URL, Google Meet, or physical address"
                  className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Community</label>
                <select
                  value={selectedCommId}
                  onChange={(e) => setSelectedCommId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="">Public Bizmunity Network</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description & Agenda</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will be discussed? What should attendees prepare?"
                  className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
