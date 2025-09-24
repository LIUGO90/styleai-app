import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";

// 路由保护配置
export const ROUTE_CONFIG = {
  // 需要认证的路由
  PROTECTED_ROUTES: ["/tabs", "/ChatScreen", "/styling"],
  // 游客路由（已登录用户不能访问）
  GUEST_ROUTES: ["/Login", "/signup", "/forgot-password"],
  // 公开路由（任何人都可以访问）
  PUBLIC_ROUTES: ["/", "/index"],
};

// 检查路由是否需要认证
export const isProtectedRoute = (pathname: string): boolean => {
  return ROUTE_CONFIG.PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
};

// 检查路由是否为游客路由
export const isGuestRoute = (pathname: string): boolean => {
  return ROUTE_CONFIG.GUEST_ROUTES.some((route) => pathname.startsWith(route));
};

// 检查路由是否为公开路由
export const isPublicRoute = (pathname: string): boolean => {
  return ROUTE_CONFIG.PUBLIC_ROUTES.some((route) => pathname === route);
};

// 认证中间件Hook
export const useAuthMiddleware = (currentPath: string) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // 如果是公开路由，直接允许访问
    if (isPublicRoute(currentPath)) {
      return;
    }

    // 如果是受保护的路由，检查用户是否已登录
    if (isProtectedRoute(currentPath)) {
      if (!user) {
        console.log(
          "Protected route accessed without auth, redirecting to login",
        );
        router.replace("/Login");
        return;
      }
    }

    // 如果是游客路由，检查用户是否已登录
    if (isGuestRoute(currentPath)) {
      if (user) {
        console.log("Guest route accessed with auth, redirecting to main app");
        router.replace("/tabs");
        return;
      }
    }
  }, [user, loading, currentPath, router]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    canAccess:
      isPublicRoute(currentPath) ||
      (isProtectedRoute(currentPath) && !!user) ||
      (isGuestRoute(currentPath) && !user),
  };
};

// 路由权限检查函数
export const checkRoutePermission = (
  pathname: string,
  isAuthenticated: boolean,
): { canAccess: boolean; redirectTo?: string } => {
  // 公开路由，任何人都可以访问
  if (isPublicRoute(pathname)) {
    return { canAccess: true };
  }

  // 受保护的路由，需要认证
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      return { canAccess: false, redirectTo: "/Login" };
    }
    return { canAccess: true };
  }

  // 游客路由，已登录用户不能访问
  if (isGuestRoute(pathname)) {
    if (isAuthenticated) {
      return { canAccess: false, redirectTo: "/tabs" };
    }
    return { canAccess: true };
  }

  // 默认允许访问
  return { canAccess: true };
};
