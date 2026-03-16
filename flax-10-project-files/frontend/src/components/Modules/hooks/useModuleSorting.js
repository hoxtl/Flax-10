import {useState} from 'react';
import { applyFiltersAndSort } from '../utils/moduleUtils.js';

const PAGE_SIZE = 15;

export default function useModuleSorting(modules) {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [sortBy, setSortBy] = useState('name');

    const toggleCourse = (course) => {
        setSelectedCourses(prev => prev.includes(course) ? prev.filter(c => c !== course) : [...prev, course]);
        setCurrentPage(1);
    };

    const results = applyFiltersAndSort(modules, selectedCourses, sortBy);
    const pageModules = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const totalPages = Math.ceil(results.length / PAGE_SIZE);

    const handleNewSort = (sort) => { setSortBy(sort); setCurrentPage(1); };

    return { pageModules, results, selectedCourses, toggleCourse, sortBy, currentPage, totalPages, handleNewSort, setCurrentPage };
}