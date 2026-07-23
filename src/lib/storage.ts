const MANAGER_ID_KEY = 'fpl_manager_id';

export function getManagerId(): string | null {
  return localStorage.getItem(MANAGER_ID_KEY);
}

export function setManagerId(id: string): void {
  localStorage.setItem(MANAGER_ID_KEY, id);
}

export function clearManagerId(): void {
  localStorage.removeItem(MANAGER_ID_KEY);
}
