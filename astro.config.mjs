import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  server: { 
    port: 5000, 
    host: '0.0.0.0',
    allowedHosts: ['*'],
  },
  vite: {
    server: {
      allowedHosts: true,
    },
  },
  integrations: [
    starlight({
      title: 'FPF Wiki',
      description: 'Formal Project Framework Knowledge Base',
      social: [],
      sidebar: [
        { label: 'Home', link: '/' },
        {
          label: 'Parts',
          items: [
            { label: 'Part A: Kernel Architecture', link: '/parts/a/' },
            { label: 'Part B: Epistemic Cluster', link: '/parts/b/' },
            { label: 'Part C: Engineering Cluster', link: '/parts/c/' },
            { label: 'Part D: Governance Cluster', link: '/parts/d/' },
            { label: 'Part E: Method Cluster', link: '/parts/e/' },
            { label: 'Part F: Assurance Cluster', link: '/parts/f/' },
            { label: 'Part G: Operations Cluster', link: '/parts/g/' },
          ],
        },
        {
          label: 'Artifacts',
          collapsed: true,
          autogenerate: { directory: 'artifacts' },
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
});
