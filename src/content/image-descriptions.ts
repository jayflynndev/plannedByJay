// Visually reviewed public assets. Replace only the known poor label; later owner corrections win.
export const reviewedImageDescriptions:Record<string,{previous:string;description:string}>={
  'a173848f-4771-4d85-a52f-abc23252e509-caption.webp':{previous:'caption',description:'Outdoor swimming pool beside palm trees and the sea at sunset'},
  '17567303-84d8-4a26-b3b5-c6f645f65d28-zero-take-stpsjdvzyem-unsplash.webp':{previous:'zero take stpsjdvzyem unsplash',description:'Colourful beach parasols beside the sea, with a red lighthouse offshore'},
  'cbf89acf-5207-4d5f-a125-3bf3083d3f9a-lanzarote.webp':{previous:'Costa Blanca Beach, Lanzarote',description:'Sandy bay with turquoise water, beachgoers and a marina in the distance'},
  'f8d7def3-5d02-4ed7-83d7-fe323d2aa8bb-01m523q8m37a4kyf6j5kn0p825.webp':{previous:'All-Inclusive pool picture',description:'Floating breakfast tray with fruit, pastries and juice in a swimming pool'},
};
export function imageDescription(source:string|null|undefined,alt:string){
  let filename='';try{filename=decodeURIComponent((source||'').split('/').pop()?.split('?')[0]||'');}catch{}
  const reviewed=reviewedImageDescriptions[filename];
  if(reviewed&&alt.trim().toLowerCase()===reviewed.previous.toLowerCase())return reviewed.description;
  // Unknown generic placeholders/filenames give no useful description. In cards these
  // are decorative alongside the linked title; never guess a place from an upload name.
  return /^(?:caption|image|photo(?:graph)?|picture|img[-_ ]?\d+)(?:\.[a-z0-9]+)?$/i.test(alt.trim())||/\.(?:jpe?g|png|webp)$/i.test(alt.trim())?'':alt;
}
