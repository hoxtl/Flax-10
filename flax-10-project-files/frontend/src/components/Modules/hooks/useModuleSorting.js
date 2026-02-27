import {useState} from 'react';
import { getDepartment, sortModules } from '../utils/moduleUtils';

const PAGE_SIZE = 9;

export default function useModuleSorting(modules) {
    const [current_page, setCurrentPage] = useState(1);
    const [department, setDepartment] = useState('all');
    const [sort_by, setSortBy] = useState('name');

    const by_department = department === 'all' ? modules : 
    modules.filter(m=>getDepartment(m.module_code) === department);
    const results =  sortModules(by_department, sort_by);
    const page_modules = results.slice((current_page - 1) * PAGE_SIZE, current_page*PAGE_SIZE);
    const total_pages = Math.ceil(results.length / PAGE_SIZE);

    function handleNewDepartment(department) {
        setDepartment(department); setCurrentPage(1); }
    function handleNewSort(sort) {setSortBy(sort); setCurrentPage(1);}
    return {page_modules, results, department, sort_by, current_page, total_pages, handleNewDepartment, handleNewSort, setCurrentPage }
}   