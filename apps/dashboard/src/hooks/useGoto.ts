import { useRouter } from "next/router";

const useGoto = () => {
  const router = useRouter();
  return (path: string, newTab?: boolean) => {
    if (newTab === true) {
      window.open(path, "_blank");
    } else {
      router.push(path);
    }
  };
};

export default useGoto;
