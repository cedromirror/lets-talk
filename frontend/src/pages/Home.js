import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Grid,
  Divider,
  Button,
  Fab,
  Snackbar,
  Alert,
  Chip
} from '@mui/material';
import {
  Explore as ExploreIcon,
  Photo as PhotoIcon,
  Videocam as VideocamIcon,
  Favorite as FavoriteIcon,
  Add as AddIcon,
  AutoStories as StoryIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { postService, reelService, storyService, userService, savedService } from '../services/api';
import PostCard from '../components/Posts/PostCard';
import StoryCircle from '../components/Stories/StoryCircle';
import ReelPreview from '../components/Reels/ReelPreview';
import StoryViewer from '../components/Stories/StoryViewer';
import CommentDialog from '../components/common/CommentDialog';
import { StoryCreator } from '../components';
import ShareDialog from '../components/Posts/ShareDialog';
import { useNavigate } from 'react-router-dom';

const Home = () => {
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
      <Box
        sx={{
          mb: 4,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -16,
            left: -16,
            right: -16,
            bottom: -16,
            background: 'linear-gradient(135deg, rgba(255,107,107,0.03) 0%, rgba(168,65,255,0.03) 100%)',
            borderRadius: 4,
            zIndex: -1
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          mt: 1
        }}>
          <Typography
            variant="h6"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #FF6B6B 0%, #A841FF 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textFillColor: 'transparent'
            }}
          >
            <StoryIcon sx={{ color: '#FF6B6B' }} />
            Stories
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setStoryCreatorOpen(true)}
            size="small"
            sx={{
              background: 'linear-gradient(90deg, #FF6B6B 0%, #A841FF 100%)',
              boxShadow: '0 4px 10px rgba(168,65,255,0.2)',
              '&:hover': {
                background: 'linear-gradient(90deg, #FF5757 0%, #9B32F0 100%)',
                boxShadow: '0 6px 15px rgba(168,65,255,0.3)'
              }
            }}
          >
            Create Story
          </Button>
        </Box>

        <Box
          sx={{
            display: 'flex',
            overflowX: 'auto',
            pb: 1,
            pt: 1,
            px: 1,
            mx: -1,
            '&::-webkit-scrollbar': {
              height: 6
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(168,65,255,0.3)',
              borderRadius: 3
            },
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth'
          }}
        >
          {stories.length > 0 ? (
            stories.map((story, index) => (
              <Box
                key={story._id}
                sx={{
                  scrollSnapAlign: 'start',
                  transform: story.isNew ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.3s ease',
                  zIndex: story.isNew ? 2 : 1
                }}
              >
                <StoryCircle
                  story={story}
                  onClick={handleStoryClick}
                  isNew={story.isNew}
                />
              </Box>
            ))
          ) : (
            <Box sx={{
              p: 3,
              textAlign: 'center',
              width: '100%',
              borderRadius: 2,
              border: '1px dashed rgba(168,65,255,0.3)',
              bgcolor: 'rgba(255,255,255,0.5)'
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No stories available. Create one or follow users to see their stories.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click the "Create Story" button above to get started.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

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
            <Box>
              {/* Trending Reels Section */}
              {reels.length > 0 && (
                <Box
                  sx={{
                    mb: 5,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -16,
                      left: -16,
                      right: -16,
                      bottom: -16,
                      background: 'linear-gradient(135deg, rgba(255,107,107,0.05) 0%, rgba(168,65,255,0.05) 100%)',
                      borderRadius: 4,
                      zIndex: -1
                    }
                  }}
                >
                  {/* Header with gradient text */}
                  <Box
                    sx={{
                      mb: 3,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          background: 'linear-gradient(90deg, #FF6B6B 0%, #A841FF 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textFillColor: 'transparent'
                        }}
                      >
                        <VideocamIcon sx={{ color: '#A841FF' }} />
                        Trending Reels
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Most liked and viewed videos from our community
                      </Typography>
                    </Box>

                    <Button
                      onClick={() => navigateTo('/reels')}
                      variant="text"
                      color="secondary"
                      endIcon={<Box component="span" sx={{ fontSize: 20 }}>→</Box>}
                      sx={{
                        fontWeight: 'bold',
                        '&:hover': {
                          background: 'linear-gradient(90deg, rgba(255,107,107,0.1) 0%, rgba(168,65,255,0.1) 100%)'
                        }
                      }}
                    >
                      See All
                    </Button>
                  </Box>

                  {/* Reels Cards with Hover Effects */}
                  <Box
                    sx={{
                      display: 'flex',
                      overflowX: 'auto',
                      pb: 2,
                      mx: -1,
                      px: 1,
                      '&::-webkit-scrollbar': {
                        height: 6
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(168,65,255,0.3)',
                        borderRadius: 3
                      },
                      scrollSnapType: 'x mandatory',
                      scrollBehavior: 'smooth'
                    }}
                  >
                    {reels.slice(0, 8).map((reel, index) => (
                      <Box
                        key={reel._id}
                        sx={{
                          minWidth: { xs: '70%', sm: '35%', md: '25%' },
                          scrollSnapAlign: 'start',
                          px: 1,
                          transform: `scale(0.98) translateY(${index % 2 === 0 ? '0' : '10px'})`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1) translateY(0)',
                            zIndex: 2
                          }
                        }}
                      >
                        <ReelPreview
                          reel={reel}
                          showTrendingBadge={reel.isTrending || (reel.likesCount > 10) || (reel.viewsCount > 100) || (index < 3 && reel.likesCount > 0)}
                          trendingRank={index < 3 ? index + 1 : null}
                        />
                      </Box>
                    ))}
                  </Box>

                  {/* Create Reel Button */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                      onClick={() => navigateTo('/create?tab=reel')}
                      variant="contained"
                      color="secondary"
                      startIcon={<VideocamIcon />}
                      sx={{
                        borderRadius: 6,
                        px: 3,
                        py: 1,
                        background: 'linear-gradient(90deg, #FF6B6B 0%, #A841FF 100%)',
                        boxShadow: '0 4px 20px rgba(168,65,255,0.3)',
                        '&:hover': {
                          background: 'linear-gradient(90deg, #FF5757 0%, #9B32F0 100%)',
                          boxShadow: '0 6px 25px rgba(168,65,255,0.4)'
                        }
                      }}
                    >
                      Create Your Own Reel
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Posts Section */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhotoIcon color="primary" />
                Latest Posts
              </Typography>

              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                  />
                ))
              ) : (
                <Typography align="center" sx={{ py: 4 }}>
                  No posts to show. Follow some users to see their content here!
                </Typography>
              )}
            </Box>
          )}

          {/* Posts Tab */}
          {activeTab === 1 && (
            <Box>
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                  />
                ))
              ) : (
                <Typography align="center" sx={{ py: 4 }}>
                  No posts to show. Follow some users to see their posts here!
                </Typography>
              )}
            </Box>
          )}

          {/* Reels Tab */}
          {activeTab === 2 && (
            <Box>
              {reels.length > 0 ? (
                <>
                  <Grid container spacing={2}>
                    {reels.map(reel => (
                      <Grid item xs={6} sm={4} key={reel._id}>
                        <ReelPreview reel={reel} />
                      </Grid>
                    ))}
                  </Grid>

                  {/* View More Button */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                      onClick={() => navigateTo('/reels')}
                      variant="contained"
                      color="secondary"
                      startIcon={<VideocamIcon />}
                    >
                      View All Reels
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography gutterBottom>
                    No reels to show. Follow some users to see their reels here!
                  </Typography>
                  <Button
                    onClick={() => navigateTo('/create?tab=reel')}
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                  >
                    Create a Reel
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* For You Tab */}
          {activeTab === 3 && (
            <Box>
              {forYouLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : posts.length > 0 || reels.length > 0 || savedReels.length > 0 ? (
                <>
                  {/* Saved Reels Section */}
                  {savedReels.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookmarkIcon color="primary" />
                        Your Saved Reels
                      </Typography>

                      <Grid container spacing={2}>
                        {savedReels.map(reel => (
                          <Grid item xs={6} sm={4} key={reel._id}>
                            <ReelPreview
                              reel={reel}
                              showSavedBadge={true}
                            />
                          </Grid>
                        ))}
                      </Grid>

                      {savedReels.length > 6 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                          <Button
                            onClick={() => navigateTo('/profile?tab=saved')}
                            variant="outlined"
                            color="primary"
                            startIcon={<BookmarkIcon />}
                          >
                            View All Saved Items
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Followed Users' Posts */}
                  {posts.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FavoriteIcon color="error" />
                        From People You Follow
                      </Typography>

                      {posts.slice(0, 3).map(post => (
                        <PostCard
                          key={post._id}
                          post={post}
                          onLike={handleLike}
                          onComment={handleComment}
                          onShare={handleShare}
                          onBookmark={handleBookmark}
                        />
                      ))}
                    </Box>
                  )}

                  {/* Recommended Reels */}
                  {reels.length > 0 && (
                    <Box
                      sx={{
                        position: 'relative',
                        mt: 4,
                        pt: 2,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: -16,
                          left: -16,
                          right: -16,
                          bottom: -16,
                          background: 'linear-gradient(135deg, rgba(168,65,255,0.05) 0%, rgba(255,107,107,0.05) 100%)',
                          borderRadius: 4,
                          zIndex: -1
                        }
                      }}
                    >
                      {/* Header with gradient text */}
                      <Box
                        sx={{
                          mb: 3,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <Box>
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              background: 'linear-gradient(90deg, #A841FF 0%, #FF6B6B 100%)',
                              backgroundClip: 'text',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              textFillColor: 'transparent'
                            }}
                          >
                            <VideocamIcon sx={{ color: '#A841FF' }} />
                            Recommended For You
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Based on your interests and activity
                          </Typography>
                        </Box>

                        <Button
                          onClick={() => navigateTo('/reels')}
                          variant="text"
                          color="secondary"
                          endIcon={<Box component="span" sx={{ fontSize: 20 }}>→</Box>}
                          sx={{
                            fontWeight: 'bold',
                            '&:hover': {
                              background: 'linear-gradient(90deg, rgba(168,65,255,0.1) 0%, rgba(255,107,107,0.1) 100%)'
                            }
                          }}
                        >
                          Explore More
                        </Button>
                      </Box>

                      {/* Reels Cards with Hover Effects */}
                      <Box
                        sx={{
                          display: 'flex',
                          overflowX: 'auto',
                          pb: 2,
                          mx: -1,
                          px: 1,
                          '&::-webkit-scrollbar': {
                            height: 6
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(168,65,255,0.3)',
                            borderRadius: 3
                          },
                          scrollSnapType: 'x mandatory',
                          scrollBehavior: 'smooth'
                        }}
                      >
                        {reels.slice(0, 8).map((reel, index) => (
                          <Box
                            key={reel._id}
                            sx={{
                              minWidth: { xs: '70%', sm: '35%', md: '25%' },
                              scrollSnapAlign: 'start',
                              px: 1,
                              transform: `scale(0.98) translateY(${index % 2 === 0 ? '0' : '10px'})`,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1) translateY(0)',
                                zIndex: 2
                              }
                            }}
                          >
                            <ReelPreview
                              reel={reel}
                              showTrendingBadge={reel.isTrending || (reel.likesCount > 10) || (reel.viewsCount > 100)}
                            />
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography gutterBottom>
                    No personalized content to show yet.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Follow users, like posts, or save reels to see personalized content here.
                  </Typography>
                  {currentUser && (
                    <Button
                      onClick={() => navigateTo('/reels')}
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                    >
                      Explore Reels
                    </Button>
                  )}
                </Box>
              )}
            </Box>
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

export default Home;
