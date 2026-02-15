import {useState, useEffect} from 'react';
import {getModules, isEnrolledIn} from '../api/module_api.js';

export default function ModulesPage() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getModules()
        .then(setModules)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, []);

if (loading) return <p> Loading Modules!</p>;

return (
    <div className = {styles.container}>
        <h1> Modules </h1>
        <div> 
            {modules.map(module => (
                <div key = {module.id}>
                    <h3> {module.module_name}</h3>
                    <p> {module.module_code}</p>
        </div>
        ))}
    </div>
    </div>
);
}
