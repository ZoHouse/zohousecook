import { useAuth } from "@zo/auth";
import { Button } from "antd";

const AccessDenied = () => {
  const { logout } = useAuth();

  return (
    <div className="flex w-full h-full">
      <div className="flex-1 overflow-x-hidden">
        <div className="flex flex-col items-center w-full h-full py-24 border border-zui-light gap-2">
          <span className="text-xl font-semibold mt-4">Access Denied</span>
          <span className="text-zui-silver">
            You don&apos;t have access to this app. Try logging again.
          </span>
          <Button className="mt-4" type="primary" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
