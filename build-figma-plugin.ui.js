import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// Custom esbuild configuration for the UI entry point
export default function (buildOptions) {
    return {
        ...buildOptions,
        define: {
            ...buildOptions.define,
            'process.env.NODE_ENV': JSON.stringify('production')
        }
    }
}

// PostCSS plugins for Tailwind CSS
export function postcssPlugins() {
    return [tailwindcss, autoprefixer]
}
