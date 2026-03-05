import { useState, useRef, useEffect} from 'react';
import {ChevronDown, Check} from 'lucide-react';
import styles from './ModuleDropdown.module.css';

function useDropdown() {
    const [is_open, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return() => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return {is_open, setIsOpen, ref};
}

function DropdownOption({opt, value, onChange, setIsOpen}) {
    return (
        <button className={styles.option} onClick={() => {onChange(opt.value); setIsOpen(false);}}>
            <span>{opt.label}</span>
            {value === opt.value && <Check size={13} className={styles.check} />}
        </button> 
    )
}

export default function ModuleDropdown({value, onChange, options}) {
    const {is_open, setIsOpen, ref} = useDropdown();
    const selected = options.find(opt => opt.value === value);
    return (
        <div className={styles.wrapper} ref={ref}>
            <button className={styles.trigger} onClick={()=> setIsOpen(!is_open)}>
                <span>{selected?.label}</span>
                <ChevronDown size={14} className={`${styles.chevron} ${is_open ? styles.chevronOpen: ''}`} />
            </button>
            {is_open && (
                <div className={styles.menu}>
                    {options.map(opt => <DropdownOption key = {opt.value} opt={opt} value={value} 
                    onChange={onChange} setIsOpen={setIsOpen} />)}
                </div>
            )}
        </div> 
    );
}