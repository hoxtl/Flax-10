import {fetchApi} from './client.js'

export const getReadings = (moduleId) => 
    fetchApi(`/modules/${moduleId}/readings/`);

export const createReading = (moduleId, data) =>
    fetchApi(`/modules/${moduleId}/readings/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });

export const updateReading = (moduleId, readingId, data) =>
    fetchApi(`/modules/${moduleId}/readings/${readingId}/`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });

export const deleteReading = (moduleId, readingId) =>
    fetchApi(`/modules/${moduleId}/readings/${readingId}/`, {
        method: 'DELETE',
    });

export const convertReadingToTask = (readingId) =>
    fetchApi(`/readings/${readingId}/load-task/`, {
        method: 'POST',
    });  

export const getSuggestedReadings = () =>
    fetchApi('/readings/suggested/');

export const getReadingSpeed = () =>
    fetchApi('/readings/speed/');