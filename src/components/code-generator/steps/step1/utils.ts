
// Enhanced debounce with cleanup
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): [(...args: Parameters<T>) => void, () => void] {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
    if (callNow) func(...args);
  };
  
  const cleanup = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return [debounced, cleanup];
}

export const getConnectionQualityColor = (quality?: string) => {
  switch (quality) {
    case 'excellent': return 'text-green-400';
    case 'good': return 'text-yellow-400';
    case 'poor': return 'text-red-400';
    default: return 'text-gray-400';
  }
};
