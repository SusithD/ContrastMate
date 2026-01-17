// Custom esbuild configuration for the main entry point
export default function (buildOptions) {
    return {
        ...buildOptions,
        define: {
            ...buildOptions.define,
            'process.env.NODE_ENV': JSON.stringify('production')
        }
    }
}
