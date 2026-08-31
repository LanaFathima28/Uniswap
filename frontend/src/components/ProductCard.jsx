import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, Tag, Package, AlertTriangle } from 'lucide-react';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  if (!product) return null;

  const {
    _id,
    title,
    cost,
    listingType,
    category,
    images,
    hasDamage,
    status
  } = product;

  const firstImage = images && images.length > 0 ? images[0] : null;

  const handleClick = () => {
    navigate(`/products/${_id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-950/40 transition-all duration-300 cursor-pointer flex flex-col h-full"
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden">
        {firstImage ? (
          <img
            src={firstImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-900/50">
            <Package className="w-10 h-10 mb-1" />
            <span className="text-xs">No Image</span>
          </div>
        )}

        {/* Listing Type Badge (Sell / Rent) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-md border ${
              listingType === 'Rent'
                ? 'bg-amber-500/90 text-slate-950 border-amber-400'
                : 'bg-emerald-600/90 text-white border-emerald-400'
            }`}
          >
            {listingType}
          </span>
        </div>

        {/* Category Badge & Damage Flag */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          {hasDamage && (
            <span
              className="p-1 bg-rose-500/90 text-white rounded-lg text-[10px] font-bold shadow-md"
              title="Has minor damage (details inside)"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700/80 shadow-md">
            {category}
          </span>
        </div>
      </div>

      {/* Product Info Content */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-100 text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>
        </div>

        {/* Cost & Action hint */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center font-extrabold text-lg text-indigo-400">
            <IndianRupee className="w-4 h-4 mr-0.5" />
            <span>{cost?.toLocaleString('en-IN') || 0}</span>
            {listingType === 'Rent' && <span className="text-xs font-normal text-slate-400 ml-1">/ rent</span>}
          </div>

          <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition-colors">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
