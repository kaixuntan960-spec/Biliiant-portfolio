import { lazy, ComponentType } from 'react';

export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await factory();
      } catch (err) {
        if (i === retries) {
          window.location.reload();
          return await factory();
        }
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
      }
    }
    return await factory();
  });
}
