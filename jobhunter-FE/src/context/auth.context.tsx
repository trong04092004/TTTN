import Loading from "@/components/share/loading";
import { callFetchAccount, callLogout } from "@/config/api";
import { IGetAccount } from "@/types/backend";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useState, useEffect } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";

interface IAuthContext {
  isAuthenticated: boolean;
  user: IGetAccount["user"] | null;
  isLoading: boolean;
  appLoading: boolean;
  setUser: (user: IGetAccount["user"] | null) => void;
  login: (user: IGetAccount["user"]) => void;
  logout: () => void;
}

const AuthContext = createContext<IAuthContext | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IGetAccount["user"] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [appLoading, setAppLoading] = useState<boolean>(true);
  // const navigate = useNavigate();

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ["account"],
    queryFn: async () => {
      const res = await callFetchAccount();
      return res.data;
    },
    retry: false,
  });

  useEffect(() => {
    if (isSuccess && data?.user) {
      setUser(data.user);
      setIsAuthenticated(true);
    }
    setAppLoading(isLoading);
  }, [data, isSuccess, isLoading]);

  const login = (userInfo: IGetAccount["user"]) => {
    setUser(userInfo);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    const res = await callLogout();
    if (res && +res.statusCode === 200) {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("access_token");
      message.success("Đăng xuất thành công");
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        appLoading,
        setUser,
        login,
        logout,
      }}
    >
      {/* Giữ Loading component khi đang fetch user lần đầu */}
      {isLoading ? <Loading /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
