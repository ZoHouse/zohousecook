import { render } from "@testing-library/react";

import Zud from "./zud";

describe("Zud", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<Zud />);
    expect(baseElement).toBeTruthy();
  });
});
