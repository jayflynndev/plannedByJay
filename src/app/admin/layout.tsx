import type { Metadata } from 'next';
import '../cms.css';
export const metadata:Metadata={title:'Content portal | Planned by Jay',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default function AdminLayout({children}:{children:React.ReactNode}) {return children;}
