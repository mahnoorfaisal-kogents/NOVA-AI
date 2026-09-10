/**
 * Thin navigation compatibility layer over TanStack Router.
 *
 * The NOVA views were written against a `useNavigate(path)` style API, so this
 * module adapts TanStack Router's typed API to that shape in one place instead
 * of rewriting every view.
 */
import {
  Link,
  useLocation as useTanstackLocation,
  useNavigate as useTanstackNavigate,
  useParams as useTanstackParams,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useCallback } from "react";

export function useNavigate() {
  const navigate = useTanstackNavigate();
  return useCallback(
    (to: string, options?: { replace?: boolean }) => {
      void navigate({ to, replace: options?.replace ?? false });
    },
    [navigate],
  );
}

export function useLocation() {
  return useTanstackLocation();
}

export function useParams<T extends Record<string, string | undefined>>(): T {
  return useTanstackParams({ strict: false } as never) as T;
}

export function NavLink({
  to,
  className,
  title,
  children,
}: {
  to: string;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={className} title={title}>
      {children}
    </Link>
  );
}

export { Link };
