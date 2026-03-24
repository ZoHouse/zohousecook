export function shortenEthereumAddress(
  address: string,
  prefixLength: number = 2,
  postfixLength: number = 4
): string {
  if (!address || address.length < prefixLength + postfixLength + 3) {
    return address; // If the address is too short, return the original
  }

  const prefix = address.substring(0, prefixLength + 2); // Include "0x" prefix
  const postfix = address.substring(address.length - postfixLength);

  return `${prefix}...${postfix}`;
}
