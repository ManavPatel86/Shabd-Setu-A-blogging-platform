import React, { useState } from "react";
import { Input } from "./ui/input";
import { useNavigate } from "react-router-dom"
import { IoSearch } from "react-icons/io5";
import { RouteSearch } from "@/helpers/RouteName";

const SearchBox = () => {
    const navigate = useNavigate()
    const [query,setQuery] = useState()
    const getInput = (e) => {
        setQuery(e.target.value)
    }
    const handleSubmit = (e) => {
        e.preventDefault()
        navigate(RouteSearch(query))
    }
    return (
        <form className="relative" onSubmit={handleSubmit}>
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input name="q" onInput={getInput}
                placeholder="Search here..." 
                className="h-9 rounded-full bg-gray-50 pl-10" 
            />
        </form>
    );
};

export default SearchBox;