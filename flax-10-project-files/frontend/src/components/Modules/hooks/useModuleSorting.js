/* Hook for managing module sorting, filtering, and pagination. */
import { useState } from 'react';
import { applyFiltersAndSort } from '../utils/moduleUtils.js';

const PAGE_SIZE = 15;

function paginate(items, page) {
    return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

export default function useModuleSorting(modules) {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [sortBy, setSortBy] = useState('name');

    const toggleCourse = (course) => {
        setSelectedCourses(prev => prev.includes(course) ? prev.filter(c => c !== course) : [...prev, course]);
        setCurrentPage(1);
    };
    const handleNewSort = (sort) => { setSortBy(sort); setCurrentPage(1); };
    const clearFilters = () => { setSelectedCourses([]); setCurrentPage(1); };

    const results = applyFiltersAndSort(modules, selectedCourses, sortBy);
    const pageModules = paginate(results, currentPage);
    const totalPages = Math.ceil(results.length / PAGE_SIZE);

    return { pageModules, results, selectedCourses, toggleCourse, sortBy, currentPage, totalPages, handleNewSort, setCurrentPage, clearFilters };
}
