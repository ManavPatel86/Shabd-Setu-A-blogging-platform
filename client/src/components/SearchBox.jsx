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
        <form className="relative w-full" onSubmit={handleSubmit}>
            <Input
                type="search"
                name="q"
                value={query}
                onChange={handleChange}
                placeholder="Search blogs, authors..."
                className="h-9 w-full rounded-full bg-gray-50 pl-10 pr-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <button
                type="submit"
                aria-label="Search"
                className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500 text-white transition hover:bg-blue-600"
            >
                <IoSearch className="h-4 w-4" />
            </button>
        </form>
    );
};

export default SearchBox;