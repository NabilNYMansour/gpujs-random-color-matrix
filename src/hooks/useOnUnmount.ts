import { useEffect, useRef } from "react";

const useOnUnmount = (callback: () => void) => {
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    return () => callback();
  }, []);
}

export default useOnUnmount;