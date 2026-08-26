import {
  addOpenClimbingWebsite,
  featureHasDrawnRoutes,
  getOpenClimbingUrl,
  hasOpenClimbingLink,
  removeOpenClimbingWebsite,
} from '../openClimbingWebsite';
import { TagsEntries } from '../context/types';
import { Feature } from '../../../../services/types';

const URL = 'https://openclimbing.org/relation/123';

describe('getOpenClimbingUrl', () => {
  it('builds the url from a shortId', () => {
    expect(getOpenClimbingUrl('r123')).toBe(URL);
    expect(getOpenClimbingUrl('w5')).toBe('https://openclimbing.org/way/5');
  });
});

describe('hasOpenClimbingLink', () => {
  it('finds the link in any website slot', () => {
    expect(hasOpenClimbingLink({ website: URL })).toBe(true);
    expect(hasOpenClimbingLink({ 'website:2': URL })).toBe(true);
    expect(
      hasOpenClimbingLink({ 'website:1': 'http://openclimbing.org' }),
    ).toBe(true);
    expect(hasOpenClimbingLink({ 'contact:website': URL })).toBe(true);
  });

  it('ignores other websites and other tags', () => {
    expect(hasOpenClimbingLink({ website: 'https://horosvaz.cz' })).toBe(false);
    expect(hasOpenClimbingLink({ description: URL })).toBe(false);
    expect(
      hasOpenClimbingLink({ website: 'https://notopenclimbing.org' }),
    ).toBe(false);
  });
});

describe('addOpenClimbingWebsite', () => {
  it('adds the website tag when there is none', () => {
    const entries: TagsEntries = [['climbing', 'crag']];
    expect(addOpenClimbingWebsite(entries, URL)).toEqual([
      ['climbing', 'crag'],
      ['website', URL],
    ]);
  });

  it('shifts the existing websites up, keeping their position among the tags', () => {
    const entries: TagsEntries = [
      ['climbing', 'crag'],
      ['website', 'https://horosvaz.cz'],
      ['website:2', 'https://lezec.cz'],
      ['name', 'Skála'],
    ];
    expect(addOpenClimbingWebsite(entries, URL)).toEqual([
      ['climbing', 'crag'],
      ['website', URL],
      ['website:2', 'https://horosvaz.cz'],
      ['website:3', 'https://lezec.cz'],
      ['name', 'Skála'],
    ]);
  });

  it('is a no-op when the link is already there', () => {
    const entries: TagsEntries = [['website:2', URL]];
    expect(addOpenClimbingWebsite(entries, URL)).toBe(entries);
  });
});

describe('removeOpenClimbingWebsite', () => {
  it('reverts what addOpenClimbingWebsite() did', () => {
    const entries: TagsEntries = [
      ['climbing', 'crag'],
      ['website', 'https://horosvaz.cz'],
      ['website:2', 'https://lezec.cz'],
      ['name', 'Skála'],
    ];
    const added = addOpenClimbingWebsite(entries, URL);
    expect(removeOpenClimbingWebsite(added, URL)).toEqual(entries);
  });

  it('removes the only website tag', () => {
    const added = addOpenClimbingWebsite([['climbing', 'crag']], URL);
    expect(removeOpenClimbingWebsite(added, URL)).toEqual([
      ['climbing', 'crag'],
    ]);
  });

  it('keeps websites the user edited meanwhile', () => {
    const entries: TagsEntries = [
      ['website', URL],
      ['website:2', 'https://horosvaz.cz'],
      ['website:3', 'https://new.cz'],
    ];
    expect(removeOpenClimbingWebsite(entries, URL)).toEqual([
      ['website', 'https://horosvaz.cz'],
      ['website:2', 'https://new.cz'],
    ]);
  });

  it('does not touch a differently spelled link', () => {
    const entries: TagsEntries = [['website', 'https://openclimbing.org/x']];
    expect(removeOpenClimbingWebsite(entries, URL)).toBe(entries);
  });
});

describe('featureHasDrawnRoutes', () => {
  const asFeature = (partial: Partial<Feature>) => partial as Feature;
  const route = (tags: Record<string, string>) => asFeature({ tags });

  it('finds a drawn route among crag members', () => {
    const crag = asFeature({
      tags: { climbing: 'crag' },
      memberFeatures: [
        route({ climbing: 'route_bottom' }),
        route({ 'wikimedia_commons:2:path': '0.1,0.2|0.3,0.4' }),
      ],
    });
    expect(featureHasDrawnRoutes(crag)).toBe(true);
  });

  it('walks the whole area tree', () => {
    const area = asFeature({
      tags: { climbing: 'area' },
      memberFeatures: [
        asFeature({
          tags: { climbing: 'crag' },
          memberFeatures: [route({ 'wikimedia_commons:path': '0.1,0.2' })],
        }),
      ],
    });
    expect(featureHasDrawnRoutes(area)).toBe(true);
  });

  it('is false without any path tag', () => {
    const crag = asFeature({
      tags: { climbing: 'crag' },
      memberFeatures: [route({ wikimedia_commons: 'File:A.jpg' })],
    });
    expect(featureHasDrawnRoutes(crag)).toBe(false);
    expect(featureHasDrawnRoutes(asFeature({ tags: {} }))).toBe(false);
  });

  it('ignores an empty path tag', () => {
    const crag = asFeature({
      tags: { climbing: 'crag' },
      memberFeatures: [route({ 'wikimedia_commons:path': '  ' })],
    });
    expect(featureHasDrawnRoutes(crag)).toBe(false);
  });
});
