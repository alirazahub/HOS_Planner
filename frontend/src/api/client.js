const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function planTrip(payload) {
  const res = await fetch(`${API_BASE}/api/trips/plan/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      data.detail ||
      Object.values(data).flat().join(' ') ||
      'Trip could not be planned. Check the locations and try again.';
    throw new Error(detail);
  }
  return data;
}
