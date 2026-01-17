// PostCSS configuration for Tailwind CSS processing
export default function (buildOptions) {
    return {
        ...buildOptions,
        define: {
            ...buildOptions.define,
            'process.env.NODE_ENV': JSON.stringify('production')
        }
    }
}
