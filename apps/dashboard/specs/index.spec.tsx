import React from "react";
import { render } from "@testing-library/react";
import { useRouter } from "next/router";

import Index from "../src/pages/index";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Mock @zo/auth
jest.mock("@zo/auth", () => ({
  useProfile: jest.fn(),
  useAuth: jest.fn(),
}));

// Mock @zo/avatar-renderer
jest.mock("@zo/avatar-renderer", () => ({
  generateRandomAvatar: jest.fn(() => ({
    body: "bros",
    head: "round",
    expression: "neutral",
    accessories: [],
  })),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock dashboard components
jest.mock("../src/components/dashboard", () => {
  const React = require("react");
  return {
    Achievements: () => React.createElement("div", { "data-testid": "achievements" }),
    DashboardHeader: () => React.createElement("div", { "data-testid": "dashboard-header" }),
    LiveUpdatesPill: () => React.createElement("div", { "data-testid": "live-updates-pill" }),
    QuestContainer: () => React.createElement("div", { "data-testid": "quest-container" }),
    ZoBalance: () => React.createElement("div", { "data-testid": "zo-balance" }),
    CultureLeaderboard: () => React.createElement("div", { "data-testid": "culture-leaderboard" }),
  };
});

// Mock lobby components
jest.mock("../src/components/lobby/LobbyScene", () => {
  const React = require("react");
  return {
    LobbyScene: () => React.createElement("div", { "data-testid": "lobby-scene" }),
  };
});

describe("Index (Dashboard)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      basePath: "",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      replace: jest.fn(),
    });
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve("<svg></svg>"),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should render successfully", () => {
    const { baseElement } = render(<Index />);
    expect(baseElement).toBeTruthy();
  });

  it("should render LobbyScene component", () => {
    const { getByTestId, queryByTestId } = render(<Index />);
    const lobbyScene = queryByTestId("lobby-scene");
    expect(lobbyScene).toBeTruthy();
  });

  it("should render dashboard header", () => {
    const { getByTestId, queryByTestId } = render(<Index />);
    const dashboardHeader = queryByTestId("dashboard-header");
    expect(dashboardHeader).toBeTruthy();
  });
});
