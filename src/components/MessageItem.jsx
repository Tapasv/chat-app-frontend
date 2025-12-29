import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { Play, Pause, Mic, MoreVertical } from "lucide-react";
import apimessage from "../apimessage";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const MessageItem = ({ message, currentUser, onMessageUpdate, onMessageDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.text || "");
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef(null);
  const optionsRef = useRef(null);

  const isCurrentUser = message.sender?._id === currentUser?._id;
  const isVoice = message.isVoiceMessage === true;
  const isFile = message.fileUrl && !isVoice;
  const isDeletedForEveryone = message.deletedForEveryone;

  /* ---------- OUTSIDE CLICK ---------- */
  useEffect(() => {
    const handler = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------- CLEANUP AUDIO ---------- */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /* ---------- PERMISSIONS ---------- */
  const canEdit = () =>
    message.createdAt &&
    Date.now() - new Date(message.createdAt).getTime() < 15 * 60 * 1000;

  const canDelete = () =>
    message.createdAt &&
    Date.now() - new Date(message.createdAt).getTime() < 48 * 60 * 60 * 1000;

  /* ---------- EDIT ---------- */
  const handleEdit = async () => {
    if (!editContent.trim()) return toast.error("Message cannot be empty");
    try {
      const res = await apimessage.put(`/edit/${message._id}`, {
        text: editContent
      });
      onMessageUpdate(res.data.data);
      setIsEditing(false);
      toast.success("Message edited");
    } catch {
      toast.error("Failed to edit message");
    }
  };

  /* ---------- DELETE ---------- */
  const handleDeleteConfirm = async () => {
    try {
      const res = await apimessage.delete(`/delete/${message._id}`, {
        data: { deleteType }
      });

      deleteType === "forMe"
        ? onMessageDelete(message._id)
        : onMessageUpdate(res.data.data);

      toast.success(res.data.message);
      setShowDeleteModal(false);
      setDeleteType(null);
    } catch {
      toast.error("Failed to delete message");
    }
  };

  /* ---------- VOICE ---------- */
  const togglePlayback = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(`${SERVER_URL}${message.fileUrl}`);
      audioRef.current.addEventListener("loadedmetadata", () =>
        setDuration(audioRef.current.duration)
      );
      audioRef.current.addEventListener("timeupdate", () =>
        setCurrentTime(audioRef.current.currentTime)
      );
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (t) => {
    if (!t || isNaN(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  /* ---------- DELETED ---------- */
  if (isDeletedForEveryone) {
    return (
      <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} my-2`}>
        <div className="px-4 py-2 rounded-xl bg-gray-800 text-gray-400 text-xs italic">
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} my-2`}>
      <div ref={optionsRef} className="relative max-w-[75%] group">
        {/* OPTIONS */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="absolute -top-2 -right-2 p-1 rounded-full bg-gray-900/80 opacity-0 group-hover:opacity-100 transition"
        >
          <MoreVertical size={14} />
        </button>

        {showOptions && (
          <div className="absolute right-0 mt-2 bg-gray-900 rounded-xl shadow-xl text-sm z-50 overflow-hidden">
            {isCurrentUser && !isFile && canEdit() && (
              <button
                onClick={() => setIsEditing(true)}
                className="block px-4 py-2 hover:bg-gray-800 w-full text-left"
              >
                ✏️ Edit
              </button>
            )}
            {isCurrentUser && canDelete() && (
              <button
                onClick={() => {
                  setDeleteType("forEveryone");
                  setShowDeleteModal(true);
                }}
                className="block px-4 py-2 hover:bg-gray-800 w-full text-left"
              >
                Delete for everyone
              </button>
            )}
            <button
              onClick={() => {
                setDeleteType("forMe");
                setShowDeleteModal(true);
              }}
              className="block px-4 py-2 hover:bg-gray-800 w-full text-left text-red-400"
            >
              Delete for me
            </button>
          </div>
        )}

        {/* MESSAGE */}
        {isEditing ? (
          <div className="bg-gray-900 p-4 rounded-xl shadow">
            <input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-gray-800 px-3 py-2 rounded-lg text-sm outline-none"
            />
            <div className="flex gap-2 mt-3 justify-end">
              <button
                onClick={handleEdit}
                className="px-4 py-1.5 bg-blue-600 rounded-lg text-sm"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 bg-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-2 shadow-md text-sm ${
              isCurrentUser
                ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white"
                : "bg-gray-800 text-white"
            }`}
          >
            {!isFile && !isVoice && <p>{message.text}</p>}

            {isVoice && (
              <div className="flex items-center gap-3 min-w-[220px]">
                <button
                  onClick={togglePlayback}
                  className="p-2 rounded-full bg-black/20"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <div className="flex-1 h-1 bg-black/30 rounded">
                  <div
                    className="h-1 bg-green-400 rounded"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                <span className="text-xs opacity-80">
                  {formatTime(isPlaying ? currentTime : duration)}
                </span>

                <Mic size={14} className="opacity-70" />
              </div>
            )}

            {isFile && (
              <button
                onClick={() => window.open(`${SERVER_URL}${message.fileUrl}`, "_blank")}
                className="underline text-sm"
              >
                📎 {message.fileName}
              </button>
            )}

            <div className="text-[10px] opacity-70 text-right mt-1">
              {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              })}
              {message.isEdited && " • edited"}
            </div>
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-2xl w-80 shadow-xl">
            <h3 className="font-semibold mb-2">Delete message?</h3>
            <p className="text-sm text-gray-400 mb-4">
              {deleteType === "forEveryone"
                ? "This message will be deleted for everyone."
                : "This message will be deleted only for you."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 py-2 rounded-lg"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
