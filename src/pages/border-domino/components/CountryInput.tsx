import { useState, useRef, useEffect } from 'react';

interface CountryInputProps {
  onSubmit: (country: string) => void;
  onGiveUp: () => void;
  countries: string[];
}

export function CountryInput({ onSubmit, onGiveUp, countries }: CountryInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.length > 0) {
      const filtered = countries
        .filter(country => 
          country.toLowerCase().startsWith(input.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input, countries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (country: string) => {
    setInput(country);
    setShowSuggestions(false);
    onSubmit(country);
    setInput('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a country name..."
            className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 text-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            autoComplete="off"
          />
          
          {showSuggestions && (
            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((country, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(country)}
                  className="w-full px-4 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-600 last:border-b-0"
                >
                  {country}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors whitespace-nowrap shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            Submit
          </button>
          
          <button
            type="button"
            onClick={onGiveUp}
            className="bg-slate-500 hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors whitespace-nowrap shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            Give Up
          </button>
        </div>
      </form>
    </div>
  );
}
