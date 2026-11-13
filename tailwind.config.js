/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
            },
            colors: {
                primary: '#8C0813',
                'primary-hover': '#A60A27',
                secondary: '#40060B',
                text: '#0D0000',
                background: '#fcf3f3',
                accent: '#ffa3a3',
                'accent-hover': '#ff8080',
                edit: '#085F8C',
                'edit-hover': '#0a74b0',
                complement: '#088C28',
                'complement-hover': '#16371E',
            },
        },
    },
    plugins: [],
}
