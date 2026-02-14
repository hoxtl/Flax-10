const API_BASE = 'http://localhost:8000/api';

export async function getUserSettings() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/settings/`, {
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  
  return response.json();
}

export async function updateUserSettings(settings) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/settings/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update settings');
  }
  
  return response.json();
}
