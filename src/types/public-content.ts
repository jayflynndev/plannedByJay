export type ImageAsset={src:string;alt?:string;width:number;height:number};
export type ArticlePreview={id:string;title:string;slug:string;excerpt:string;content_type:string;image:(ImageAsset&{alt:string})|null};
export type DiscoveryQuery={q:string;type:string;category:string;tag:string;page:number};
export type DiscoveryResults={total:number;articles:{id:string;title:string;slug:string;excerpt:string;content_type:string;category_id:string|null;featured_alt:string;published_at:string|null;advice_pinned:boolean;image:ImageAsset|null}[];categories:{id:string;name:string}[];tags:{id:string;name:string}[];types?:string[]};
