"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export default function LocationInput({ placeholder, onSelect }: any) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query) return setResults([]);

      const res = await fetch(`/api/ride/suggest?q=${query}`);

      let data = [];

      try {
        const text = await res.text(); 

        if (!text) {
          setResults([]);
          return;
        }

        data = JSON.parse(text);
      } catch (err) {
        console.log("Suggest parse error");
        setResults([]);
        return;
      }

      setResults(Array.isArray(data) ? data : []);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {results.length > 0 && (
        <div className="absolute bg-white border w-full mt-1 rounded-md shadow-md z-50">
          {results.map((item, idx) => (
            <div
              key={idx}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => {
                setQuery(item.name);
                setResults([]);
                onSelect(item);
              }}
            >
              {item.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}