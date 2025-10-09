import "@testing-library/jest-dom";
import React from "react";

jest.mock("next/link", () => {
  return ({ children, ...props }: any) => React.createElement("a", props, children);
});
