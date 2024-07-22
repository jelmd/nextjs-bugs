/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	bundlePagesRouterDependencies: true,
	webpack: function (config, options) {
		if (!config.watchOptions) {
			config.watchOptions = {
				aggregateTimeout: 5,
				//followSymlinks: false,
				ignored: [ '**/node_modules', '**/.git/**', '**/.next/**' ]
			};
		}
		config.module.rules.push({
			test: /\.svg$/i,
			issuer: /\.[jt]sx?$/,
			use: ['@svgr/webpack'],
		})
		return config;
	},
	experimental: {
		/* appDir: true, */
		instrumentationHook: true,
		reactCompiler: false,
		turbo: {
			rules: {
				'*.svg': {
					loaders: ['@svgr/webpack'],
					as: '*.js',
				}
			},
			resolveExtensions: [
				'.mdx',
				'.tsx',
				'.ts',
				'.jsx',
				'.js',
				'.mjs',
				'.json',
			],
		},
	}
};
/*
process.on('unhandledRejection', error => {
	console.log('unhandledRejection', error);
});
*/
export default nextConfig;
