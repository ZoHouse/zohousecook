import { ChangeEventHandler, useState } from "react";

interface ResetFunction {
  (): void;
}

interface Bind<T> {
  value: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: ChangeEventHandler<any>;
}

function useInput<T>(initialValue: T): [T, Bind<T>, ResetFunction] {
  const [value, setValue] = useState<T>(initialValue);

  const reset = () => {
    setValue(initialValue);
  };

  const bind: Bind<T> = {
    value,
    onChange: (e) => {
      setValue(e.target.value);
    },
  };

  return [value, bind, reset];
}

export default useInput;
