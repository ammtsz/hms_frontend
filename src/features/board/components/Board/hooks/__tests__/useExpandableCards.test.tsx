import { renderHook, act } from "@testing-library/react";
import { useExpandableCards } from "../useExpandableCards";

describe("useExpandableCards", () => {
  it("should initialize with no cards expanded", () => {
    const { result } = renderHook(() => useExpandableCards());

    expect(result.current.isExpanded("scheduled", 1)).toBe(false);
    expect(result.current.isExpanded("checkedIn", 1)).toBe(false);
  });

  it("should expand a scheduled card", () => {
    const { result } = renderHook(() => useExpandableCards());

    act(() => {
      result.current.toggleExpansion("scheduled", 1);
    });

    expect(result.current.isExpanded("scheduled", 1)).toBe(true);
    expect(result.current.isExpanded("checkedIn", 1)).toBe(false);
  });

  it("should expand a checkedIn card", () => {
    const { result } = renderHook(() => useExpandableCards());

    act(() => {
      result.current.toggleExpansion("checkedIn", 2);
    });

    expect(result.current.isExpanded("checkedIn", 2)).toBe(true);
    expect(result.current.isExpanded("scheduled", 2)).toBe(false);
  });

  it("should collapse a card when toggled twice", () => {
    const { result } = renderHook(() => useExpandableCards());

    act(() => {
      result.current.toggleExpansion("scheduled", 1);
    });

    expect(result.current.isExpanded("scheduled", 1)).toBe(true);

    act(() => {
      result.current.toggleExpansion("scheduled", 1);
    });

    expect(result.current.isExpanded("scheduled", 1)).toBe(false);
  });

  it("should collapse previous card when expanding another in the same column", () => {
    const { result } = renderHook(() => useExpandableCards());

    act(() => {
      result.current.toggleExpansion("scheduled", 1);
    });

    expect(result.current.isExpanded("scheduled", 1)).toBe(true);

    act(() => {
      result.current.toggleExpansion("scheduled", 2);
    });

    expect(result.current.isExpanded("scheduled", 1)).toBe(false);
    expect(result.current.isExpanded("scheduled", 2)).toBe(true);
  });

  it("should allow different cards to be expanded in different columns", () => {
    const { result } = renderHook(() => useExpandableCards());

    act(() => {
      result.current.toggleExpansion("scheduled", 1);
      result.current.toggleExpansion("checkedIn", 2);
    });

    expect(result.current.isExpanded("scheduled", 1)).toBe(true);
    expect(result.current.isExpanded("checkedIn", 2)).toBe(true);
  });

  it("should expand an onGoing card", () => {
    const { result } = renderHook(() => useExpandableCards());

    act(() => {
      result.current.toggleExpansion("onGoing", 1);
    });

    expect(result.current.isExpanded("onGoing", 1)).toBe(true);
  });

  it("should collapse all cards", () => {
    const { result } = renderHook(() => useExpandableCards());

    act(() => {
      result.current.toggleExpansion("scheduled", 1);
      result.current.toggleExpansion("checkedIn", 2);
    });

    expect(result.current.isExpanded("scheduled", 1)).toBe(true);
    expect(result.current.isExpanded("checkedIn", 2)).toBe(true);

    act(() => {
      result.current.collapseAll();
    });

    expect(result.current.isExpanded("scheduled", 1)).toBe(false);
    expect(result.current.isExpanded("checkedIn", 2)).toBe(false);
  });

  it("should expand a completed card", () => {
    const { result } = renderHook(() => useExpandableCards());

    act(() => {
      result.current.toggleExpansion("completed", 1);
    });

    expect(result.current.isExpanded("completed", 1)).toBe(true);
  });
});
