import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Para simular carregamento

  // Simulação de login
  const login = async (email, password) => {
    setLoading(true);
    console.log("Tentativa de login com:", email, password);
    // Em uma aplicação real, haveria uma chamada à API aqui
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email === 'user@example.com' && password === 'password') {
          const passengerUser = { id: '1', email, name: 'Usuário Passageiro Teste', role: 'passenger', phone: '11987654321' };
          setUser(passengerUser);
          setIsAuthenticated(true);
          console.log("Login de passageiro bem-sucedido:", passengerUser);
          resolve(passengerUser);
        } else if (email === 'driver@example.com' && password === 'password') {
          const driverUser = { id: '2', email, name: 'Motorista Teste', role: 'driver', phone: '11912345678' };
          setUser(driverUser);
          setIsAuthenticated(true);
          console.log("Login de motorista bem-sucedido:", driverUser);
          resolve(driverUser);
        } else {
          console.log("Credenciais inválidas");
          reject(new Error('Credenciais inválidas'));
        }
        setLoading(false);
      }, 500);
    });
  };

  // Simulação de cadastro de passageiro
  const registerPassenger = async (userData) => {
    setLoading(true);
    console.log("Registrando passageiro:", userData);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = { id: Date.now().toString(), ...userData, role: 'passenger', phone: userData.phone || '' };
        console.log("Passageiro registrado:", newUser);
        // setUser(newUser); // Opcional: logar automaticamente após registro
        // setIsAuthenticated(true);
        setLoading(false);
        resolve(newUser);
      }, 500);
    });
  };

  // Simulação de cadastro de motorista
  const registerDriver = async (driverData) => {
    setLoading(true);
    console.log("Registrando motorista:", driverData);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newDriver = { id: Date.now().toString(), ...driverData, role: 'driver', phone: driverData.phone || '' };
        console.log("Motorista registrado:", newDriver);
        setLoading(false);
        resolve(newDriver);
      }, 500);
    });
  };

  const logout = () => {
    setLoading(true);
    setUser(null);
    setIsAuthenticated(false);
    console.log("Usuário deslogado");
    setLoading(false);
  };

  // Simulação de atualização do perfil do usuário
  const updateUserProfile = async (newUserData) => {
    setLoading(true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (user) {
          // Atualiza apenas os campos permitidos (ex: name, phone). Email não é atualizado.
          const updatedUser = {
            ...user,
            name: newUserData.name !== undefined ? newUserData.name : user.name,
            phone: newUserData.phone !== undefined ? newUserData.phone : user.phone,
            // photoURL: newUserData.photoURL !== undefined ? newUserData.photoURL : user.photoURL, // Exemplo se fosse atualizar foto
          };
          setUser(updatedUser);
          console.log("Perfil do usuário atualizado:", updatedUser);
          setLoading(false);
          resolve(updatedUser);
        } else {
          setLoading(false);
          reject(new Error("Nenhum usuário logado para atualizar."));
        }
      }, 500);
    });
  };

  const value = {
    isAuthenticated,
    user,
    loading, // Exporta o estado de loading
    login,
    logout,
    registerPassenger,
    registerDriver,
    updateUserProfile, // Exporta a nova função
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
