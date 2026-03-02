import {useState} from 'react';
import { applyFiltersAndSort } from '../utils/moduleUtils.js';

const PAGE_SIZE = 9;

export default function useModuleSorting(modules) {
    const [currentPage, setCurrentPage] = useState(1);
    const [department, setDepartment] = useState('all');
    const [sortBy, setSortBy] = useState('name');

    const results = applyFiltersAndSort(modules, department, sortBy);
    const pageModules = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const totalPages = Math.ceil(results.length / PAGE_SIZE);

    const handleNewDepartment = (dept) => { setDepartment(dept); setCurrentPage(1); };
    const handleNewSort = (sort) => { setSortBy(sort); setCurrentPage(1); };

    return { pageModules, results, department, sortBy, currentPage, totalPages, handleNewDepartment, handleNewSort, setCurrentPage };
}   