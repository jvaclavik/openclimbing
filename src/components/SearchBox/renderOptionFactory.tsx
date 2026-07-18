import React from 'react';
import { OverpassRow } from './options/overpass';
import { PresetRow } from './options/preset';
import { LoaderRow } from './utils';
import { GeocoderRow } from './options/geocoder';
import { Option } from './types';
import { OsmRow } from './options/osm';
import { CoordsRow } from './options/coords';
import { ClimbingRow } from './options/climbing';
import { TilesRow } from './options/tiles';
import { SeparatorRow } from './separators';

type Props = {
  option: Option;
  inputValue: string;
};

const Row = ({ option, inputValue }: Props) => {
  switch (option.type) {
    case 'geocoder':
      return <GeocoderRow option={option} inputValue={inputValue} />;
    case 'climbing':
      return <ClimbingRow option={option} inputValue={inputValue} />;
    case 'preset':
      return <PresetRow option={option} inputValue={inputValue} />;
    case 'overpass':
      return <OverpassRow option={option} />;
    case 'osm':
      return <OsmRow option={option} />;
    case 'coords':
      return <CoordsRow option={option} />;
    case 'tiles':
      return <TilesRow option={option} />;
    case 'loader':
      return <LoaderRow />;
    case 'separator':
      return <SeparatorRow />;
  }
};

export const renderOptionFactory = (inputValue: string) => {
  const renderOptionFn = ({ key, ...props }, option: Option) => {
    if (option.type === 'separator') {
      return (
        <li
          key={key}
          {...props} // eslint-disable-line react/jsx-props-no-spreading
          style={{ padding: 0, minHeight: 0, pointerEvents: 'none' }}
        >
          <SeparatorRow />
        </li>
      );
    }

    return (
      <li key={key} {...props}>
        <Row option={option} inputValue={inputValue} />
      </li>
    );
  };
  return renderOptionFn;
};
