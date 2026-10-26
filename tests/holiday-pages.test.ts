import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { holidayTypes, holidayType } from '../src/content/holiday-types';
import { holidayMetadata } from '../src/lib/holiday-metadata';
import { home } from '../src/content/home';
import { navigation } from '../src/content/navigation';

test('six holiday definitions drive valid routes, homepage cards, metadata, images, navigation and resilient sitemap',async()=>{
  assert.deepEqual(holidayTypes.map(item=>item.slug),['family','cruises','couples','city-breaks','something-different','accessible']);
  const titles=new Set(),descriptions=new Set();
  for(const item of holidayTypes){
    assert.equal(holidayType(item.slug),item);assert.match(item.slug,/^[a-z]+(?:-[a-z]+)*$/);
    assert.equal(home.holidays.items.find(card=>card.title===item.title)?.href,`/holidays/${item.slug}`);
    await access(`public${item.image.src}`);assert.ok(item.image.alt);
    assert.ok(item.introduction.length&&item.considerations.length&&item.ideas.length&&item.questions.length);
    assert.ok(item.alsoExplore.every(slug=>holidayType(slug)&&slug!==item.slug));
    const meta=holidayMetadata('https://plannedbyjay.com',item);
    assert.equal(meta.alternates?.canonical,`https://plannedbyjay.com/holidays/${item.slug}`);
    assert.ok(meta.openGraph);titles.add(meta.title);descriptions.add(meta.description);
    assert.equal(item.cta.action.href,'/plan-my-holiday');
  }
  assert.equal(titles.size,6);assert.equal(descriptions.size,6);assert.equal(holidayType('not-a-style'),undefined);assert.equal(holidayType('constructor'),undefined);
  assert.equal(navigation.find(item=>item.label==='Explore Holidays')?.href,'/holidays');
  assert.equal(holidayMetadata('https://plannedbyjay.com').alternates?.canonical,'https://plannedbyjay.com/holidays');
  const {default:sitemap}=await import('../src/app/sitemap');const map=await sitemap();assert.equal(map.filter(item=>item.url.includes('/holidays')).length,7);
  const route=await readFile('src/app/holidays/[slug]/page.tsx','utf8');
  assert.equal(route.match(/if\(!item\)notFound\(\)/g)?.length,2);
});
