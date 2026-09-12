import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Hero.tsx serves the family/van background at quality 85 (the default
    // 75 was visibly softer on such a large, prominent photo); Next 16
    // requires every quality value used to be allow-listed here.
    qualities: [75, 85],
  },
};

export default nextConfig;
