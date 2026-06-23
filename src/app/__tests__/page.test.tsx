/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react";
import { redirect } from "next/navigation";
import Home from "../page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects to /board", () => {
    render(<Home />);

    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/board");
  });
});
