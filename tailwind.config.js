export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0f1117',
        surface: '#161b27',
        elevated: '#1c2333',
        overlay: '#232d42',
        border: '#2a3348',
        accent: {
          DEFAULT: '#6366f1',
          hover: '#5558e8',
          dim: 'rgba(99,102,241,0.12)',
        },
        text: {
          primary: '#f1f5f9',
          secondary: '#8896b3',
          muted: '#4a5568',
        },
        status: {
          online: '#22c55e',
          error: '#ef4444',
          success: '#22c55e',
          warning: '#f59e0b',
        }
      },
      fontSize: {
        '2xs': '11px',
        xs: '12px',
        sm: '13px',
        base: '14px',
        md: '16px',
        lg: '20px',
        xl: '24px',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        full: '9999px',
      },
      spacing: {
        '4.5': '18px',
      }
    },
  },
  plugins: [],
}