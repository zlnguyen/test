import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// --- Icons ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);

const WindIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>
);

const CloudIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
);

// --- Main App Component ---

const App = () => {
  const [query, setQuery] = useState("");
  const [weatherData, setWeatherData] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation ref for basic "thinking" visual
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchWeather = async (prompt: string) => {
    setLoading(true);
    setError(null);
    setWeatherData(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Using gemini-2.5-flash for speed and search capability
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      setWeatherData(text || "No weather data found.");
      setSources(chunks);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch weather data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchWeather(`What is the current weather in ${query}? Please provide a summary including temperature, sky condition, humidity, and wind speed. Format it nicely with markdown.`);
  };

  const handleLocationClick = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(`What is the current weather at latitude ${latitude}, longitude ${longitude}? Please provide a summary including temperature, sky condition, humidity, and wind speed. Format it nicely with markdown.`);
          setQuery("Current Location");
        },
        (err) => {
          setLoading(false);
          setError("Unable to retrieve location. Please check permissions.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Simple Markdown Renderer
  const renderMarkdown = (text: string) => {
    // This is a very basic parser for demonstration. 
    // It handles bolding and basic lists to make the output look structured.
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Headers (bold)
      if (line.startsWith('**') || line.startsWith('#')) {
        return <p key={idx} className="font-bold text-lg mb-2 text-white">{line.replace(/\*\*/g, '').replace(/#/g, '')}</p>;
      }
      // Lists
      if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
        return <li key={idx} className="ml-4 mb-1 text-white/90">{line.replace(/^[\*\-]\s*/, '').replace(/\*\*/g, '')}</li>;
      }
      // Normal text
      if (line.trim() === "") return <br key={idx}/>;
      
      return <p key={idx} className="mb-2 text-white/90">{line.replace(/\*\*/g, '')}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-white/10">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
            <CloudIcon /> Gemini Weather
          </h1>
          <p className="text-blue-100 text-sm mt-1">AI-Powered Real-time Forecasts</p>
        </div>

        {/* Search Input */}
        <div className="p-6">
          <form onSubmit={handleSearch} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter city..."
                className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white/20 border border-white/10 text-white placeholder-blue-100/70 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-all border border-white/10 disabled:opacity-50"
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              onClick={handleLocationClick}
              disabled={loading}
              className="p-3 rounded-2xl bg-blue-500/80 hover:bg-blue-500 text-white transition-all border border-white/10 disabled:opacity-50"
              title="Use Current Location"
            >
              <LocationIcon />
            </button>
          </form>
        </div>

        {/* Content Area */}
        <div className="px-6 pb-6 min-h-[200px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-white/80 gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              <p className="animate-pulse text-sm">Searching global data...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-200 text-center p-4 bg-red-500/20 rounded-xl border border-red-500/30">
              <p>{error}</p>
            </div>
          ) : weatherData ? (
            <div className="animate-fade-in">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 shadow-inner">
                {renderMarkdown(weatherData)}
              </div>

              {/* Grounding Sources */}
              {sources.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((chunk, idx) => {
                       if (chunk.web) {
                         return (
                           <a
                             key={idx}
                             href={chunk.web.uri}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-xs bg-white/10 hover:bg-white/20 text-blue-100 px-3 py-1 rounded-full transition-colors border border-white/5 truncate max-w-[200px]"
                           >
                             {chunk.web.title || new URL(chunk.web.uri).hostname}
                           </a>
                         );
                       }
                       return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/40">
              <WindIcon />
              <p className="mt-2 text-sm">Enter a location to start</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 bg-black/20 text-center">
           <p className="text-xs text-white/30">Powered by Google Gemini 2.5 Flash</p>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
