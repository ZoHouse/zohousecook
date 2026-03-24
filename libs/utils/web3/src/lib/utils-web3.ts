import { getAddress, isAddress } from "viem";

export const formatAddress = (address: string) =>
  address
    ? `${address.slice(0, 6)}...${address.slice(address.length - 4)}`
    : "";

export const isValidAddress = isAddress;

export const toChecksumAddress = (address: any) =>
  isValidAddress(address) ? getAddress(address) : address;

export const isSameAddress = (address1: string, address2: string) =>
  toChecksumAddress(address1) === toChecksumAddress(address2);
