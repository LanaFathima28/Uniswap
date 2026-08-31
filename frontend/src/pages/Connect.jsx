import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchUsers } from '../services/userService';
import { 
  Search, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Building2, 
  Calendar, 
  Mail, 
  Sparkles, 
  XCircle, 
  ChevronRight,
  Filter,
  UserCheck
} from 'lucide-react';

const Connect = () => {
  const navigate = useNavigate();
  const { token, currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [keyword, setKeyword] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');

  // Search execution helper
  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        keyword: keyword.trim(),
        role: selectedRole,
        branch: selectedBranch.trim(),
        year: selectedYear.trim(),
        company: selectedCompany.trim()
      };

      const res = await searchUsers(filters, token);
      if (res.success && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setError(res.message || 'Failed to search members');
      }
    } catch (err) {
      setError(err.message || 'Error searching members');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount & filter change debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, selectedRole, selectedBranch, selectedYear, selectedCompany, token]);

  // Reset filters
  const handleClearFilters = () => {
    setKeyword('');
    setSelectedRole('All');
    setSelectedBranch('');
    setSelectedYear('');
    setSelectedCompany('');
  };

  const hasActiveFilters = Boolean(keyword || selectedRole !== 'All' || selectedBranch || selectedYear || selectedCompany);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/70 via-slate-900 to-purple-950 p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Campus Directory & Network
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Connect with Peers & Alumni</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Search by name, branch, graduation year, company, or designation to find and network with campus members.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Directory Members</p>
              <p className="text-lg font-extrabold text-white font-mono">{users.length} Listed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Control Panel */}
      <div className="bg-slate-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        
        {/* Main Keyword Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by keyword (e.g. 'Rahul', 'Computer Science', '2024', 'Google', 'SDE')..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills & Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          
          {/* Role Filter Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {['All', 'Student', 'Alumni'].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3.5 py-1.5 rounded-lg transition ${
                  selectedRole === role
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {role === 'All' ? 'All Members' : `${role}s`}
              </button>
            ))}
          </div>

          {/* Quick Input Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Branch Filter */}
            <input
              type="text"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              placeholder="Filter Branch..."
              className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32"
            />

            {/* Year Filter */}
            <input
              type="text"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="Filter Year..."
              className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-28"
            />

            {/* Company Filter */}
            <input
              type="text"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              placeholder="Filter Company..."
              className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36"
            />

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Results Section */}
      {loading ? (
        <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
          <div className="inline-block animate-spin rounded-full h-9 w-9 border-3 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Searching campus directory...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 p-8 space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No matching members found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms, clearing branch/company filters, or switching role tabs.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-2 py-2 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition inline-flex items-center gap-1.5"
            >
              <span>Reset Search Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-medium">
            <span>Showing <strong className="text-slate-200">{users.length}</strong> campus members</span>
            {keyword && <span>Keyword: "{keyword}"</span>}
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {users.map((member) => {
              const isMe = currentUser && member._id === currentUser._id;
              const isStudent = member.role === 'Student';
              const initials = member.name
                ? member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                : 'U';

              return (
                <div
                  key={member._id}
                  className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition flex flex-col justify-between space-y-4 group relative"
                >
                  <div className="space-y-4">
                    
                    {/* Header Row: Avatar & Role Badge */}
                    <div className="flex items-start justify-between gap-3">
                      
                      <div className="flex items-center gap-3 min-w-0">
                        {member.profilePhotoUrl ? (
                          <img
                            src={member.profilePhotoUrl}
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-bold text-sm flex items-center justify-center border-2 border-indigo-500/40 shrink-0">
                            {initials}
                          </div>
                        )}

                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-white text-base truncate">{member.name}</h3>
                            {isMe && (
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono border border-indigo-500/30 shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{member.email}</span>
                          </p>
                        </div>
                      </div>

                      {/* Role Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border shrink-0 ${
                          isStudent
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>

                    {/* Member Details */}
                    <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                      {isStudent ? (
                        <>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                              Branch:
                            </span>
                            <span className="font-semibold">{member.branch || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                              Year:
                            </span>
                            <span className="font-semibold">{member.year || 'N/A'}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-purple-400" />
                              Company:
                            </span>
                            <span className="font-semibold">{member.company || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500 flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                              Role:
                            </span>
                            <span className="font-semibold">{member.designation || 'Alumni'}</span>
                          </div>
                        </>
                      )}
                    </div>

                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-800">
                    <button
                      onClick={() => navigate(isMe ? '/profile' : `/profile/${member._id}`)}
                      className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-indigo-600 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 hover:border-indigo-500 transition flex items-center justify-center gap-1.5 shadow-sm group-hover:shadow-indigo-600/20"
                    >
                      <span>View Profile & Listings</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};

export default Connect;
