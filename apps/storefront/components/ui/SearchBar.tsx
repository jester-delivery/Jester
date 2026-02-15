"use client";

/**
 * SearchBar Component
 * 
 * Search bar pentru adresă clientului (placeholder pentru moment)
 * Va deveni funcțional după implementarea autentificării
 */
export default function SearchBar() {
  return (
    <div className="w-full pt-4 pb-2 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3.5 shadow-lg hover:bg-white/12 transition-colors">
          {/* Location Icon */}
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-white/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            placeholder="Introdu adresa ta de livrare"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/50 font-medium"
            readOnly
            disabled
          />

          {/* Search Icon (opțional pentru viitor) */}
          <div className="flex-shrink-0 opacity-50">
            <svg
              className="w-5 h-5 text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
