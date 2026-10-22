export type Action = { label: string; href: string };
export type Photo = { src: string; alt: string };
export type Holiday = Photo & { title: string; description: string; href:string };
