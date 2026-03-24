import Icon from "@zo/assets/icons";
import React, { useState } from "react";

interface SearchProps {}

const Search: React.FC<SearchProps> = () => {
  const [searchText, setsearchText] = useState("");
  const clearSearch = () => {
    setsearchText("");
  };

  return (
    <div className="flex items-center space-x-3 justify-between w-[240px] h-12 px-4 border border-zui-light bg-zui-lighter">
      <Icon name="Search" size={16} fill="#FFF" />
      <input
        type="text"
        value={searchText}
        onChange={(e) => setsearchText(e.target.value)}
        className="w-full text-xs caret-zui-neon h-full bg-transparent focus:outline-none"
        placeholder="Search"
      />
      {searchText ? (
        <button
          className="relative flex items-center justify-center"
          onClick={clearSearch}
        >
          <Icon name="CrossCircle" size={16} fill="#5A5A5A" />
        </button>
      ) : null}
    </div>
  );
};

export default Search;
