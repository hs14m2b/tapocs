const path = require('path')

module.exports = {
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
      '/index': { page: '/' },
    }
  },
	compress: false,
	output: 'standalone'
//	experimental: {
//		esmExternals: false, // optional
//		externalDir: true, // optional
//		outputFileTracingRoot: path.join(__dirname, '../../'), // monorepo option
//	}
}
