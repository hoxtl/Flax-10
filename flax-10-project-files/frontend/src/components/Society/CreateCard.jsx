/*
 * CreateCard renders the entry card for creating a new society.
 */
import ActionCard from './ActionCard';
import { Plus } from 'lucide-react';

export default function CreateCard({ onClick }) {
    return (
        <ActionCard onClick={onClick} text="➕ Create a society">
            <div style={{
                height: '100%',
                width: '100%',
                background: 'linear-gradient(135deg, var(--surface) 0%, var(--border) 100%)'
            }} />
        </ActionCard>
    );
}
