import './globals.css';

export const metadata = {
  title: 'AI Home Visualizer',
  description: 'See your dream home before it\'s built. Upload a photo, choose materials, and preview your renovation instantly.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
