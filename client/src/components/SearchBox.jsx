import React from "react";
import { Input } from "./ui/input";
import { IoSearch } from "react-icons/io5";

const SearchBox = () => {
    return (
        <form className="relative">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
                placeholder="Search here..." 
                className="h-9 rounded-full bg-gray-50 pl-10" 
            />
        </form>
    );
};

export default SearchBox;