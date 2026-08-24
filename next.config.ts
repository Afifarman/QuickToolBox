// The real configuration (including the production security headers) lives in
// next.config.mjs, which is the file Next currently resolves. This file used to
// export an empty config, so if resolution order ever changed the app would
// silently ship with no security headers. Re-export the real config instead.
import nextConfig from './next.config.mjs';

export default nextConfig;
