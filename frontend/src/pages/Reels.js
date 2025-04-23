import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, CircularProgress, Fab, Tooltip, Snackbar, Alert,
  Card, Avatar, IconButton
} from '@mui/material';
import ProfilePicture from '../components/common/ProfilePicture';
import { getProfilePictureUrl } from '../utils/profilePictureHelper';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  ChatBubbleOutline as CommentIcon
} from '@mui/icons-material';

// Import custom components
import ReelCard from '../components/Reels/ReelCard';
import ReelControls from '../components/Reels/ReelControls';
import FilterDrawer from '../components/Reels/FilterDrawer';
import CommentDialog from '../components/common/CommentDialog';
import { useAuth } from '../context/AuthContext';
import { reelService, userService, groupService } from '../services/api';
import socketService from '../services/socketService';
import { Link, useNavigate, useParams } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';
import { useSwipeable } from 'react-swipeable';

const Reels = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id: reelId } = useParams(); // Get reel ID from URL if available
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const videoRef = useRef(null);

  // UI states
  const [isMuted, setIsMuted] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0 = For You, 1 = Following
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showRelatedReels, setShowRelatedReels] = useState(true);

  // Related reels
  const [relatedReels, setRelatedReels] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // User stats
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loadingUserStats, setLoadingUserStats] = useState(false);

  // Comment related states
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Fetch reels from API
  const fetchReels = async () => {
    try {
      setLoading(true);

      // Determine which tab to fetch from
      const tabValue = activeTab === 0 ? 'for-you' : 'following';

      const params = {
        page,
        limit: 10,
        tab: tabValue
      };

      console.log(`Fetching reels with params:`, params);

      const response = await reelService.getReels(params);

      // Process the response
      if (!response.data || !response.data.reels || response.data.reels.length === 0) {
        console.log('No reels returned from API');
        setHasMore(false);
      } else {
        console.log(`Received ${response.data.reels.length} reels from API`);

        // Process reels to ensure they have all required fields
        const processedReels = response.data.reels.map(reel => {
          // Calculate likes count
          const likesCount = typeof reel.likesCount === 'number' ? reel.likesCount :
                           (Array.isArray(reel.likes) ? reel.likes.length : 0);

          // Calculate comments count
          const commentsCount = typeof reel.commentsCount === 'number' ? reel.commentsCount :
                              (Array.isArray(reel.comments) ? reel.comments.length : 0);

          // Ensure user object is properly formatted
          const user = reel.user ? {
            _id: reel.user._id || 'unknown',
            username: reel.user.username || 'unknown',
            avatar: reel.user.avatar || null,
            fullName: reel.user.fullName || ''
          } : {
            _id: 'unknown',
            username: 'unknown',
            avatar: null,
            fullName: ''
          };

          // Ensure video URLs are properly formatted
          let videoUrl = reel.video;
          let videoWebmUrl = reel.videoWebm;
          let thumbnailUrl = reel.thumbnail;

          // If video URL is relative, make it absolute
          if (videoUrl && !videoUrl.startsWith('http') && !videoUrl.startsWith('blob:')) {
            videoUrl = `${process.env.REACT_APP_API_URL || ''}${videoUrl}`;
          }

          // If webm URL is relative, make it absolute
          if (videoWebmUrl && !videoWebmUrl.startsWith('http') && !videoWebmUrl.startsWith('blob:')) {
            videoWebmUrl = `${process.env.REACT_APP_API_URL || ''}${videoWebmUrl}`;
          }

          // If thumbnail URL is relative, make it absolute
          if (thumbnailUrl && !thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('blob:')) {
            thumbnailUrl = `${process.env.REACT_APP_API_URL || ''}${thumbnailUrl}`;
          }

          // Return processed reel
          return {
            ...reel,
            likesCount,
            commentsCount,
            user,
            isLiked: !!reel.isLiked,
            isSaved: !!reel.isSaved,
            // Ensure these fields exist for the UI as primitive values, not objects
            likes: likesCount,
            comments: commentsCount,
            shares: typeof reel.shares === 'number' ? reel.shares : 0,
            isBookmarked: !!reel.isSaved,
            // Update video URLs
            video: videoUrl,
            videoWebm: videoWebmUrl,
            thumbnail: thumbnailUrl
          };
        });

        setReels(prevReels => [...prevReels, ...processedReels]);
        setPage(prevPage => prevPage + 1);

        // Check if there are more reels to load
        const pagination = response.data.pagination;
        if (pagination) {
          setHasMore(pagination.page < pagination.pages);
        } else {
          // If no pagination info, assume there are more if we got a full page
          setHasMore(processedReels.length >= 10);
        }
      }
    } catch (error) {
      console.error('Error fetching reels:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load reels. Please try again.',
        severity: 'error'
      });
      setError('Failed to load reels. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch user stats (followers/following)
  const fetchUserStats = async () => {
    if (!currentUser) return;

    try {
      setLoadingUserStats(true);

      // Fetch followers
      const followersResponse = await userService.getFollowers(currentUser._id);
      if (followersResponse.data && followersResponse.data.followers) {
        setFollowers(followersResponse.data.followers);
        setFollowersCount(followersResponse.data.followers.length);
      }

      // Fetch following
      const followingResponse = await userService.getFollowing(currentUser._id);
      if (followingResponse.data && followingResponse.data.following) {
        setFollowing(followingResponse.data.following);
        setFollowingCount(followingResponse.data.following.length);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoadingUserStats(false);
    }
  };

  // Load more reels when user reaches the end
  const loadMoreReels = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchReels();
    }
  };

  // Fetch reels and user stats on component mount
  useEffect(() => {
    // Reset state when component mounts
    setReels([]);
    setPage(1);
    setHasMore(true);
    setActiveReelIndex(0);

    // Fetch reels
    fetchReels();

    // Fetch user stats if user is logged in
    if (currentUser) {
      fetchUserStats();
    }

    // Connect to socket for real-time updates
    const token = localStorage.getItem('token');
    if (token && socketService && typeof socketService.initializeSocket === 'function') {
      if (!socketService.getSocket || !socketService.getSocket()) {
        socketService.initializeSocket(token);
      }
    }

    // Listen for new reels if socket service is available
    let unsubscribeNewReel = () => {};
    let unsubscribeReelLiked = () => {};
    let unsubscribeReelComment = () => {};

    if (socketService && typeof socketService.subscribeToEvent === 'function') {
      unsubscribeNewReel = socketService.subscribeToEvent('new-reel', handleNewReel) || (() => {});
      unsubscribeReelLiked = socketService.subscribeToEvent('reel-liked', handleReelLiked) || (() => {});
      unsubscribeReelComment = socketService.subscribeToEvent('reel-comment', handleReelComment) || (() => {});
    }

    return () => {
      // Cleanup socket listeners
      if (typeof unsubscribeNewReel === 'function') unsubscribeNewReel();
      if (typeof unsubscribeReelLiked === 'function') unsubscribeReelLiked();
      if (typeof unsubscribeReelComment === 'function') unsubscribeReelComment();
    };
  }, [currentUser]);

  // If reelId is provided, find and set the active reel
  useEffect(() => {
    if (reelId && reels.length > 0) {
      const index = reels.findIndex(reel => reel._id === reelId);
      if (index !== -1) {
        setActiveReelIndex(index);
        // Fetch related reels when active reel changes
        fetchRelatedReels(reels[index]);
      }
    }
  }, [reelId, reels]);

  // Fetch related reels when active reel changes
  useEffect(() => {
    if (reels.length > 0 && activeReelIndex >= 0 && activeReelIndex < reels.length) {
      fetchRelatedReels(reels[activeReelIndex]);
    }
  }, [activeReelIndex]);

  // Fetch related reels based on current reel
  const fetchRelatedReels = async (currentReel) => {
    if (!currentReel) return;

    try {
      setLoadingRelated(true);

      // Get related reels based on hashtags, user, or content
      const params = {
        limit: 5,
        excludeId: currentReel._id
      };

      // If the reel has hashtags, use them for related content
      if (currentReel.hashtags && currentReel.hashtags.length > 0) {
        params.hashtags = currentReel.hashtags.join(',');
      }

      // Get reels from the same user
      const userReelsResponse = await reelService.getUserReels(currentReel.user._id, { limit: 2, excludeId: currentReel._id });
      let userReels = [];
      if (userReelsResponse.data && userReelsResponse.data.reels) {
        userReels = userReelsResponse.data.reels;
      }

      // Get trending reels
      const trendingResponse = await reelService.getReels({ page: 1, limit: 5, sort: 'trending', excludeId: currentReel._id });
      let trendingReels = [];
      if (trendingResponse.data && trendingResponse.data.reels) {
        trendingReels = trendingResponse.data.reels;
      }

      // Combine and process the related reels
      const combinedReels = [...userReels, ...trendingReels];

      // Remove duplicates
      const uniqueReels = combinedReels.filter((reel, index, self) =>
        index === self.findIndex(r => r._id === reel._id)
      );

      // Process reels to ensure they have all required fields
      const processedReels = uniqueReels.map(reel => {
        // Calculate likes count
        const likesCount = typeof reel.likesCount === 'number' ? reel.likesCount :
                         (Array.isArray(reel.likes) ? reel.likes.length : 0);

        // Calculate comments count
        const commentsCount = typeof reel.commentsCount === 'number' ? reel.commentsCount :
                            (Array.isArray(reel.comments) ? reel.comments.length : 0);

        // Ensure user object is properly formatted
        const user = reel.user ? {
          _id: reel.user._id || 'unknown',
          username: reel.user.username || 'unknown',
          avatar: reel.user.avatar || null,
          fullName: reel.user.fullName || ''
        } : {
          _id: 'unknown',
          username: 'unknown',
          avatar: null,
          fullName: ''
        };

        // Ensure video URLs are properly formatted
        let videoUrl = reel.video;
        let videoWebmUrl = reel.videoWebm;
        let thumbnailUrl = reel.thumbnail;

        // If video URL is relative, make it absolute
        if (videoUrl && !videoUrl.startsWith('http') && !videoUrl.startsWith('blob:')) {
          videoUrl = `${process.env.REACT_APP_API_URL || ''}${videoUrl}`;
        }

        // If webm URL is relative, make it absolute
        if (videoWebmUrl && !videoWebmUrl.startsWith('http') && !videoWebmUrl.startsWith('blob:')) {
          videoWebmUrl = `${process.env.REACT_APP_API_URL || ''}${videoWebmUrl}`;
        }

        // If thumbnail URL is relative, make it absolute
        if (thumbnailUrl && !thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('blob:')) {
          thumbnailUrl = `${process.env.REACT_APP_API_URL || ''}${thumbnailUrl}`;
        }

        // Return processed reel
        return {
          ...reel,
          likesCount,
          commentsCount,
          user,
          isLiked: !!reel.isLiked,
          isSaved: !!reel.isSaved,
          // Ensure these fields exist for the UI as primitive values, not objects
          likes: likesCount,
          comments: commentsCount,
          shares: typeof reel.shares === 'number' ? reel.shares : 0,
          isBookmarked: !!reel.isSaved,
          // Update video URLs
          video: videoUrl,
          videoWebm: videoWebmUrl,
          thumbnail: thumbnailUrl
        };
      });

      setRelatedReels(processedReels.slice(0, 5)); // Limit to 5 related reels
    } catch (error) {
      console.error('Error fetching related reels:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  // Play/pause video when active reel changes
  useEffect(() => {
    if (videoRef.current) {
      if (autoplay) {
        // Add a small delay to ensure the video element is fully initialized
        const playTimer = setTimeout(() => {
          console.log('Attempting to play video for reel index:', activeReelIndex);

          // First try to play with current mute settings
          videoRef.current.play().catch(error => {
            console.warn('Error playing video with current settings:', error);

            // If autoplay is blocked, mute the video and try again
            if (!isMuted) {
              console.log('Muting video and trying again');
              setIsMuted(true);

              // Small delay before trying again
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.muted = true;
                  videoRef.current.play().catch(e => {
                    console.error('Still cannot play even with muting:', e);

                    // Show a notification to the user
                    setSnackbar({
                      open: true,
                      message: 'Tap on the video to play',
                      severity: 'info'
                    });
                  });
                }
              }, 300);
            }
          });
        }, 200);

        return () => clearTimeout(playTimer);
      } else {
        console.log('Autoplay disabled, pausing video');
        videoRef.current.pause();
      }
    }
  }, [activeReelIndex, autoplay, isMuted]);

  // Handle new reel from socket
  const handleNewReel = (newReel) => {
    // Process the new reel to ensure it has all required fields
    // Calculate likes and comments counts
    const likesCount = typeof newReel.likesCount === 'number' ? newReel.likesCount :
                     (Array.isArray(newReel.likes) ? newReel.likes.length : 0);
    const commentsCount = typeof newReel.commentsCount === 'number' ? newReel.commentsCount :
                        (Array.isArray(newReel.comments) ? newReel.comments.length : 0);

    // Ensure user object is properly formatted
    const user = newReel.user ? {
      _id: newReel.user._id || 'unknown',
      username: newReel.user.username || 'unknown',
      avatar: newReel.user.avatar || null,
      fullName: newReel.user.fullName || ''
    } : {
      _id: 'unknown',
      username: 'unknown',
      avatar: null,
      fullName: ''
    };

    // Ensure video URLs are properly formatted
    let videoUrl = newReel.video;
    let videoWebmUrl = newReel.videoWebm;
    let thumbnailUrl = newReel.thumbnail;

    // If video URL is relative, make it absolute
    if (videoUrl && !videoUrl.startsWith('http') && !videoUrl.startsWith('blob:')) {
      videoUrl = `${process.env.REACT_APP_API_URL || ''}${videoUrl}`;
    }

    // If webm URL is relative, make it absolute
    if (videoWebmUrl && !videoWebmUrl.startsWith('http') && !videoWebmUrl.startsWith('blob:')) {
      videoWebmUrl = `${process.env.REACT_APP_API_URL || ''}${videoWebmUrl}`;
    }

    // If thumbnail URL is relative, make it absolute
    if (thumbnailUrl && !thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('blob:')) {
      thumbnailUrl = `${process.env.REACT_APP_API_URL || ''}${thumbnailUrl}`;
    }

    const processedReel = {
      ...newReel,
      likesCount,
      commentsCount,
      user,
      isLiked: !!newReel.isLiked,
      isBookmarked: !!newReel.isSaved,
      shares: typeof newReel.shares === 'number' ? newReel.shares : 0,
      // Update video URLs
      video: videoUrl,
      videoWebm: videoWebmUrl,
      thumbnail: thumbnailUrl
    };

    setReels(prevReels => [processedReel, ...prevReels]);
  };

  // Handle reel liked from socket
  const handleReelLiked = (data) => {
    setReels(prevReels =>
      prevReels.map(reel =>
        reel._id === data.reelId
          ? { ...reel, likesCount: data.likesCount }
          : reel
      )
    );
  };

  // Handle reel comment from socket
  const handleReelComment = (data) => {
    setReels(prevReels =>
      prevReels.map(reel =>
        reel._id === data.reelId
          ? { ...reel, commentsCount: data.commentsCount }
          : reel
      )
    );

    // If comment dialog is open for this reel, update comments
    if (commentDialogOpen && selectedReel && selectedReel._id === data.reelId) {
      setComments(prevComments => [data.comment, ...prevComments]);
    }
  };

  // Handle like/unlike reel
  const handleLike = async (reel) => {
    // Check if user is authenticated
    if (!currentUser) {
      setSnackbar({
        open: true,
        message: 'Please log in to like reels',
        severity: 'info'
      });
      return;
    }

    try {
      const isLiked = reel.isLiked;
      const reelId = reel._id;

      if (!reelId) {
        console.error('Invalid reel ID:', reelId);
        setSnackbar({
          open: true,
          message: 'Invalid reel. Please try again.',
          severity: 'error'
        });
        return;
      }

      console.log(`Attempting to ${isLiked ? 'unlike' : 'like'} reel with ID:`, reelId);

      // Optimistic update
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId
            ? {
                ...r,
                isLiked: !isLiked,
                likesCount: isLiked ? r.likesCount - 1 : r.likesCount + 1
              }
            : r
        )
      );

      // Get token to ensure it's available
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // API call with proper error handling
      let response;
      if (isLiked) {
        response = await reelService.unlikeReel(reelId);
      } else {
        response = await reelService.likeReel(reelId);
      }

      console.log(`Reel ${isLiked ? 'unliked' : 'liked'} successfully:`, response);
    } catch (error) {
      console.error('Error liking/unliking reel:', error);

      // Revert on error
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reel._id
            ? {
                ...r,
                isLiked: reel.isLiked,
                likesCount: reel.likesCount
              }
            : r
        )
      );

      // Provide more specific error message if available
      const errorMessage = error.response?.data?.message ||
                          error.friendlyMessage ||
                          'Failed to like/unlike reel. Please try again.';

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  // Handle opening comments dialog
  const handleOpenComments = async (reel) => {
    setSelectedReel(reel);
    setCommentDialogOpen(true);
    setCommentText('');
    setShowEmojiPicker(false);

    try {
      setLoadingComments(true);
      const response = await reelService.getReelComments(reel._id, { page: 1, limit: 20 });

      // Process comments to ensure they have all required fields
      const processedComments = (response.data.comments || []).map(comment => ({
        ...comment,
        likesCount: comment.likesCount || 0,
        isLiked: !!comment.isLiked,
        user: {
          ...comment.user,
          isFollowed: !!comment.user.isFollowed,
          isVerified: !!comment.user.isVerified
        },
        replies: (comment.replies || []).map(reply => ({
          ...reply,
          likesCount: reply.likesCount || 0,
          isLiked: !!reply.isLiked,
          user: {
            ...reply.user,
            isFollowed: !!reply.user.isFollowed,
            isVerified: !!reply.user.isVerified
          }
        }))
      }));

      setComments(processedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load comments. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoadingComments(false);
    }
  };

  // Handle sharing reel
  const handleShare = (reel) => {
    // Copy link to clipboard
    const reelUrl = `${window.location.origin}/reels/${reel._id}`;
    navigator.clipboard.writeText(reelUrl);

    setSnackbar({
      open: true,
      message: 'Link copied to clipboard!',
      severity: 'success'
    });
  };

  // This function was removed to fix duplicate declaration

  // Handle bookmarking reel
  const handleBookmark = async (reel) => {
    // Check if user is authenticated
    if (!currentUser) {
      setSnackbar({
        open: true,
        message: 'Please log in to save reels',
        severity: 'info'
      });
      return;
    }

    try {
      const isBookmarked = reel.isBookmarked;
      const reelId = reel._id;

      if (!reelId) {
        console.error('Invalid reel ID:', reelId);
        setSnackbar({
          open: true,
          message: 'Invalid reel. Please try again.',
          severity: 'error'
        });
        return;
      }

      console.log(`Attempting to ${isBookmarked ? 'unsave' : 'save'} reel with ID:`, reelId);

      // Optimistic update
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reelId
            ? { ...r, isBookmarked: !isBookmarked }
            : r
        )
      );

      // Get token to ensure it's available
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // API call with proper error handling
      let response;
      try {
        // First try the standard API endpoint
        if (isBookmarked) {
          response = await reelService.unsaveReel(reelId);
        } else {
          response = await reelService.saveReel(reelId);
        }
      } catch (primaryError) {
        console.log(`Primary ${isBookmarked ? 'unsave' : 'save'} endpoint failed, trying alternative:`, primaryError.message);

        // Try direct fetch as a fallback
        const backendPort = 60000;
        const result = await fetch(`http://localhost:${backendPort}/api/reels/${reelId}/${isBookmarked ? 'unsave' : 'save'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!result.ok) {
          throw new Error(`Direct fetch failed with status: ${result.status}`);
        }

        response = { data: await result.json() };
      }

      console.log(`Reel ${isBookmarked ? 'unsaved' : 'saved'} successfully:`, response);

      setSnackbar({
        open: true,
        message: isBookmarked ? 'Removed from saved items' : 'Saved to collection',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving/unsaving reel:', error);

      // Revert on error
      setReels(prevReels =>
        prevReels.map(r =>
          r._id === reel._id
            ? { ...r, isBookmarked: reel.isBookmarked }
            : r
        )
      );

      // Provide more specific error message if available
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          'Failed to save/unsave reel. Please try again.';

      setSnackbar({
        open: true,
        message: `Failed to save/unsave reel: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Handle more options menu
  const handleMoreOptions = (reel) => {
    // Check if the reel belongs to the current user
    const isOwner = currentUser && reel.user._id === currentUser._id;

    if (isOwner) {
      // Show options for owner (edit, delete, etc.)
      navigate(`/reels/${reel._id}/edit`);
    } else {
      // Show options for non-owner (report, etc.)
      setSnackbar({
        open: true,
        message: 'Report option is coming soon',
        severity: 'info'
      });
    }
  };

  // Handle video end
  const handleVideoEnd = () => {
    console.log('Video ended, current index:', activeReelIndex, 'total reels:', reels.length);

    // Move to next reel when current one ends
    if (activeReelIndex < reels.length - 1) {
      console.log('Moving to next reel');
      setActiveReelIndex(prevIndex => prevIndex + 1);

      // Show a brief notification
      setSnackbar({
        open: true,
        message: 'Playing next reel',
        severity: 'info'
      });

      // Auto-close the snackbar after 1 second
      setTimeout(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
      }, 1000);
    } else if (hasMore && !loadingMore) {
      console.log('Reached end of loaded reels, loading more');
      loadMoreReels();

      // Show loading notification
      setSnackbar({
        open: true,
        message: 'Loading more reels...',
        severity: 'info'
      });
    } else {
      // Loop back to first reel if autoplay is enabled
      if (autoplay) {
        console.log('Looping back to first reel');
        setActiveReelIndex(0);

        // Show notification
        setSnackbar({
          open: true,
          message: 'Starting from the beginning',
          severity: 'info'
        });

        // Auto-close the snackbar after 1.5 seconds
        setTimeout(() => {
          setSnackbar(prev => ({ ...prev, open: false }));
        }, 1500);
      } else {
        console.log('Reached end of reels and autoplay is disabled');
        // Show notification to user
        setSnackbar({
          open: true,
          message: 'You\'ve reached the end. Swipe up to see more reels.',
          severity: 'info'
        });
      }
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    console.log(`Tab changed to ${newValue}`);

    // Only proceed if the tab actually changed
    if (activeTab === newValue) return;

    setActiveTab(newValue);
    setReels([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setActiveReelIndex(0);

    // If switching to Following tab, ensure user is logged in
    if (newValue === 1 && !currentUser) {
      setSnackbar({
        open: true,
        message: 'Please log in to see reels from people you follow',
        severity: 'info'
      });
      // Switch back to For You tab if not logged in
      setActiveTab(0);
      fetchReels();
      return;
    }

    // Fetch reels based on selected tab
    fetchReels();
  };

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedReel || !selectedReel._id) return;

    // Store the comment text before clearing it for optimistic UI update
    const commentToAdd = commentText;

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticComment = {
      _id: tempId,
      text: commentToAdd,
      user: currentUser,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      isLiked: false,
      replies: [],
      isOptimistic: true // Flag to identify optimistic updates
    };

    // Add optimistic comment to the list
    setComments(prevComments => [
      optimisticComment,
      ...prevComments
    ]);

    // Update comment count in the reel optimistically
    setReels(prevReels =>
      prevReels.map(reel =>
        reel._id === selectedReel._id
          ? { ...reel, commentsCount: reel.commentsCount + 1 }
          : reel
      )
    );

    // Clear comment text immediately for better UX
    setCommentText('');
    setShowEmojiPicker(false);

    try {
      console.log(`Attempting to add comment to reel with ID: ${selectedReel._id}`);

      // Get token to ensure it's available
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Try multiple approaches to add the comment
      let response;
      try {
        // First try the standard API endpoint
        response = await reelService.addComment(selectedReel._id, { text: commentToAdd });
      } catch (primaryError) {
        console.log('Primary comment endpoint failed, trying alternative:', primaryError.message);

        // Try direct fetch as a fallback
        const backendPort = 60000;
        const result = await fetch(`http://localhost:${backendPort}/api/reels/${selectedReel._id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text: commentToAdd })
        });

        if (!result.ok) {
          throw new Error(`Direct fetch failed with status: ${result.status}`);
        }

        response = { data: await result.json() };
      }

      console.log('Comment added successfully:', response);

      // Replace optimistic comment with real one from server
      if (response.data && response.data.comment) {
        setComments(prevComments => prevComments.map(comment =>
          comment._id === tempId ? {
            ...response.data.comment,
            likesCount: 0,
            isLiked: false,
            replies: []
          } : comment
        ));
      }

      setSnackbar({
        open: true,
        message: 'Comment added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding comment:', error);

      // Remove optimistic comment on error
      setComments(prevComments => prevComments.filter(comment => comment._id !== tempId));

      // Revert comment count in the reel
      setReels(prevReels =>
        prevReels.map(reel =>
          reel._id === selectedReel._id
            ? { ...reel, commentsCount: reel.commentsCount - 1 }
            : reel
        )
      );

      // Restore the comment text so user doesn't lose their input
      setCommentText(commentToAdd);

      // Provide more specific error message if available
      const errorMessage = error.response?.data?.message ||
                          error.message ||
                          'Failed to add comment. Please try again.';

      setSnackbar({
        open: true,
        message: `Failed to add comment: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  // Handle replying to a comment
  const handleReplyToComment = async (parentComment, replyText) => {
    if (!replyText.trim()) return;

    try {
      // API call to add a reply
      const response = await reelService.replyToComment(selectedReel._id, parentComment._id, { text: replyText });

      // Update the comments list with the new reply
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment._id === parentComment._id || comment.id === parentComment.id) {
            // Add the new reply to this comment's replies
            return {
              ...comment,
              replies: [...(comment.replies || []), response.data.reply]
            };
          }
          return comment;
        })
      );

      setSnackbar({
        open: true,
        message: 'Reply added successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error replying to comment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add reply. Please try again.',
        severity: 'error'
      });
    }
  };

  // Handle liking a comment
  const handleLikeComment = async (comment) => {
    try {
      const isLiked = comment.isLiked;

      // Optimistic update
      setComments(prevComments =>
        prevComments.map(c => {
          if (c._id === comment._id || c.id === comment.id) {
            return {
              ...c,
              isLiked: !isLiked,
              likesCount: isLiked ? (c.likesCount - 1) : (c.likesCount + 1)
            };
          }
          // Check if it's a reply in any comment
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(reply => {
                if (reply._id === comment._id || reply.id === comment.id) {
                  return {
                    ...reply,
                    isLiked: !isLiked,
                    likesCount: isLiked ? (reply.likesCount - 1) : (reply.likesCount + 1)
                  };
                }
                return reply;
              })
            };
          }
          return c;
        })
      );

      // API call
      if (isLiked) {
        await reelService.unlikeComment(selectedReel._id, comment._id);
      } else {
        await reelService.likeComment(selectedReel._id, comment._id);
      }
    } catch (error) {
      console.error('Error liking/unliking comment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to like/unlike comment. Please try again.',
        severity: 'error'
      });
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      console.log('Pausing video');
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      console.log('Playing video');
      videoRef.current.play().catch(error => {
        console.warn('Error playing video:', error);
        // If autoplay is blocked, mute the video and try again
        if (!isMuted) {
          setIsMuted(true);
          videoRef.current.muted = true;
          videoRef.current.play().catch(e => {
            console.error('Still cannot play:', e);
          });
        }
      });
      setIsPlaying(true);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') {
        if (activeReelIndex > 0) {
          setActiveReelIndex(prevIndex => prevIndex - 1);
        }
      } else if (e.key === 'ArrowDown') {
        if (activeReelIndex < reels.length - 1) {
          setActiveReelIndex(prevIndex => prevIndex + 1);
        } else if (hasMore && !loadingMore) {
          loadMoreReels();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReelIndex, reels.length, hasMore, loadingMore]);

  // Handle swipe gestures
  const handlers = {
    onSwipedUp: () => {
      if (activeReelIndex < reels.length - 1) {
        setActiveReelIndex(prevIndex => prevIndex + 1);
      } else if (hasMore && !loadingMore) {
        loadMoreReels();
      }
    },
    onSwipedDown: () => {
      if (activeReelIndex > 0) {
        setActiveReelIndex(prevIndex => prevIndex - 1);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  };

  // Set up swipe handlers
  const swipeHandlers = useSwipeable(handlers);

  return (
    <Box
      {...swipeHandlers}
      sx={{
        height: '100vh',
        width: '100%',
        bgcolor: 'black',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' }
      }}
    >
      {loading && reels.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}
        >
          <CircularProgress color="primary" />
        </Box>
      ) : reels.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            p: 3
          }}
        >
          <Typography variant="h6" color="white" gutterBottom>
            No reels found
          </Typography>
          <Typography variant="body2" color="gray" align="center" sx={{ mb: 3 }}>
            Be the first to create a reel and share it with your followers!
          </Typography>
          <Tooltip title="Create New Reel" placement="top">
            <Fab
              color="primary"
              aria-label="create reel"
              onClick={() => navigate('/create?tab=reel')}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            height: '100%',
            width: '100%',
            position: 'relative'
          }}
        >
          {/* Reels */}
          {reels.map((reel, index) => (
            <ReelCard
              key={reel._id}
              reel={reel}
              isActive={index === activeReelIndex}
              isMuted={isMuted}
              selectedFilter={selectedFilter}
              onLike={() => handleLike(reel)}
              onComment={() => handleOpenComments(reel)}
              onShare={() => handleShare(reel)}
              onBookmark={() => handleBookmark(reel)}
              onMoreOptions={() => handleMoreOptions(reel)}
              onVideoEnd={handleVideoEnd}
              videoRef={index === activeReelIndex ? videoRef : null}
            />
          ))}

          {/* Controls */}
          <ReelControls
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            autoplay={autoplay}
            onToggleAutoplay={() => setAutoplay(!autoplay)}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            showTabs={!reelId}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            selectedFilter={selectedFilter}
          />

          {/* Create Button */}
          <Tooltip title="Create New Reel" placement="left">
            <Fab
              color="primary"
              aria-label="create reel"
              onClick={() => navigate('/create?tab=reel')}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>

          {/* Main Reels Container */}
          <Box
            sx={{
              flex: 1,
              height: '100%',
              position: 'relative'
            }}
          >
            {/* Followers/Following Info - Only show in Following tab */}
            {activeTab === 1 && currentUser && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 70,
                  right: 16,
                  zIndex: 10,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  borderRadius: 2,
                  p: 1,
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end'
                }}
              >
                <Typography variant="caption" sx={{ mb: 0.5 }}>
                  Following: {followingCount}
                </Typography>
                <Typography variant="caption">
                  Followers: {followersCount}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Related Reels Section - Only show on desktop */}
          {showRelatedReels && (
            <Box
              sx={{
                width: { xs: '100%', md: '320px' },
                height: '100%',
                bgcolor: 'rgba(0,0,0,0.8)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                p: 2,
                overflowY: 'auto'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="white">
                  Related Reels
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowRelatedReels(false)}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {loadingRelated ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                </Box>
              ) : relatedReels.length === 0 ? (
                <Typography variant="body2" color="gray" align="center" sx={{ mt: 2 }}>
                  No related reels found
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {relatedReels.map(reel => (
                    <Card
                      key={reel._id}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.05)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          bgcolor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                      onClick={() => {
                        // Find if this reel is already in the main reels list
                        const index = reels.findIndex(r => r._id === reel._id);
                        if (index !== -1) {
                          setActiveReelIndex(index);
                        } else {
                          // Add to reels list and set as active
                          setReels(prev => [reel, ...prev]);
                          setActiveReelIndex(0);
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', height: 180 }}>
                        <Box
                          component="img"
                          src={reel.thumbnail || reel.video}
                          alt={reel.caption}
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            p: 1,
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
                          }}
                        >
                          <Typography variant="caption" color="white" noWrap>
                            {reel.caption ? reel.caption.substring(0, 50) + (reel.caption.length > 50 ? '...' : '') : 'No caption'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ p: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar
                            src={reel.user.avatar}
                            alt={reel.user.username}
                            sx={{ width: 24, height: 24, mr: 1 }}
                          />
                          <Typography variant="caption" color="white">
                            {reel.user.username}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FavoriteIcon sx={{ color: 'white', fontSize: 14, mr: 0.5 }} />
                            <Typography variant="caption" color="white">
                              {reel.likesCount}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CommentIcon sx={{ color: 'white', fontSize: 14, mr: 0.5 }} />
                            <Typography variant="caption" color="white">
                              {reel.commentsCount}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* Loading More Indicator */}
          {loadingMore && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'rgba(0,0,0,0.7)',
                borderRadius: 2,
                p: 1
              }}
            >
              <CircularProgress color="primary" size={24} sx={{ mr: 1 }} />
              <Typography variant="caption" color="white">
                Loading more reels...
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        open={showFilters}
        onClose={() => setShowFilters(false)}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
      />

      {/* Unified Comment Dialog */}
      {selectedReel && (
        <CommentDialog
          open={commentDialogOpen}
          onClose={() => setCommentDialogOpen(false)}
          content={selectedReel}
          contentType="reel"
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Reels;
