import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
import { 
  Search, 
  PlusCircle, 
  Filter, 
  RotateCcw, 
  PackageSearch, 
  AlertCircle, 
  Sparkles,
  IndianRupee
} from 'lucide-react';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Furniture', 'Cycle', 'Other'];
const LISTING_TYPES = ['All', 'Sell', 'Rent'];

const Home = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Search & Filter State
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('All');
  const [listingType, setListingType] = useState('All');
  const [minCost, setMinCost] = useState('');
  const [maxCost, setMaxCost] = useState('');

  // Products Data State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Products based on current filters
  const fetchProductListings = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        keyword,
        category,
        listingType,
        minCost,
        maxCost
      };
      const res = await getProducts(filters, token);
      if (res.success && Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setError(res.message || 'Failed to load products');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while searching products');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search on typing or filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductListings();
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, category, listingType, minCost, maxCost, token]);

  // Reset Filters
  const handleResetFilters = () => {
    setKeyword('');
    setCategory('All');
    setListingType('All');
    setMinCost('');
    setMaxCost('');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 flex-1">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-purple-950 p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Campus Marketplace
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Buy, Sell & Rent with Campus Peers
          </h1>
          <p className="text-slate-300 text-sm">
            Find books, electronics, cycles & dorm items directly from students and alumni in your campus community.
          </p>
        </div>

        {/* "+ List an Item" Button */}
        <button
          onClick={() => navigate('/products/new')}
          className="z-10 shrink-0 py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>+ List an Item</span>
        </button>
      </div>

      {/* Search & Filter Controls Section */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by title, author, brand or keyword..."
            className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl py-3.5 pl-12 pr-4 text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
          
          {/* Category Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Listing Type Filter */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Listing Type
            </label>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {LISTING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? 'Sell & Rent' : type}
                </option>
              ))}
            </select>
          </div>

          {/* Min Cost Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Min Price (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
              <input
                type="number"
                min="0"
                value={minCost}
                onChange={(e) => setMinCost(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Max Cost Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Max Price (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
              <input
                type="number"
                min="0"
                value={maxCost}
                onChange={(e) => setMaxCost(e.target.value)}
                placeholder="Max"
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl pl-7 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reset Action */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Filters</span>
            </button>
          </div>

        </div>
      </div>

      {/* Feedback Banner on Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Product Listings Grid & States */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <span>Available Listings</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {products.length}
            </span>
          </h2>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-indigo-500 border-t-transparent mb-4" />
            <p className="text-sm font-medium text-slate-400">Searching campus listings...</p>
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="py-16 px-6 text-center bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <PackageSearch className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-bold text-slate-200">No products found</h3>
              <p className="text-xs text-slate-400">
                We couldn't find any available items matching your search or filters. Try clearing your filters or search for something else.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="py-2 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          /* Responsive Product Grid (2-cols mobile, 4-cols desktop) */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Home;
