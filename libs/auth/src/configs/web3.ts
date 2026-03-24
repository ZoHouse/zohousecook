const env = process.env.NODE_ENV as any;

console.log("Config running in", env);

const config = {
  ALCHEMY_ID: "",
  ALCHEMY_NODE: "",
  CHAIN_ID: 0,
  BASE_API: "",
  MAIN_NET_NODE:
    "https://eth-mainnet.alchemyapi.io/v2/X1ZM3gbikeqwdi-d1YAMMHegP8UW8yw-",
  RINKEBY_NODE:
    "https://eth-rinkeby.alchemyapi.io/v2/RyWVK13W4RqzsyClihs7AlN7NmPPxH4M",
};

if (env === "production") {
  config.ALCHEMY_ID = "X1ZM3gbikeqwdi-d1YAMMHegP8UW8yw-";
  config.ALCHEMY_NODE = config.MAIN_NET_NODE;
  config.CHAIN_ID = 1;
  config.BASE_API = "https://zo.xyz/api";
} else if (env === "staging") {
  config.ALCHEMY_ID = "RyWVK13W4RqzsyClihs7AlN7NmPPxH4M";
  config.ALCHEMY_NODE = config.RINKEBY_NODE;
  config.CHAIN_ID = 4;
  config.BASE_API = "https://nsfp.zo.xyz/api";
} else {
  // config.ALCHEMY_NODE =
  //   config.RINKEBY_NODE;
  // config.CHAIN_ID = 4;
  // config.BASE_API = "http://localhost:4202/api";
  // config.FOUNDER_CONTRACT = founderTest;
  config.ALCHEMY_ID = "X1ZM3gbikeqwdi-d1YAMMHegP8UW8yw-";
  config.ALCHEMY_NODE = config.MAIN_NET_NODE;
  config.CHAIN_ID = 1;
  config.BASE_API = "https://zo.xyz/api";
}

export default config;
