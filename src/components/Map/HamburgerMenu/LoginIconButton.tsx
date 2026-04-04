import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import React from 'react';
import { useOsmAuthContext } from '../../utils/OsmAuthContext';
import { OsmUserAvatarImg } from '../../utils/OsmUserAvatarImg';
import { DotLoader } from '../../helpers';

export const LoginIconButton = ({ size = 24 }: { size?: number }) => {
  const { osmUser, loading, userImage } = useOsmAuthContext();

  return (
    <>
      {osmUser ? (
        <OsmUserAvatarImg src={userImage} alt={osmUser} $size={size} />
      ) : loading ? (
        <div>
          <DotLoader />
        </div>
      ) : (
        <AccountCircleIcon />
      )}
    </>
  );
};
