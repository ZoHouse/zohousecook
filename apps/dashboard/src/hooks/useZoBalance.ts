import { useQueryApi } from "@zo/auth";

export function useZoBalance() {
  const { data, isLoading } = useQueryApi(
    "WEBTHREE_LEDGER_BALANCE",
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as any,
    "",
    ""
  );

  // Response shape: axios { data: { balance: 2011 } }
  const inner = (data as any)?.data;
  const balance: number | undefined = typeof inner?.balance === "number" ? inner.balance : undefined;

  return { balance, isLoading };
}
