import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from './LoadingSpinner';

// Enhanced PrivateRoute with role-based access control
// requiredRoles can be: 'admin', 'officer', or an array like ['admin', 'officer']
export default function PrivateRoute({ children, requiredRoles = null }) {
  const { currentUser, loading, userRole, isAdmin, isOfficer } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (loading) {
    return <LoadingSpinner fullscreen message={t('checkingAuth')} />;
  }

  // If no user, redirect to login
  if (!currentUser && !loading) {
    // Redirect to login while preserving the attempted URL
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ 
          message: t('requiresAuth'),
          from: location.pathname 
        }}
      />
    );
  }

  // If requiredRoles is specified, check if user has the required role
  if (requiredRoles && !loading) {
    let hasRequiredRole = false;

    // Handle both string and array formats
    if (typeof requiredRoles === 'string') {
      // Single role check
      if (requiredRoles === 'admin' && isAdmin) {
        hasRequiredRole = true;
      } else if (requiredRoles === 'officer' && isOfficer) {
        hasRequiredRole = true;
      }
    } else if (Array.isArray(requiredRoles)) {
      // Multiple role check (any of the specified roles is sufficient)
      if ((requiredRoles.includes('admin') && isAdmin) ||
          (requiredRoles.includes('officer') && isOfficer)) {
        hasRequiredRole = true;
      }
    }

    // Redirect if user doesn't have the required role
    if (!hasRequiredRole) {
      // Determine the appropriate error message based on the user's role
      let errorMessage = t('roleBasedAccess');
      
      if (userRole === 'user') {
        errorMessage = t('userAccessRestricted');
      } else if (requiredRoles === 'admin' || (Array.isArray(requiredRoles) && requiredRoles.includes('admin') && !requiredRoles.includes('officer'))) {
        errorMessage = t('adminOnlyFeature');
      }
      
      return (
        <Navigate 
          to="/" 
          replace 
          state={{ 
            message: t('permissionDenied'),
            error: errorMessage
          }}
        />
      );
    }
  }

  // User is authenticated and has required role (if specified)
  return children;
}
