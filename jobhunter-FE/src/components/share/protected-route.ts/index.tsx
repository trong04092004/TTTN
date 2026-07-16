import { Navigate } from "react-router-dom";
import NotPermitted from "./not-permitted";
import Loading from "../loading";
import { useAuth } from "@/context/auth.context";

const RoleBaseRoute = (props: any) => {
  const { user } = useAuth();
  const userRole = user?.role?.name;

  if (userRole !== "NORMAL_USER") {
    return <>{props.children}</>;
  } else {
    return <NotPermitted />;
  }
};

const ProtectedRoute = (props: any) => {
  const { isAuthenticated, appLoading } = useAuth();

  return (
    <>
      {appLoading === true ? (
        <Loading />
      ) : (
        <>
          {isAuthenticated === true ? (
            <>
              <RoleBaseRoute>{props.children}</RoleBaseRoute>
            </>
          ) : (
            <Navigate to="/login" replace />
          )}
        </>
      )}
    </>
  );
};

export default ProtectedRoute;
