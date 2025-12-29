import axios from "axios";
import { useState, useEffect, useRef, useContext } from "react";
import io from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import { Authcntxt } from "../context/authcontext";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  UserX,
  Trash2,
  Settings,
  LogOut,
  User,
  Mic,
  Play,
  Pause
} from "lucide-react";
import MessageItem from "./MessageItem";
import EmojiPicker from "emoji-picker-react";
import "react-toastify/dist/ReactToastify.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export default function Chat() {
  const [message, setMessage] = useState("");
  const [privateMessage, setPrivateMessage] = useState([]);
  const [typingPrivate, setTypingPrivate] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [onlineUsers, setOnlineusers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserList, setShowUserList] = useState(true);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioDurations, setAudioDurations] = useState({});
  const [audioProgress, setAudioProgress] = useState({});
  const audioRefs = useRef({});

  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);

  const [incomingCall, setIncomingCall] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callType, setCallType] = useState(null);
  const [stream, setStream] = useState(null);
  const [callerSignal, setCallerSignal] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileInputRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const userVideoRef = useRef(null);
  const partnerVideoRef = useRef(null);

  const [ShowChatMenu, setShowChatMenu] = useState(false);
  const [ShowfrndMenu, setShowfrndMenu] = useState(null);
  const [blockedUser, setBlockedUser] = useState([]);
  const chatMenuRef = useRef(null);

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  const { logout, user } = useContext(Authcntxt);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) navigate("/login");
  }, [currentUser, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [privateMessage]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
  const showBrowserNotification = (title, body, icon) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const notification = new Notification(title, {
        body,
        icon: icon || '/chatify-icon.png',
        badge: '/chatify-icon.png',
        tag: 'chatify-message',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.Username?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  useEffect(() => {
    const userInstorage = JSON.parse(localStorage.getItem("user"));
    if (!userInstorage) return;

    socketRef.current = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
      auth: { Username: userInstorage.Username, userid: userInstorage._id },
    });

    const socket = socketRef.current;

    socket.on("onlineUsers", (users) => {
      setOnlineusers(users);
    });

    socket.emit("requestOnlineUsers");

    socket.on("receivePrivateMessage", data => {
      setPrivateMessage(prev => {
        const currentActive = JSON.parse(localStorage.getItem("activeUser"));
        const currentUser = JSON.parse(localStorage.getItem("user"));

        if (!currentActive) return prev;

        if (blockedUser.includes(data.sender._id)) {
          console.log("Message blocked from:", data.sender.Username);
          return prev;
        }

        const isRelevant =
          (data.sender._id === currentActive._id && data.receiver._id === currentUser._id) ||
          (data.sender._id === currentUser._id && data.receiver._id === currentActive._id);

        if (isRelevant) {
          return [...prev, data];
        }

        return prev;
      });
    });

    socket.on("newMessageNotification", (notif) => {
      console.log("📨 Notification received:", notif);
      console.log("👤 Sender data:", notif.sender);
      console.log("🖼️ Profile picture path:", notif.sender?.profilePicture);
      console.log("🌐 Full URL:", notif.sender?.profilePicture ? `${SERVER_URL}${notif.sender.profilePicture}` : 'No picture');

      showBrowserNotification(
        `New message from ${notif.sender.Username}`,
        notif.message,
        notif.sender.profilePicture ? `${SERVER_URL}${notif.sender.profilePicture}` : null
      );

      setNotifications(prev => [...prev, notif]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== notif));
      }, 5000);
    });

    socket.on("UserTypingPrivate", ({ username, senderId }) => {
      const currentActive = JSON.parse(localStorage.getItem("activeUser"));
      if (currentActive && currentActive._id === senderId) {
        setTypingPrivate(prev => (!prev.includes(username) ? [...prev, username] : prev));
      }
    });

    socket.on("UserStopTypingPrivate", ({ username, senderId }) => {
      const currentActive = JSON.parse(localStorage.getItem("activeUser"));
      if (currentActive && currentActive._id === senderId) {
        setTypingPrivate(prev => prev.filter(u => u !== username));
      }
    });

    socket.on("friendRequestReceived", (request) => {
      setPendingRequests(prev => [...prev, request]);
      toast.info(`${request.sender.Username} sent you a friend request!`);
    });

    socket.on("friendRequestAccepted", (friend) => {
      setFriends(prev => [...prev, friend]);
      setSentRequests(prev => prev.filter(r => r.receiver._id !== friend._id));
      toast.success(`${friend.Username} accepted your friend request!`);
      socket.emit("requestOnlineUsers");
    });

    socket.on("friendRequestRejected", ({ requestId, receiverId }) => {
      setSentRequests(prev => prev.filter(r => r.receiver._id !== receiverId));
    });

    socket.on("friendRemoved", ({ userId }) => {
      setFriends(prev => prev.filter(f => f._id !== userId));
      const currentActive = JSON.parse(localStorage.getItem("activeUser"));
      if (currentActive && currentActive._id === userId) {
        setActiveUser(null);
        setPrivateMessage([]);
        localStorage.removeItem("activeUser");
      }
      toast.info("A friend removed you from their list");
    });

    socket.on("messageDeleted", ({ messageId, deletedForEveryone }) => {
      setPrivateMessage(prev => {
        if (deletedForEveryone) {
          // Update the message to show as deleted for everyone
          return prev.map(m =>
            m._id === messageId
              ? { ...m, deletedForEveryone: true, text: '' }
              : m
          );
        } else {
          // Remove message for "delete for me"
          return prev.filter(m => m._id !== messageId);
        }
      });
    });

    socket.on("messageEdited", ({ messageId, text, isEdited }) => {
      setPrivateMessage(prev =>
        prev.map(m =>
          m._id === messageId
            ? { ...m, text: text, isEdited: isEdited }
            : m
        )
      );
    });

    socket.on("incomingCall", ({ from, caller, signalData, callType }) => {
      console.log("Incoming call received:", { from, caller, callType });

      if (caller) {
        setIncomingCall(caller);
        setCallerSignal(signalData);
        setCallType(callType);
      }
    });

    socket.on("callAccepted", async (signal) => {
      console.log("Call accepted, setting remote description");
      setCallAccepted(true);
      if (peerRef.current) {
        try {
          await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          console.log("Remote description set successfully");
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    });

    socket.on("iceCandidate", async ({ candidate }) => {
      console.log("Received ICE candidate");
      if (peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("ICE candidate added successfully");
        } catch (err) {
          console.error("Error adding ICE candidate:", err);
        }
      }
    });

    socket.on("callRejected", () => {
      toast.error("Call was rejected");
      endCall();
    });

    socket.on("callEnded", () => {
      endCall();
    });

    return () => {
      socket.off("onlineUsers");
      socket.off("receivePrivateMessage");
      socket.off("newMessageNotification");
      socket.off("UserTypingPrivate");
      socket.off("UserStopTypingPrivate");
      socket.off("friendRequestReceived");
      socket.off("friendRequestAccepted");
      socket.off("friendRequestRejected");
      socket.off("friendRemoved");
      socket.off("messageDeleted");
      socket.off("messageEdited");
      socket.off("incomingCall");
      socket.off("callAccepted");
      socket.off("iceCandidate");
      socket.off("callRejected");
      socket.off("callEnded");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    axios.get(`${SERVER_URL}/api/friends/list`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setFriends(res.data);
    }).catch(err => {
      console.error("Failed to load friends:", err);
    });

    axios.get(`${SERVER_URL}/api/friends/requests/received`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setPendingRequests(res.data)).catch(console.error);

    axios.get(`${SERVER_URL}/api/friends/requests/sent`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setSentRequests(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const loadBlockedUsers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const res = await axios.get(`${SERVER_URL}/api/chat/blocked-users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBlockedUser(res.data);
      } catch (err) {
        console.error("Failed to load blocked users:", err);
      }
    };

    loadBlockedUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setShowfrndMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${SERVER_URL}/api/friends/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${SERVER_URL}/api/friends/request/${receiverId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Friend request sent!");
      setSentRequests(prev => [...prev, { receiver: { _id: receiverId } }]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  const acceptFriendRequest = async (requestId, sender) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${SERVER_URL}/api/friends/accept/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Friend request accepted!");
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      setFriends(prev => [...prev, sender]);
      if (socketRef.current) {
        socketRef.current.emit("requestOnlineUsers");
      }
    } catch (err) {
      toast.error("Failed to accept request");
    }
  };

  const rejectFriendRequest = async (requestId, senderId) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${SERVER_URL}/api/friends/reject/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Friend request rejected");
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
      setSentRequests(prev => prev.filter(r => r.receiver._id !== senderId));
    } catch (err) {
      toast.error("Failed to reject request");
    }
  };

  const unfriendUser = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${SERVER_URL}/api/friends/unfriend/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Friend removed");
      setFriends(prev => prev.filter(f => f._id !== friendId));
      if (activeUser && activeUser._id === friendId) {
        setActiveUser(null);
        setPrivateMessage([]);
        localStorage.removeItem("activeUser");
      }
    } catch (err) {
      toast.error("Failed to remove friend");
    }
  };

  const loadPrivateChat = async (user) => {
    setTypingPrivate([]);
    setActiveUser(user);
    setPrivateMessage([]);
    setShowUserList(false);
    localStorage.setItem("activeUser", JSON.stringify(user));

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${SERVER_URL}/api/chat/private/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrivateMessage(res.data);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const leavePrivateChat = () => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (socketRef.current && activeUser) {
      socketRef.current.emit("StopTypingPrivate", {
        username: currentUser.Username,
        receiver: activeUser._id
      });
    }
    setTypingPrivate([]);
    setActiveUser(null);
    setPrivateMessage([]);
    setMessage("");
    setShowUserList(true);
    localStorage.removeItem("activeUser");
  };

  const BlockUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to block ${activeUser.Username}?`)) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${SERVER_URL}/api/chat/block/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${activeUser.Username} blocked successfully`);
      setBlockedUser(prev => [...prev, userId]);
      setShowChatMenu(false);
    }
    catch (err) {
      toast.error("Failed to block user");
      console.error(err);
    }
  };

  const UnblockUser = async (userId) => {
    if (!window.confirm(`Are you sure you want to unblock ${activeUser.Username}?`)) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${SERVER_URL}/api/chat/unblock/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${activeUser.Username} unblocked successfully`);
      setBlockedUser(prev => prev.filter(id => id !== userId));
      setShowChatMenu(false);
    }
    catch (err) {
      toast.error("Failed to unblock user");
      console.error(err);
    }
  };

  const ClearChat = async () => {
    if (!window.confirm(`Are you sure you want to clear this chat? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${SERVER_URL}/api/chat/clear/${activeUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Chat cleared successfully`);
      setPrivateMessage([]);
      setShowChatMenu(false);
    }
    catch (err) {
      toast.error("Failed to clear chat");
      console.error(err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target)) {
        setShowChatMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sendMessage = () => {
    if (!message.trim() || !activeUser) return;

    const user = JSON.parse(localStorage.getItem("user"));

    if (socketRef.current) {
      socketRef.current.emit("sendPrivateMessage", {
        sender: user._id,
        receiver: activeUser._id,
        text: message
      });
      socketRef.current.emit("StopTypingPrivate", {
        username: user.Username,
        receiver: activeUser._id
      });
      setTypingPrivate(prev => prev.filter(u => u !== user.Username));
    }

    setMessage("");
  };

  const handleInput = e => {
    setMessage(e.target.value);
    const user = JSON.parse(localStorage.getItem("user"));

    if (activeUser && socketRef.current) {
      if (e.target.value.length > 0) {
        socketRef.current.emit("TypingPrivate", {
          username: user.Username,
          receiver: activeUser._id
        });
      } else {
        socketRef.current.emit("StopTypingPrivate", {
          username: user.Username,
          receiver: activeUser._id
        });
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        await sendVoiceMessage(audioBlob);

        stream.getTracks().forEach(track => track.stop());

        // Clear the recording timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        setRecordingDuration(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start the timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast.info('Recording... Click again to send');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear the recording timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    if (!activeUser || !audioBlob) return;

    const formData = new FormData();
    formData.append('file', audioBlob, `voice-${Date.now()}.webm`);
    formData.append('receiver', activeUser._id);
    formData.append('isVoiceMessage', 'true');

    setIsUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        setUploadProgress(Math.round(progress));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        toast.success('Voice message sent!');
        setAudioBlob(null);
      } else {
        toast.error('Failed to send voice message');
      }

      setIsUploading(false);
      setUploadProgress(0);
    });

    xhr.addEventListener('error', () => {
      toast.error('Failed to send voice message');
      setIsUploading(false);
      setUploadProgress(0);
    });

    const token = localStorage.getItem("accessToken");
    xhr.open('POST', `${SERVER_URL}/api/chat/upload`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleLogout = async () => {
    const userRole = user?.role;
    await logout();
    navigate('/login');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be less than 100MB');
      return;
    }

    if (!activeUser) {
      toast.error('Please select a chat first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiver', activeUser._id);

    setIsUploading(true);
    setUploadProgress(0);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        setUploadProgress(Math.round(progress));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        toast.success('File uploaded successfully!');
      } else {
        toast.error('Upload failed');
      }

      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });

    xhr.addEventListener('error', () => {
      toast.error('Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    });

    const token = localStorage.getItem("accessToken");
    xhr.open('POST', `${SERVER_URL}/api/chat/upload`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Profile picture must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${SERVER_URL}/api/friends/profile-picture`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Profile picture updated!');
      const updatedUser = { ...currentUser, profilePicture: res.data.profilePicture };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setShowProfileModal(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload profile picture');
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerProfileUpload = () => {
    if (profileInputRef.current) {
      profileInputRef.current.click();
    }
  };

  // Voice message playback functions
  const toggleAudioPlayback = (messageId, audioUrl) => {
    if (playingAudio === messageId) {
      // Pause the currently playing audio
      const audio = audioRefs.current[messageId];
      if (audio) {
        audio.pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop any currently playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause();
        audioRefs.current[playingAudio].currentTime = 0;
      }

      // Play the new audio
      const audio = new Audio(`${SERVER_URL}${audioUrl}`);
      audioRefs.current[messageId] = audio;

      audio.addEventListener('loadedmetadata', () => {
        setAudioDurations(prev => ({
          ...prev,
          [messageId]: audio.duration
        }));
      });

      audio.addEventListener('timeupdate', () => {
        setAudioProgress(prev => ({
          ...prev,
          [messageId]: audio.currentTime
        }));
      });

      audio.addEventListener('ended', () => {
        setPlayingAudio(null);
        setAudioProgress(prev => ({
          ...prev,
          [messageId]: 0
        }));
      });

      audio.play();
      setPlayingAudio(messageId);
    }
  };

  const formatAudioTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async (type) => {
    if (!activeUser) {
      toast.error("Please select a user to call");
      return;
    }

    if (!onlineUsers.includes(activeUser._id)) {
      toast.error(`${activeUser.Username} is offline`);
      return;
    }

    setCallType(type);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });

      setStream(mediaStream);
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = mediaStream;
      }

      console.log("=== Local media stream captured ===");
      console.log("Local audio tracks:", mediaStream.getAudioTracks());
      console.log("Audio enabled:", mediaStream.getAudioTracks()[0]?.enabled);
      console.log("Audio settings:", mediaStream.getAudioTracks()[0]?.getSettings());

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      });

      mediaStream.getTracks().forEach(track => {
        pc.addTrack(track, mediaStream);
      });

      pc.ontrack = (event) => {
        console.log("=== CALLER: Received remote stream ===");
        console.log("Remote stream:", event.streams[0]);
        console.log("Remote audio tracks:", event.streams[0].getAudioTracks());
        console.log("Remote video tracks:", event.streams[0].getVideoTracks());
        console.log("Audio track enabled:", event.streams[0].getAudioTracks()[0]?.enabled);
        console.log("Audio track muted:", event.streams[0].getAudioTracks()[0]?.muted);

        if (partnerVideoRef.current && event.streams[0]) {
          partnerVideoRef.current.srcObject = event.streams[0];
          console.log("Stream assigned to video element");

          setTimeout(() => {
            console.log("Partner video element muted:", partnerVideoRef.current.muted);
            console.log("Partner video element volume:", partnerVideoRef.current.volume);
          }, 1000);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate to peer");
          socketRef.current.emit("iceCandidate", {
            to: activeUser._id,
            candidate: event.candidate
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketRef.current.emit("callUser", {
        to: activeUser._id,
        from: currentUser._id,
        signalData: offer,
        callType: type
      });

      peerRef.current = pc;

    } catch (err) {
      console.error("Media error:", err);
      toast.error("Failed to access camera/microphone");
      setCallType(null);
    }
  };

  const answerCall = async () => {
    setCallAccepted(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });

      setStream(mediaStream);
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = mediaStream;
      }

      console.log("=== Local media stream captured ===");
      console.log("Local audio tracks:", mediaStream.getAudioTracks());
      console.log("Audio enabled:", mediaStream.getAudioTracks()[0]?.enabled);
      console.log("Audio settings:", mediaStream.getAudioTracks()[0]?.getSettings());

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      });

      mediaStream.getTracks().forEach(track => {
        pc.addTrack(track, mediaStream);
      });

      pc.ontrack = (event) => {
        console.log("=== RECEIVER: Received remote stream ===");
        console.log("Remote stream:", event.streams[0]);
        console.log("Remote audio tracks:", event.streams[0].getAudioTracks());
        console.log("Remote video tracks:", event.streams[0].getVideoTracks());
        console.log("Audio track enabled:", event.streams[0].getAudioTracks()[0]?.enabled);
        console.log("Audio track muted:", event.streams[0].getAudioTracks()[0]?.muted);

        if (partnerVideoRef.current && event.streams[0]) {
          partnerVideoRef.current.srcObject = event.streams[0];
          console.log("Stream assigned to video element");

          setTimeout(() => {
            console.log("Partner video element muted:", partnerVideoRef.current.muted);
            console.log("Partner video element volume:", partnerVideoRef.current.volume);
          }, 1000);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate to peer");
          socketRef.current.emit("iceCandidate", {
            to: incomingCall._id,
            candidate: event.candidate
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };

      await pc.setRemoteDescription(new RTCSessionDescription(callerSignal));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit("answerCall", {
        to: incomingCall._id,
        signalData: answer
      });

      peerRef.current = pc;

    } catch (err) {
      console.error("Media error:", err);
      toast.error("Failed to access camera/microphone");
      endCall();
    }
  };

  const rejectCall = () => {
    if (socketRef.current && incomingCall) {
      socketRef.current.emit("rejectCall", { to: incomingCall._id });
    }
    setIncomingCall(null);
    setCallerSignal(null);
    setCallType(null);
  };

  const endCall = () => {
    if (activeUser && socketRef.current) {
      socketRef.current.emit("endCall", { to: activeUser._id });
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    if (peerRef.current) {
      peerRef.current.close();
    }

    setStream(null);
    setCallAccepted(false);
    setIncomingCall(null);
    setCallerSignal(null);
    setCallType(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="flex h-screen overflow-hidden text-white">


      {/* ===================== SIDEBAR ===================== */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40
  w-full md:w-80 bg-gray-900 border-r border-gray-800
  flex flex-col transition-transform duration-300
  ${!showUserList ? "-translate-x-full md:translate-x-0" : "translate-x-0"}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
          <div
            onClick={() => navigate("/edit-profile")}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold cursor-pointer"
          >
            {currentUser?.Username?.[0] || "U"}
          </div>

          <div className="flex-1">
            <p className="font-semibold">
              {currentUser?.Username || "User"}
            </p>
            <p className="text-xs text-green-400">Online</p>
          </div>

          {/* Add Friend */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-lg hover:bg-gray-800 text-xl"
            title="Add Friend"
          >
            +
          </button>

          {/* Settings */}
          <div ref={settingsMenuRef} className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 rounded-lg hover:bg-gray-800"
            >
              <Settings size={18} />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => {
                    navigate("/edit-profile");
                    setShowSettingsMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 flex gap-2 items-center"
                >
                  <User size={16} /> Edit Profile
                </button>

                {currentUser?.role === "Admin" && (
                  <button
                    onClick={() => {
                      navigate("/admin");
                      setShowSettingsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-700 flex gap-2 items-center"
                  >
                    <Settings size={16} /> Admin Panel
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-red-600 flex gap-2 items-center text-red-400"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ADD FRIEND SEARCH PANEL */}
        {showSearch && (
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-900">
            <input
              type="text"
              placeholder="Search users by username..."
              onChange={(e) => searchUsers(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 outline-none text-sm mb-3"
              autoFocus
            />

            {searchResults.length === 0 ? (
              <p className="text-sm text-gray-500 text-center">
                No users found
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((u) => {
                  const alreadyFriend = friends.some(f => f._id === u._id);
                  const alreadySent = sentRequests.some(r => r.receiver?._id === u._id);

                  return (
                    <div
                      key={u._id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-semibold">
                          {u.Username[0]}
                        </div>
                        <span className="text-sm">{u.Username}</span>
                      </div>

                      {alreadyFriend ? (
                        <span className="text-xs text-green-400">Friend</span>
                      ) : alreadySent ? (
                        <span className="text-xs text-yellow-400">Requested</span>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(u._id)}
                          className="text-xs px-3 py-1 bg-blue-600 rounded-full hover:bg-blue-700"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => {
                setShowSearch(false);
                setSearchResults([]);
              }}
              className="mt-3 w-full text-xs text-gray-400 hover:underline"
            >
              Close
            </button>
          </div>
        )}


        {/* Search Friends */}
        <div className="p-3">
          <input
            type="text"
            placeholder="Search friends"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 outline-none text-sm"
          />
        </div>

        {/* FRIEND REQUESTS */}
        {pendingRequests.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-800 bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Friend Requests
            </h3>

            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-semibold">
                      {req.sender.Username[0]}
                    </div>
                    <span className="text-sm">{req.sender.Username}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(req._id, req.sender)}
                      className="px-3 py-1 text-xs bg-green-600 rounded hover:bg-green-700"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => rejectFriendRequest(req._id, req.sender._id)}
                      className="px-3 py-1 text-xs bg-red-600 rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          {filteredFriends.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p>No friends yet</p>
              <p className="text-sm">Add friends to start chatting</p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <div
                key={friend._id}
                className="relative flex items-center gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer"
                onClick={(e) => {
                  if (ShowfrndMenu) return;
                  loadPrivateChat(friend);
                }}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-semibold">
                    {friend.Username[0]}
                  </div>

                  {onlineUsers.includes(friend._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium">{friend.Username}</p>
                  <p className="text-xs text-gray-400">
                    {blockedUser.includes(friend._id)
                      ? "Blocked"
                      : onlineUsers.includes(friend._id)
                        ? "Online"
                        : "Offline"}
                  </p>
                </div>

                {/* Friend Menu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowfrndMenu(
                      ShowfrndMenu === friend._id ? null : friend._id
                    );
                  }}
                  className="p-2 rounded hover:bg-gray-700"
                >
                  <MoreVertical size={18} />
                </button>

                {ShowfrndMenu === friend._id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-4 top-14 bg-gray-800 rounded-lg shadow-xl z-[100]"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        unfriendUser(friend._id);
                        setShowfrndMenu(null);
                      }}
                      className="px-4 py-2 text-red-400 hover:bg-gray-700 w-full text-left"
                    >
                      Remove Friend
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {/* ===================== END SIDEBAR ===================== */}
      {/* ===================== MAIN CHAT ===================== */}
      <div className="flex-1 flex flex-col bg-gray-950">
        {!activeUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Start a New Chat</h2>
              <p>Select a friend from the sidebar</p>
              {friends.length === 0 && (
                <p className="text-sm mt-2">
                  Add friends using the + button
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
              {!showUserList && (
                <button
                  className="md:hidden text-xl"
                  onClick={() => setShowUserList(true)}
                >
                  ←
                </button>
              )}

              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-semibold">
                {activeUser.Username[0]}
              </div>

              <div className="flex-1">
                <p className="font-semibold">
                  {activeUser.Username}
                  {blockedUser.includes(activeUser._id) && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-red-600 rounded">
                      Blocked
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {blockedUser.includes(activeUser._id)
                    ? "You blocked this user"
                    : onlineUsers.includes(activeUser._id)
                      ? "Online"
                      : "Offline"}
                </p>
              </div>

              {/* Chat Menu */}
              <div className="relative" ref={chatMenuRef}>
                <button
                  onClick={() => setShowChatMenu(!ShowChatMenu)}
                  className="p-2 rounded hover:bg-gray-800"
                >
                  <MoreVertical size={18} />
                </button>

                {ShowChatMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-50">
                    {blockedUser.includes(activeUser._id) ? (
                      <button
                        onClick={() => UnblockUser(activeUser._id)}
                        className="w-full px-4 py-2 hover:bg-gray-700 flex gap-2 items-center"
                      >
                        <UserX size={16} /> Unblock User
                      </button>
                    ) : (
                      <button
                        onClick={() => BlockUser(activeUser._id)}
                        className="w-full px-4 py-2 hover:bg-gray-700 flex gap-2 items-center"
                      >
                        <UserX size={16} /> Block User
                      </button>
                    )}

                    <button
                      onClick={ClearChat}
                      className="w-full px-4 py-2 hover:bg-gray-700 flex gap-2 items-center text-red-400"
                    >
                      <Trash2 size={16} /> Clear Chat
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {privateMessage.length === 0 ? (
                <p className="text-center text-gray-500 mt-10">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                privateMessage.map((msg, index) => (
                  <MessageItem
                    key={msg._id || index}
                    message={msg}
                    currentUser={currentUser}
                    onMessageUpdate={(updatedMsg) => {
                      setPrivateMessage(prev =>
                        prev.map(m =>
                          m._id === updatedMsg._id ? updatedMsg : m
                        )
                      );
                    }}
                    onMessageDelete={(messageId) => {
                      setPrivateMessage(prev =>
                        prev.filter(m => m._id !== messageId)
                      );
                    }}
                  />
                ))
              )}

              {typingPrivate.length > 0 && (
                <div className="text-sm text-gray-400">
                  {typingPrivate.join(", ")} typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-800 bg-gray-900 px-3 py-2">
              {blockedUser.includes(activeUser._id) ? (
                <div className="text-center text-red-400 py-3">
                  You blocked this user. Unblock to send messages.
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    onClick={triggerFileUpload}
                    disabled={isUploading || isRecording}
                    className="p-2 rounded hover:bg-gray-800"
                  >
                    📎
                  </button>

                  <input
                    type="text"
                    placeholder={
                      isRecording
                        ? "Recording voice..."
                        : isUploading
                          ? "Uploading..."
                          : "Type a message"
                    }
                    value={message}
                    onChange={handleInput}
                    onKeyPress={handleKeyPress}
                    disabled={isUploading || isRecording}
                    className="flex-1 px-4 py-2 rounded-full bg-gray-800 outline-none text-sm"
                  />

                  <div className="relative" ref={emojiPickerRef}>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 rounded hover:bg-gray-800"
                      disabled={isRecording}
                    >
                      😊
                    </button>

                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 z-50">
                        <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          width={300}
                          height={350}
                          theme="dark"
                          searchDisabled
                          skinTonesDisabled
                          previewConfig={{ showPreview: false }}
                        />
                      </div>
                    )}
                  </div>

                  {message.trim() ? (
                    <button
                      onClick={sendMessage}
                      disabled={isUploading || isRecording}
                      className="px-4 py-2 bg-blue-600 rounded-full"
                    >
                      ➤
                    </button>
                  ) : (
                    <button
                      onClick={handleMicClick}
                      disabled={isUploading}
                      className={`p-2 rounded-full ${isRecording ? "bg-red-600" : "hover:bg-gray-800"
                        }`}
                    >
                      <Mic size={18} />
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={leavePrivateChat}
                className="mt-2 text-xs text-gray-400 hover:underline"
              >
                Back to chats
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

