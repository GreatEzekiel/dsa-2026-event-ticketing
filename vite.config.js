import react from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import compilerPkg from 'babel-plugin-react-compiler'

// babel-plugin-react-compiler is CommonJS; wrap its plugin as a preset
const reactCompilerPreset = () => ({
  plugins: [[compilerPkg.default ?? compilerPkg, {}]],
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
