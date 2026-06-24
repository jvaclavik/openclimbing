import { MarkerOptions } from 'maplibre-gl';

// Copied from src/components/FeaturePanel/EditDialog/EditContent/FeatureEditSection/LocationEditor/useDraggableMarker.ts
const svgHtml = `
<svg xmlns="http://www.w3.org/2000/svg" width="27" height="41" display="block">
    <g transform="translate(3 29)">
        <ellipse cx="10.5" cy="5.8" opacity=".04" rx="10.5" ry="5.25"/>
        <ellipse cx="10.5" cy="5.8" opacity=".04" rx="10.5" ry="5.25"/>
        <ellipse cx="10.5" cy="5.8" opacity=".04" rx="9.5" ry="4.773"/>
        <ellipse cx="10.5" cy="5.8" opacity=".04" rx="8.5" ry="4.295"/>
        <ellipse cx="10.5" cy="5.8" opacity=".04" rx="7.5" ry="3.818"/>
        <ellipse cx="10.5" cy="5.8" opacity=".04" rx="6.5" ry="3.341"/>
        <ellipse cx="10.5" cy="5.8" opacity=".04" rx="5.5" ry="2.864"/>
        <ellipse cx="10.5" cy="5.8" opacity=".04" rx="4.5" ry="2.386"/>
    </g>
    <path fill="salmon"
          d="M27 13.5c0 5.575-6.75 13.5-12.25 21-.733 1-1.767 1-2.5 0C6.75 27 0 19.223 0 13.5 0 6.044 6.044 0 13.5 0S27 6.044 27 13.5Z"/>
    <path d="M13.5 0C6.044 0 0 6.044 0 13.5c0 5.723 6.75 13.5 12.25 21 .75 1.023 1.767 1 2.5 0C20.25 27 27 19.075 27 13.5 27 6.044 20.956 0 13.5 0Zm0 1C20.415 1 26 6.585 26 13.5c0 2.399-1.504 5.681-3.78 9.238-2.274 3.557-5.515 7.404-8.277 11.17-.2.273-.33.415-.443.533a4.934 4.934 0 0 1-.443-.533c-2.773-3.78-5.642-7.594-8.041-11.135C2.616 19.233 1 15.953 1 13.5 1 6.585 6.585 1 13.5 1Z"
          opacity=".25"/>
    <path d="m13.825 4.872 3.44 3.561-1.147 1.187-1.482-1.534v4.573h4.573l-1.535-1.482 1.187-1.147 3.561 3.44-3.56 3.438-1.188-1.146 1.535-1.482h-4.573v4.573l1.482-1.535 1.146 1.187-3.439 3.561-3.439-3.56 1.147-1.188 1.482 1.535V14.28H8.44l1.535 1.482-1.187 1.146-3.561-3.439 3.561-3.439 1.187 1.147-1.535 1.482h4.574V8.086L11.533 9.62l-1.147-1.187Z"
          fill="#fff"/>
</svg>`;

export const createCragMarkerOptions = (): MarkerOptions => {
  const element = document.createElement('div');
  element.style.width = '27px';
  element.style.height = '41px';
  element.style.zIndex = '999';
  element.innerHTML = svgHtml;

  return {
    draggable: true,
    element,
    offset: [0, -14],
  };
};
