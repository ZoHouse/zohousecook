import { reverseGeocode } from "./geocoding";

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

describe("reverseGeocode", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY = "TEST_KEY";
  });

  it("returns place_name and place_id from a locality result", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "OK",
        results: [
          {
            place_id: "ChIJ_TEST_LOCALITY",
            formatted_address: "Bengaluru, Karnataka, India",
            types: ["locality", "political"],
            address_components: [
              { long_name: "Bengaluru", types: ["locality"] },
            ],
          },
        ],
      }),
    });

    const result = await reverseGeocode(12.97, 77.74);
    expect(result).not.toBeNull();
    expect(result?.place_name).toBe("Bengaluru");
    expect(result?.place_id).toBe("ChIJ_TEST_LOCALITY");
  });

  it("falls back to administrative_area_level_2 when locality returns nothing", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ZERO_RESULTS", results: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [
            {
              place_id: "ChIJ_AREA_2",
              formatted_address: "Bangalore Urban, India",
              types: ["administrative_area_level_2"],
              address_components: [
                { long_name: "Bangalore Urban", types: ["administrative_area_level_2"] },
              ],
            },
          ],
        }),
      });

    const result = await reverseGeocode(12.97, 77.74);
    expect(result?.place_id).toBe("ChIJ_AREA_2");
  });

  it("returns null when all fallbacks return zero results", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ZERO_RESULTS", results: [] }),
    });
    const result = await reverseGeocode(0, 0);
    expect(result).toBeNull();
  });

  it("returns null and warns when API key is missing", async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const result = await reverseGeocode(12.97, 77.74);
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_GOOGLE_MAPS_KEY")
    );
    consoleSpy.mockRestore();
  });
});
