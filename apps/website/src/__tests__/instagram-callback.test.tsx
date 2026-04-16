import { render, waitFor } from "@testing-library/react";

jest.mock("@zo/auth", () => ({
  useProfile: jest.fn(() => ({ profile: { code: "ABC123" } })),
}));
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

import { useRouter } from "next/router";

// Mock fetch globally
const mockFetch = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = mockFetch;

// Mock localStorage
const mockStorage: Record<string, string> = {
  "zo-web-token": "test-bearer-token",
  "zo-web-device-id": "dev-123",
  "zo-web-device-secret": "sec-456",
};
Object.defineProperty(window, "localStorage", {
  value: { getItem: (key: string) => mockStorage[key] || null },
});

describe("Instagram OAuth callback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  test("strips #_ from code and POSTs to Zo backend", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: { code: "META_CODE_123#_" },
      push: mockPush,
      isReady: true,
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        instagram: { id: "123", username: "johndoe", account_type: "CREATOR" },
      }),
    });

    const { default: CallbackPage } = await import(
      "../pages/auth/instagram"
    );
    render(<CallbackPage />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/oauth/instagram/connect/"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ code: "META_CODE_123" }),
        })
      );
      expect(mockPush).toHaveBeenCalledWith("/passport?ig_connected=true");
    });
  });

  test("redirects with error when no code param", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      query: {},
      push: mockPush,
      isReady: true,
    });

    const { default: CallbackPage } = await import(
      "../pages/auth/instagram"
    );
    render(<CallbackPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/passport?ig_error=no_code");
    });
  });
});
