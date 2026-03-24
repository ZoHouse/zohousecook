import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { base, goerli, mainnet, polygon, sepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Zo World",
  projectId: "43871bdb68fb1bc6696326b1a0714368",
  chains: [sepolia, mainnet, goerli, polygon, base],
  ssr: true,
  appIcon: "https://static.cdn.zo.xyz/media/zo-v2-dynamic.svg",
  appUrl: "https://zo.xyz",
  appDescription: "World's most exclusive web3 club",
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
    [base.id]: http(),
    [goerli.id]: http(),
    [polygon.id]: http(),
  },
});
