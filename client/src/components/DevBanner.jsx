import React from 'react';
import { Terminal, ShieldAlert } from 'lucide-react';

export default function DevBanner() {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-800 text-xs px-4 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <Terminal className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span className="font-medium">
          <strong className="font-semibold">Demo / Dev Mode Active:</strong> If SMTP is unconfigured, OTPs will appear directly in the server terminal output.
        </span>
      </div>
    </div>
  );
}
