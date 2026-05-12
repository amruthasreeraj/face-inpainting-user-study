import "./globals.css";

export const metadata = {
  title: "Face Inpainting User Study",
  description: "Anonymous user-study interface for comparing face inpainting outputs."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
