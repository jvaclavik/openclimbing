import styled from '@emotion/styled';

export const OsmUserAvatarImg = styled.img<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background-color: white;
  object-fit: cover;
`;
