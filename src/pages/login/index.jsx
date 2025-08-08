import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import LoginFooter from './components/LoginFooter';
import LoginBackground from './components/LoginBackground';
import { supabase } from '../../utils/supabase';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (formData) => {
    try {
      setIsLoading(true);
      setError('');
      
      const { email, password, rememberMe } = formData;
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.user) {
        // Guardar preferencia de "Recordarme"
        if (rememberMe) {
          localStorage.setItem('rememberLogin', 'true');
        }
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <LoginBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Tarjeta principal de login */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <LoginHeader />
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <LoginForm 
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
            />
          </div>
          
          {/* Ayuda para credenciales de prueba */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
            <p className="font-medium mb-2">Credenciales de prueba:</p>
            <div className="space-y-1">
              <p><strong>Admin:</strong> admin@agropais.com / admin123</p>
            </div>
          </div>
          
          <LoginFooter />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;