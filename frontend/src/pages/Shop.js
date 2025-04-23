import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shopService } from '../services/api';

const Shop = () => {
  const { currentUser } = useAuth();
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
      <div className="shop-loading">
        <div className="spinner"></div>
        <p>Loading shop...</p>
      </div>
    );
  }

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1>Shop</h1>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
          />
          <button type="submit">Search</button>
        </form>

        {currentUser && (
          <div className="shop-actions">
            {isBusinessAccount ? (
              <Link to="/shop/my-products" className="my-products-button">
                My Products
              </Link>
            ) : (
              <button
                className="business-button"
                onClick={() => setShowBusinessModal(true)}
              >
                Become a Seller
              </button>
            )}
          </div>
        )}
      </div>

      <div className="categories-container">
        <button
          className={`category-item ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>

        {categories.map(category => (
          <button
            key={category._id}
            className={`category-item ${activeCategory === category._id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category._id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="products-container">
        {filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <Link to={`/shop/product/${product._id}`} key={product._id} className="product-card">
                <div className="product-image">
                  <img src={product.images[0]} alt={product.name} />
                </div>

                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">${product.price.toFixed(2)}</p>

                  <div className="product-seller">
                    <img
                      src={product.seller.avatar || '/default-avatar.png'}
                      alt={product.seller.username}
                    />
                    <span>{product.seller.username}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-products">
            <p>No products found</p>
            {searchQuery && (
              <button
                className="clear-search-button"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Business Account Modal */}
      {showBusinessModal && (
        <div className="modal-overlay">
          <div className="business-modal">
            <div className="modal-header">
              <h3>Become a Seller</h3>
              <button
                className="close-button"
                onClick={() => setShowBusinessModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <p>Upgrade to a business account to sell products on our platform.</p>

              <div className="business-benefits">
                <h4>Benefits:</h4>
                <ul>
                  <li>Create and manage your own product listings</li>
                  <li>Reach millions of potential customers</li>
                  <li>Track sales and analytics</li>
                  <li>Receive payments directly to your account</li>
                </ul>
              </div>

              <div className="business-pricing">
                <h4>Pricing:</h4>
                <p>One-time fee of $100 to activate your business account</p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowBusinessModal(false)}
              >
                Cancel
              </button>
              <button
                className="upgrade-button"
                onClick={upgradeToBusinessAccount}
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
