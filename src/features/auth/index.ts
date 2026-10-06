'use client';

export { AuthGuard } from './components/AuthGuard';
export { LoginPage } from './pages/LoginPage';
export { RegisterPage } from './pages/RegisterPage';
export { ResetPasswordPage } from './pages/ResetPasswordPage';
export { AccountPage } from './pages/AccountPage';
export { AccountDeletionInfoPage } from './pages/AccountDeletionInfoPage';
export { useLogin } from './hooks/useLogin';
export { useRegister } from './hooks/useRegister';
export { useLogout } from './hooks/useLogout';
export { useCurrentUser } from './hooks/useCurrentUser';
export { useIsAuthenticated } from '@shared/hooks';
export type { AuthUser } from './types/auth.types';
