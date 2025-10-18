import axios from "axios";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import { Authcntxt } from "../context/authcontext";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { MoreVertical, UserX, Trash2, Settings, LogOut, User, Mic, Play, Pause } from 'lucide-react';
import MessageItem from "./MessageItem";
import "react-toastify/dist/ReactToastify.css";
import EmojiPicker from 'emoji-picker-react';
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

  // Voice message playback states
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioDurations, setAudioDurations] = useState({});
  const [audioProgress, setAudioProgress] = useState({});
  const audioRefs = useRef({});
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef(null);

  const { logout, user } = useContext(Authcntxt);

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
  const [blockedUser, setBlockedUser] = useState([]);
  const chatMenuRef = useRef(null);

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
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



  const renderMessage = (msg) => {
    const isFile = msg.fileUrl;
    const isImage = isFile && msg.fileType?.startsWith('image/');
    const isVoice = msg.isVoiceMessage || (msg.fileType && (msg.fileType.includes('audio') || msg.fileName?.includes('voice-')));
    const isCurrentUser = msg.sender?.Username === currentUser?.Username;

    return (
      <div className={`message-bubble ${isCurrentUser ? 'sent' : 'received'}`}>
        {isFile ? (
          <div className="file-message">
            {isImage ? (
              <div className="image-preview">
                <img
                  src={`${SERVER_URL}${msg.fileUrl}`}
                  alt={msg.fileName}
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(`${SERVER_URL}${msg.fileUrl}`, '_blank')}
                />
              </div>
            ) : isVoice ? (
              <div className="voice-message" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem',
                minWidth: '200px'
              }}>
                <button
                  onClick={() => toggleAudioPlayback(msg._id, msg.fileUrl)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white'
                  }}
                >
                  {playingAudio === msg._id ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{
                    height: '4px',
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginBottom: '0.25rem'
                  }}>
                    <div style={{
                      height: '100%',
                      background: 'white',
                      width: `${audioDurations[msg._id] ? (audioProgress[msg._id] / audioDurations[msg._id]) * 100 : 0}%`,
                      transition: 'width 0.1s linear'
                    }}></div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                    {playingAudio === msg._id
                      ? formatAudioTime(audioProgress[msg._id])
                      : formatAudioTime(audioDurations[msg._id] || 0)}
                  </div>
                </div>

                <Mic size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </div>
            ) : (
              <div className="file-info">
                <div className="file-icon">📄</div>
                <div className="file-details">
                  <div className="file-name">{msg.fileName}</div>
                  <div className="file-size">{formatFileSize(msg.fileSize)}</div>
                </div>
                <button
                  className="download-btn"
                  onClick={() => window.open(`${SERVER_URL}${msg.fileUrl}`, '_blank')}
                >
                  Download
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="message-text">{msg.text}</p>
        )}

        <div className="message-time">
          {formatTime(msg.createdAt || msg.timestamp || new Date())}
        </div>
      </div>
    );
  };

  const filteredFriends = friends.filter(friend =>
    friend.Username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="whatsapp-container">
      {notifications.map((notif, index) => (
        <div key={index} className="browser-notification" onClick={() => {
          const sender = friends.find(f => f._id === notif.sender._id);
          if (sender) loadPrivateChat(sender);
          setNotifications(prev => prev.filter(n => n !== notif));
        }}>
          <div className="notification-header">
            <div className="notification-avatar">
              {notif.sender.profilePicture ? (
                <img src={`${SERVER_URL}${notif.sender.profilePicture}`} alt={notif.sender.Username} />
              ) : (
                notif.sender.Username[0]
              )}
            </div>
            <div className="notification-title">Chatify</div>
          </div>
          <div className="notification-body">
            <strong>{notif.sender.Username}:</strong> {notif.message}
          </div>
        </div>
      ))}

      <div className={`sidebar ${!showUserList ? 'hidden' : ''}`}>
        <div className="sidebar-header">
          <div className="profile-pic" onClick={() => navigate('/edit-profile')}>
            {currentUser?.profilePicture ? (
              <img
                src={currentUser.profilePicture.startsWith('http')
                  ? currentUser.profilePicture
                  : `${SERVER_URL}${currentUser.profilePicture}`
                }
                alt={currentUser.Username}
              />
            ) : (
              currentUser?.Username?.[0] || 'U'
            )}
          </div>
          <div className="user-info">
            <h4 className="user-name">{currentUser?.Username || 'User'}</h4>
            <p className="user-status">Online</p>
          </div>
          <button
            className="chat-actions-btn"
            onClick={() => setShowSearch(!showSearch)}
            title="Add Friend"
            style={{
              color: 'white',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
          >
            +
          </button>
          <div ref={settingsMenuRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="chat-actions-btn"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              title="Settings"
              style={{
                color: 'white',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Settings size={20} />
            </button>

            {showSettingsMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                minWidth: '180px',
                background: '#2a2a2a',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 9999,
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => {
                    navigate('/edit-profile');
                    setShowSettingsMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <User size={18} />
                  Edit Profile
                </button>

                {currentUser?.role === 'Admin' && (
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setShowSettingsMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Settings size={18} />
                    Admin Panel
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {showSearch && (
          <div className="search-panel">
            <input
              type="text"
              placeholder="Search users..."
              className="search-input"
              onChange={(e) => searchUsers(e.target.value)}
            />
            <div className="search-results">
              {searchResults.map(user => {
                const isAlreadyFriend = friends.some(f => f._id === user._id);
                const requestSent = sentRequests.some(r => r.receiver._id === user._id);

                return (
                  <div key={user._id} className="search-result-item">
                    <div className="user-avatar">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture.startsWith('http')
                            ? user.profilePicture
                            : `${SERVER_URL}${user.profilePicture}`
                          }
                          alt={user.Username}
                        />
                      ) : (
                        user.Username[0]
                      )}
                    </div>
                    <span>{user.Username}</span>
                    {isAlreadyFriend ? (
                      <button className="btn-disabled" disabled>Friends</button>
                    ) : requestSent ? (
                      <button className="btn-disabled" disabled>Sent</button>
                    ) : (
                      <button
                        className="btn-add"
                        onClick={() => sendFriendRequest(user._id)}
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div className="friend-requests">
            <h4>Friend Requests ({pendingRequests.length})</h4>
            {pendingRequests.map(req => (
              <div key={req._id} className="request-item">
                <div className="user-avatar">
                  {req.sender.profilePicture ? (
                    <img
                      src={req.sender.profilePicture.startsWith('http')
                        ? req.sender.profilePicture
                        : `${SERVER_URL}${req.sender.profilePicture}`
                      }
                      alt={req.sender.Username}
                    />
                  ) : (
                    req.sender.Username[0]
                  )}
                </div>
                <div className="request-info">
                  <span>{req.sender.Username}</span>
                  <div className="request-actions">
                    <button
                      className="btn-accept"
                      onClick={() => acceptFriendRequest(req._id, req.sender)}
                    >
                      Accept
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => rejectFriendRequest(req._id, req.sender._id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="search-container">
          <input
            type="text"
            placeholder="Search friends"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="users-list">
          {filteredFriends.length === 0 ? (
            <div className="no-friends">
              <p>No friends yet</p>
              <p>Add friends to start chatting!</p>
            </div>
          ) : (
            filteredFriends.map(friend => (
              <div key={friend._id} style={{ position: 'relative' }}>
                <div
                  className="user-item"
                  onClick={() => loadPrivateChat(friend)}
                >
                  <div className="user-avatar">
                    {friend.profilePicture ? (
                      <img
                        src={friend.profilePicture.startsWith('http')
                          ? friend.profilePicture
                          : `${SERVER_URL}${friend.profilePicture}`
                        }
                        alt={friend.Username}
                      />
                    ) : (
                      friend.Username[0]
                    )}
                    {onlineUsers.includes(friend._id) && (
                      <div className="online-indicator"></div>
                    )}
                  </div>
                  <div className="user-info">
                    <h4 className="user-name">{friend.Username}</h4>
                    <p className="user-status">
                      {blockedUser.includes(friend._id)
                        ? "Blocked"
                        : onlineUsers.includes(friend._id) ? "Online" : "Offline"
                      }
                    </p>
                  </div>
                </div>
                <button
                  className="btn-unfriend"
                  onClick={(e) => {
                    e.stopPropagation();
                    unfriendUser(friend._id);
                  }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem'
                  }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="main-chat">
        {!activeUser ? (
          <div className="no-chat-selected">
            <div className="empty-state">
              <h2>Start a New Chat</h2>
              <p>Select a friend from the sidebar to start messaging</p>
              {friends.length === 0 && (
                <p>Add friends using the + button to begin chatting!</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              {!showUserList && (
                <button
                  className="back-btn"
                  onClick={() => setShowUserList(true)}
                >
                  ←
                </button>
              )}

              <div className="profile-pic">
                {activeUser.profilePicture ? (
                  <img
                    src={activeUser.profilePicture.startsWith('http')
                      ? activeUser.profilePicture
                      : `${SERVER_URL}${activeUser.profilePicture}`
                    }
                    alt={activeUser.Username}
                  />
                ) : (
                  activeUser.Username[0]
                )}
              </div>

              <div className="chat-info">
                <h3 className="chat-name">
                  {activeUser.Username}
                  {blockedUser.includes(activeUser._id) && (
                    <span style={{
                      marginLeft: '0.5rem',
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      background: 'var(--danger)',
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}>
                      Blocked
                    </span>
                  )}
                </h3>
                <p className="chat-status">
                  {blockedUser.includes(activeUser._id)
                    ? 'You blocked this user'
                    : onlineUsers.includes(activeUser._id) ? 'Online' : 'Offline'
                  }
                </p>
              </div>

              <div className="chat-actions" ref={chatMenuRef} style={{ position: 'relative' }}>
                <button onClick={() => setShowChatMenu(!ShowChatMenu)}>
                  <MoreVertical size={20} />
                </button>

                {ShowChatMenu && (
                  <div className="options-menu menu-right" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    minWidth: '180px'
                  }}>
                    {blockedUser.includes(activeUser._id) ? (
                      <button onClick={() => UnblockUser(activeUser._id)}>
                        <UserX size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                        Unblock User
                      </button>
                    ) : (
                      <button onClick={() => BlockUser(activeUser._id)}>
                        <UserX size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                        Block User
                      </button>
                    )}
                    <button onClick={ClearChat}>
                      <Trash2 size={16} style={{ marginRight: '0.5rem', display: 'inline' }} />
                      Clear Chat
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="messages-area">
              {privateMessage.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                privateMessage.map((msg, index) => (
                  <MessageItem
                    key={msg._id || index}
                    message={msg}
                    currentUser={currentUser}
                    onMessageUpdate={(updatedMsg) => {
                      setPrivateMessage(prev => prev.map(m =>
                        m._id === updatedMsg._id ? updatedMsg : m
                      ));
                    }}
                    onMessageDelete={(messageId) => {
                      setPrivateMessage(prev => prev.filter(m => m._id !== messageId));
                    }}
                  />
                ))
              )}

              {isUploading && (
                <div className="upload-progress">
                  <div className="upload-info">
                    <span>Uploading... {uploadProgress}%</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {typingPrivate.length > 0 && (
                <div className="typing-indicator">
                  <div className="typing-bubble">
                    <div className="typing-dots">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-area">
              {blockedUser.includes(activeUser._id) ? (
                <div style={{
                  padding: '1rem',
                  textAlign: 'center',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius)',
                  margin: '1rem'
                }}>
                  <p style={{ color: 'var(--danger)', fontWeight: '500' }}>
                    You have blocked this user. Unblock to send messages.
                  </p>
                </div>
              ) : (
                <>
                  {/* Recording Indicator */}
                  {isRecording && (
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: '8px',
                      margin: '0 1rem 0.5rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--danger)',
                        fontWeight: '500'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: 'var(--danger)',
                          animation: 'blink 1s ease-in-out infinite'
                        }}></div>
                        Recording...
                      </div>
                      <div style={{
                        marginLeft: 'auto',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--danger)',
                        fontFamily: 'monospace'
                      }}>
                        {formatRecordingTime(recordingDuration)}
                      </div>
                    </div>
                  )}

                  <div className="message-input-container">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      accept="*/*"
                    />
                    <button
                      className="input-action-btn"
                      onClick={triggerFileUpload}
                      disabled={isUploading || isRecording}
                      title="Upload file"
                    >
                      {isUploading ? '⏳' : '📎'}
                    </button>

                    <input
                      type="text"
                      placeholder={isRecording ? "Recording voice message..." : isUploading ? "Uploading file..." : "Type a message"}
                      value={message}
                      onChange={handleInput}
                      onKeyPress={handleKeyPress}
                      className="message-input"
                      disabled={isUploading || isRecording}
                    />

                    <div ref={emojiPickerRef} style={{ position: 'relative' }}>
                      <button
                        className="input-action-btn"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        type="button"
                        disabled={isRecording}
                      >
                        😊
                      </button>

                      {showEmojiPicker && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          right: 0,
                          marginBottom: '0.5rem',
                          zIndex: 1000
                        }}>
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            width={350}
                            height={400}
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
                        className="send-btn"
                        disabled={isUploading || isRecording}
                      >
                        ➤
                      </button>
                    ) : (
                      <button
                        className="input-action-btn"
                        onClick={handleMicClick}
                        disabled={isUploading}
                        style={{
                          background: isRecording ? 'var(--danger)' : 'transparent',
                          color: isRecording ? 'white' : 'var(--text-primary)'
                        }}
                        title={isRecording ? "Click to send" : "Record voice message"}
                      >
                        <Mic size={20} />
                      </button>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={leavePrivateChat}
                className="leave-btn"
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