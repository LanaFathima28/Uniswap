import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCurrentUserProfile } from '../services/authService';
import { User, Mail, GraduationCap, Briefcase, Key, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

const HomePlaceholder = () => {
  const { currentUser, token } = useAuth();
  const [testResult, setTestResult] = useState(null);
  const [testingApi, setTestingApi] = useState(false);

  const testProtectedMeEndpoint = async () => {
    setTestingApi(true);
    setTestResult(null);
    try {
      const res = await getCurrentUserProfile(token);
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Error executing request'
      });
    } finally {
      setTestingApi(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950 p-8 rounded-3xl border border-indigo-500/20 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30 uppercase tracking-wider">
              Module 1 — Authentication Active
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-3">
              Welcome, {currentUser?.name || 'Campus Member'}!
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Your CampusConnect authentication session is active and secured via Firebase & Express Admin SDK.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 text-sm font-semibold">
            <ShieldCheck className="w-5 h-5" />
            Authenticated
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg mb-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" />
          MongoDB User Profile Data
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 text-xs uppercase tracking-wider block">Firebase UID</span>
            <span className="font-mono text-slate-200 text-xs break-all">{currentUser?.firebaseUID || 'N/A'}</span>
          </div>

          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 text-xs uppercase tracking-wider block">Email Address</span>
            <span className="font-medium text-slate-200">{currentUser?.email || 'N/A'}</span>
          </div>

          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 text-xs uppercase tracking-wider block">Role</span>
            <span className="font-semibold text-indigo-400">{currentUser?.role || 'N/A'}</span>
          </div>

          {currentUser?.role === 'Student' ? (
            <>
              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Branch</span>
                <span className="font-medium text-slate-200">{currentUser?.branch || 'N/A'}</span>
              </div>
              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Year</span>
                <span className="font-medium text-slate-200">{currentUser?.year || 'N/A'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Company</span>
                <span className="font-medium text-slate-200">{currentUser?.company || 'N/A'}</span>
              </div>
              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-xs uppercase tracking-wider block">Designation</span>
                <span className="font-medium text-slate-200">{currentUser?.designation || 'N/A'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Protected Route GET /api/auth/me Test Tool */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-400" />
              Protected Route Verification Test
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              Executes <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">GET /api/auth/me</code> with current Bearer token.
            </p>
          </div>
          
          <button
            onClick={testProtectedMeEndpoint}
            disabled={testingApi}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            {testingApi ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              'Run GET /api/auth/me'
            )}
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl border text-sm font-mono mt-4 overflow-x-auto ${
            testResult.success 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-2 font-sans">
              {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>Status Response ({testResult.success ? '200 OK' : 'Error'}):</span>
            </div>
            <pre className="text-xs">{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        )}
      </div>

    </div>
  );
};

export default HomePlaceholder;
