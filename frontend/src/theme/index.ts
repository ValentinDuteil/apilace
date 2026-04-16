import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'CenturySchoolbook', 'Times New Roman', serif" },
        body:    { value: "'CenturySchoolbook', 'Times New Roman', serif" },
      },
      colors: {
        brand: {
          50:  { value: '#fbf9f4' },
          100: { value: '#f2ede1' },
          200: { value: '#e5dbbf' },
          300: { value: '#d2c195' },
          400: { value: '#c0a773' },
          500: { value: '#957d4c' },
          600: { value: '#826d42' },
          700: { value: '#6a5836' },
          800: { value: '#55472d' },
          900: { value: '#463a25' },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: '#ffffff' },
          subtle:  { value: '#f8f9fa' },
          muted:   { value: '#f0ede8' },
        },
        fg: {
          DEFAULT: { value: '#212529' },
          muted:   { value: '#6c757d' },
          subtle:  { value: '#adb5bd' },
        },
        accent: {
          DEFAULT: { value: '{colors.brand.500}' },
          hover:   { value: '{colors.brand.600}' },
          subtle:  { value: '{colors.brand.100}' },
        },
        border: {
          DEFAULT: { value: 'rgba(33, 37, 41, 0.10)' },
          hover:   { value: 'rgba(33, 37, 41, 0.25)' },
          focus:   { value: '{colors.brand.500}' },
        },
      },
    },
    recipes: {
      button: {
        base: {
          borderRadius: '0',
          fontWeight: 'normal',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        },
        variants: {
          visual: {
            primary: {
              bg: 'brand.500',
              color: 'white',
              _hover: { bg: 'brand.600', transform: 'translateY(-2px)' },
              _active: { bg: 'brand.700' },
            },
            outline: {
              border: '1px solid',
              borderColor: 'brand.500',
              color: 'brand.500',
              _hover: { bg: 'brand.50' },
            },
            ghost: {
              color: 'brand.500',
              _hover: { bg: 'brand.50' },
            },
          },
          size: {
            sm: { px: '4', py: '2', fontSize: 'sm' },
            md: { px: '6', py: '3', fontSize: 'md' },
            lg: { px: '8', py: '4', fontSize: 'lg' },
          },
        },
      },
    },
    textStyles: {
      display: {
        value: {
          fontSize: '4rem',
          lineHeight: '1.2',
          fontWeight: 'normal',
          fontFamily: 'heading',
        },
      },
      lead: {
        value: {
          fontSize: '1.25rem',
          fontWeight: '300',
          lineHeight: '1.6',
        },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)