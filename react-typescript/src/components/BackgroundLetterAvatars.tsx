import * as React from 'react';
import Avatar from '@mui/material/Avatar';

function stringToColor(string: string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}


interface BackgroundLetterAvatarsProps {
  userName: string;
}

function stringAvatar(name: string) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: `${name.charAt(0).toUpperCase()}`,
  };
}

export default function BackgroundLetterAvatars({userName}: BackgroundLetterAvatarsProps) {
  return (
      <Avatar {...stringAvatar(userName)} />
  );
}
