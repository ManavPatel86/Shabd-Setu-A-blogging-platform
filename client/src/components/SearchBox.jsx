import React, { useState } from "react";
import { Input } from "./ui/input";
import { useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import { RouteSearch } from "@/helpers/RouteName";

const SearchBox = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    const handleChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed.length === 0) {
            navigate(RouteSearch());
            return;
        }
        navigate(RouteSearch(trimmed));
    };

    return (
        <form className="relative w-full group" onSubmit={handleSubmit}>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#6C5CE7] transition-colors">
                <IoSearch className="h-5 w-5" />
            </span>
            <Input
                type="search"
                name="q"
                value={query}
                onChange={handleChange}
                placeholder="Search blogs, topics, or @username..."
                className="h-12 w-full rounded-full border-none bg-gray-50 pl-12 pr-16 text-[15px] text-gray-900 placeholder-gray-400 shadow-sm focus:bg-white focus:ring-2 focus:ring-[#6C5CE7]/30"
            />
            <button
                type="submit"
                aria-label="Search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-[#6C5CE7] px-4 py-1.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#5b4bcc]"
            >
                Go
            </button>
        </form>
    );
};

export default SearchBox;