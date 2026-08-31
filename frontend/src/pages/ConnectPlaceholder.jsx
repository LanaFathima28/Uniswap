import React from 'react';
import { Users, UserCheck, MessageSquare, Sparkles } from 'lucide-react';

const ConnectPlaceholder = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-purple-950 p-8 rounded-3xl border border-indigo-500/20 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full border border-purple-500/30 uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Campus Network Module
            </span>
            <h1 className="text-3xl font-extrabold text-white mt-1">Campus Connect Directory</h1>
            <p className="text-slate-400 text-sm mt-1">Discover, network, and connect with fellow campus students & alumni.</p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-xl border border-indigo-500/20 text-sm font-semibold">
            <Users className="w-5 h-5" />
            <span>Connect Module</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 border border-slate-800 text-center space-y-4 shadow-lg">
        <div className="w-16 h-16 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Networking & Mentorship Directory</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          The Connect module will feature member search, public profile cards, and direct messaging between students and alumni.
        </p>
      </div>
    </div>
  );
};

export default ConnectPlaceholder;
