import React, { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab, CircularProgress, Fab, Snackbar, Alert } from '@mui/material';
import {
  Explore as ExploreIcon,
  Photo as PhotoIcon,
  Videocam as VideocamIcon,
  Favorite as FavoriteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { postService, reelService, storyService, savedService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import StoryViewer from '../../components/Stories/StoryViewer';
import CommentDialog from '../../components/common/CommentDialog';
import { StoryCreator } from '../../components';
import ShareDialog from '../../components/Posts/ShareDialog';

// Import modular components
import HomeStories from './HomeStories';
import HomeAllContent from './HomeAllContent';
import HomePostsTab from './HomePostsTab';
import HomeReelsTab from './HomeReelsTab';
import HomeForYouTab from './HomeForYouTab';

const HomeContainer = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [stories, setStories] = useState([]);
  const [savedReels, setSavedReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forYouLoading, setForYouLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Dialogs
  const [storyCreatorOpen, setStoryCreatorOpen] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [postToShare, setPostToShare] = useState(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Check if this is a fresh login
  const [isFreshLogin, setIsFreshLogin] = useState(false);

  useEffect(() => {
    // Check if this is a fresh login from sessionStorage
    const freshLogin = sessionStorage.getItem('freshLogin');
    if (freshLogin === 'true') {
      console.log('Home: Detected fresh login, optimizing initial load');
      setIsFreshLogin(true);
      // Clear the flag after reading it
      sessionStorage.removeItem('freshLogin');
    }
  }, []);

  // Fetch posts for the feed
  useEffect(() => {
    const fetchFeedContent = async () => {
      try {
        setLoading(true);

        // If this is a fresh login, show a slightly longer loading state for better UX
        if (isFreshLogin) {
          console.log('Home: Fresh login detected, prioritizing essential content');
        }

        // Use Promise.all to fetch data in parallel for better performance
        const [postsResponse, storiesResponse, reelsResponse] = await Promise.all([
          // Fetch posts for the feed
          postService.getFeedPosts(1, 10)
            .catch(err => {
              console.error('Error fetching posts:', err);
              return { data: { posts: [], pagination: { hasMore: false } } };
            }),

          // Fetch stories
          storyService.getSuggestedStories()
            .catch(err => {
              console.error('Error fetching stories:', err);
              return { data: [] };
            }),

          // Fetch reels with sorting by popularity
          reelService.getReels({ page: 1, limit: 10, sort: 'popular' })
            .catch(err => {
              console.error('Error fetching reels:', err);
              return { data: { reels: [] } };
            })
        ]);

        console.log('Feed posts response:', postsResponse);
        console.log('Stories response:', storiesResponse);
        console.log('Reels response:', reelsResponse);

        // Process posts
        if (postsResponse.data && postsResponse.data.posts) {
          setPosts(postsResponse.data.posts);
          setHasMore(postsResponse.data.pagination?.hasMore || false);
        } else {
          setPosts([]);
          setHasMore(false);
        }

        // Process stories
        if (storiesResponse.data) {
          setStories(storiesResponse.data);
        }

        // Process reels
        if (reelsResponse.data && reelsResponse.data.reels) {
          // Sort reels by popularity metrics (likes, views, comments)
          const sortedReels = [...reelsResponse.data.reels].sort((a, b) => {
            // Calculate popularity score based on likes, views, and comments
            const scoreA = (a.likesCount || 0) * 2 + (a.viewsCount || 0) / 10 + (a.commentsCount || 0) * 3;
            const scoreB = (b.likesCount || 0) * 2 + (b.viewsCount || 0) / 10 + (b.commentsCount || 0) * 3;
            return scoreB - scoreA; // Sort in descending order
          });

          setReels(sortedReels);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching feed content:', err);
        setError('Failed to load feed content. Please try again.');
      } finally {
        setLoading(false);

        // If this was a fresh login, log completion
        if (isFreshLogin) {
          console.log('Home: Initial content load complete after fresh login');
        }
      }
    };

    fetchFeedContent();

    // Set up refresh event listener
    const handleRefreshFeed = () => {
      fetchFeedContent();
    };

    window.addEventListener('refresh-feed', handleRefreshFeed);

    return () => {
      window.removeEventListener('refresh-feed', handleRefreshFeed);
    };
  }, [isFreshLogin]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // Fetch saved reels when the "For You" tab is selected
    if (newValue === 3 && currentUser && savedReels.length === 0) {
      fetchSavedReels();
    }
  };

  // Fetch saved reels for the "For You" tab
  const fetchSavedReels = async () => {
    if (!currentUser) return;

    try {
      setForYouLoading(true);
      console.log('Fetching saved reels for For You tab');

      const response = await savedService.getSavedReels({ page: 1, limit: 10 });
      console.log('Saved reels response:', response);

      if (response.data && response.data.reels) {
        setSavedReels(response.data.reels);
      }
    } catch (err) {
      console.error('Error fetching saved reels:', err);
      // Don't set global error, just log it
    } finally {
      setForYouLoading(false);
    }
  };

  // Handle story creation success
  const handleStoryCreated = (newStory) => {
    if (!newStory) {
      console.error('Story creation returned no data');
      setSnackbar({
        open: true,
        message: 'Story was created but some data may be missing. Please refresh the page.',
        severity: 'warning'
      });
      return;
    }

    console.log('Story created successfully:', newStory);

    // Show success notification
    setSnackbar({
      open: true,
      message: 'Story created successfully! Your story is now visible to your followers.',
      severity: 'success'
    });

    try {
      // Add the new story to the list and ensure it has all required fields
      const enhancedStory = {
        ...newStory,
        isNew: true, // Mark as new for UI effects
        createdAt: new Date().toISOString(), // Ensure it has a timestamp
        type: newStory.type || 'image', // Ensure type is set
        user: newStory.user || {
          _id: currentUser?._id,
          username: currentUser?.username,
          profilePicture: currentUser?.profilePicture || currentUser?.avatar
        }
      };

      // Add the new story to the beginning of the list
      setStories(prev => [enhancedStory, ...prev]);

      // Automatically open the story viewer to show the newly created story after a short delay
      setTimeout(() => {
        setSelectedStoryIndex(0); // Select the first story (the newly created one)
        setStoryViewerOpen(true);
      }, 500);
    } catch (error) {
      console.error('Error processing new story:', error);
      setSnackbar({
        open: true,
        message: 'Story was created but there was an error displaying it. Please refresh the page.',
        severity: 'warning'
      });
    }
  };

  // Handle post actions
  const handleLike = (postId, isLiked) => {
    // Update the post in the state
    setPosts(prev =>
      prev.map(post =>
        post._id === postId
          ? {
              ...post,
              isLiked,
              likesCount: isLiked ? (post.likesCount || 0) + 1 : (post.likesCount || 1) - 1
            }
          : post
      )
    );
  };

  const handleComment = (post) => {
    setSelectedPost(post);
    setCommentDialogOpen(true);
  };

  const handleShare = (post) => {
    if (!post) return;

    // Set the post to share and open the share dialog
    setPostToShare(post);
    setShareDialogOpen(true);

    console.log('Opening share dialog for post:', post._id);
  };

  const handleBookmark = (postId, isBookmarked) => {
    // Update the post in the state
    setPosts(prev =>
      prev.map(post =>
        post._id === postId
          ? { ...post, isBookmarked }
          : post
      )
    );
  };

  // Handle story view
  const handleStoryClick = (story) => {
    // Find the index of the clicked story
    const storyIndex = stories.findIndex(s => s._id === story._id);
    if (storyIndex !== -1) {
      setSelectedStoryIndex(storyIndex);
      setStoryViewerOpen(true);
    }
  };

  // Navigation helper
  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 3, px: { xs: 1, sm: 2 } }}>
      {/* Page Title */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Home
      </Typography>

      {/* Stories Section */}
      <HomeStories 
        stories={stories} 
        onStoryClick={handleStoryClick} 
        onCreateStory={() => setStoryCreatorOpen(true)} 
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ mb: 3 }}
      >
        <Tab icon={<ExploreIcon />} label="All" />
        <Tab icon={<PhotoIcon />} label="Posts" />
        <Tab icon={<VideocamIcon />} label="Reels" />
        <Tab icon={<FavoriteIcon />} label="For You" />
      </Tabs>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" sx={{ py: 4 }}>
          {error}
        </Typography>
      ) : (
        <>
          {/* All Content Tab */}
          {activeTab === 0 && (
            <HomeAllContent 
              posts={posts} 
              reels={reels} 
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onBookmark={handleBookmark}
              navigateTo={navigateTo}
            />
          )}

          {/* Posts Tab */}
          {activeTab === 1 && (
            <HomePostsTab 
              posts={posts} 
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onBookmark={handleBookmark}
            />
          )}

          {/* Reels Tab */}
          {activeTab === 2 && (
            <HomeReelsTab 
              reels={reels} 
              navigateTo={navigateTo}
            />
          )}

          {/* For You Tab */}
          {activeTab === 3 && (
            <HomeForYouTab 
              posts={posts}
              reels={reels}
              savedReels={savedReels}
              forYouLoading={forYouLoading}
              currentUser={currentUser}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onBookmark={handleBookmark}
              navigateTo={navigateTo}
            />
          )}
        </>
      )}

      {/* Create Post FAB */}
      <Fab
        color="primary"
        aria-label="create post"
        onClick={() => navigateTo('/create')}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        <AddIcon />
      </Fab>

      {/* Story Creator Dialog */}
      <StoryCreator
        open={storyCreatorOpen}
        onClose={() => setStoryCreatorOpen(false)}
        onSuccess={handleStoryCreated}
      />

      {/* Story Viewer Dialog */}
      {stories.length > 0 && (
        <StoryViewer
          open={storyViewerOpen}
          onClose={() => setStoryViewerOpen(false)}
          stories={stories}
          initialStoryIndex={selectedStoryIndex}
        />
      )}

      {/* Comment Dialog */}
      <CommentDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        content={selectedPost}
        contentType="post"
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        post={postToShare}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default HomeContainer;
