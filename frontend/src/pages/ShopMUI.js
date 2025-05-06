import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/api';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  InputAdornment,
  Paper,
  Divider,
  Container,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Store as StoreIcon,
  ShoppingBag as ShoppingBagIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { MainLayout } from '../components/Layout';

const ShopMUI = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);

  // Fetch products and categories
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);

        // Fetch products
        const productsResponse = await shopService.getProducts();
        // Make sure we're setting products to an array
        setProducts(productsResponse.data?.data || []);

        // Fetch categories
        const categoriesResponse = await shopService.getCategories();
        // Make sure we're setting categories to an array
        setCategories(categoriesResponse.data?.data || []);

        // Check if user has a business account
        if (currentUser) {
          try {
            // Try to get user shop profile if the method exists
            if (typeof shopService.getUserShopProfile === 'function') {
              const userResponse = await shopService.getUserShopProfile();
              setIsBusinessAccount(userResponse.data?.isBusinessAccount || false);
            } else {
              // Fallback to checking the user's profile directly
              setIsBusinessAccount(currentUser.isBusinessAccount || false);
            }
          } catch (err) {
            console.error('Error checking business account status:', err);
            setIsBusinessAccount(false);
          }
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError('Failed to load shop data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [currentUser]);

  // Filter products based on active category and search query
  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    // Ensure product has all required properties
    if (!product || !product.name || !product.description) return false;

    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = !searchQuery.trim() ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  }) : [];

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already handled by the filteredProducts
  };

  // Upgrade to business account
  const upgradeToBusinessAccount = async () => {
    try {
      await shopService.upgradeToBusinessAccount();
      setIsBusinessAccount(true);
      setShowBusinessModal(false);
    } catch (err) {
      console.error('Error upgrading to business account:', err);
      setError('Failed to upgrade to business account. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading shop...</Typography>
      </Box>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        {/* Shop Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 4
        }}>
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            sx={{ 
              mb: { xs: 2, md: 0 },
              background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textFillColor: 'transparent'
            }}
          >
            <ShoppingBagIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Shop
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: 2, 
            width: { xs: '100%', md: 'auto' } 
          }}>
            {/* Search Form */}
            <Box 
              component="form" 
              onSubmit={handleSearch}
              sx={{ 
                display: 'flex', 
                width: { xs: '100%', md: 300 } 
              }}
            >
              <TextField
                fullWidth
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            </Box>

            {/* Business Account Button */}
            {currentUser && (
              <Box>
                {isBusinessAccount ? (
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to="/shop/my-products"
                    startIcon={<StoreIcon />}
                    sx={{ 
                      borderRadius: 2,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    My Products
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setShowBusinessModal(true)}
                    startIcon={<StoreIcon />}
                    sx={{ 
                      borderRadius: 2,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Become a Seller
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Categories */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mb: 4,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': {
              height: 6
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: 3
            }
          }}
        >
          <Chip
            label="All"
            clickable
            color={activeCategory === 'all' ? 'primary' : 'default'}
            onClick={() => setActiveCategory('all')}
            sx={{ fontWeight: activeCategory === 'all' ? 'bold' : 'normal' }}
          />
          
          {categories.map(category => (
            <Chip
              key={category._id}
              label={category.name}
              clickable
              color={activeCategory === category._id ? 'primary' : 'default'}
              onClick={() => setActiveCategory(category._id)}
              sx={{ fontWeight: activeCategory === category._id ? 'bold' : 'normal' }}
            />
          ))}
        </Box>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <Grid container spacing={3}>
            {filteredProducts.map(product => (
              <Grid item xs={12} sm={6} md={4} key={product._id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme => theme.palette.mode === 'dark'
                        ? '0 10px 30px rgba(0, 0, 0, 0.3)'
                        : '0 10px 30px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <CardActionArea 
                    component={Link} 
                    to={`/shop/product/${product._id}`}
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.images[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div" noWrap>
                        {product.name}
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color="primary" 
                        fontWeight="bold" 
                        sx={{ my: 1 }}
                      >
                        ${product.price.toFixed(2)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <Avatar
                          src={product.seller?.avatar || '/default-avatar.png'}
                          alt={product.seller?.username || 'Seller'}
                          sx={{ width: 32, height: 32, mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {product.seller?.username || 'Unknown Seller'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              bgcolor: theme => alpha(theme.palette.background.paper, 0.7)
            }}
          >
            <Typography variant="h6" gutterBottom>
              No products found
            </Typography>
            
            {searchQuery && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CloseIcon />}
                onClick={() => setSearchQuery('')}
                sx={{ mt: 2 }}
              >
                Clear search
              </Button>
            )}
          </Paper>
        )}
      </Box>

      {/* Business Account Modal */}
      <Dialog
        open={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StoreIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Become a Seller</Typography>
          </Box>
          <IconButton 
            edge="end" 
            color="inherit" 
            onClick={() => setShowBusinessModal(false)} 
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText paragraph>
            Upgrade to a business account to sell products on our platform.
          </DialogContentText>
          
          <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 2, mb: 1 }}>
            Benefits:
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Create and manage your own product listings" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Reach millions of potential customers" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Track sales and analytics" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Receive payments directly to your account" />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
            Pricing:
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            p: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: 2
          }}>
            <MoneyIcon sx={{ mr: 2, color: 'success.main', fontSize: 32 }} />
            <Typography>
              One-time fee of <strong>$100</strong> to activate your business account
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setShowBusinessModal(false)} 
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={upgradeToBusinessAccount} 
            variant="contained" 
            color="primary"
            startIcon={<StoreIcon />}
          >
            Upgrade Now
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default ShopMUI;
