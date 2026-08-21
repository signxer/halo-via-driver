import {defineConfig} from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 纯本地应用:所有资源(定义 JSON、底图、字体)都在 public/ 下,无需任何代理
  server: {},
})
