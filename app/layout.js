import './globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
export const metadata={title:'QuickToolBox | Free Online Tools',description:'Free calculators, converters, PDF, QR, image and productivity tools.'};
export default function RootLayout({children}){return <html lang="en"><body>{children}<SpeedInsights /></body></html>}
