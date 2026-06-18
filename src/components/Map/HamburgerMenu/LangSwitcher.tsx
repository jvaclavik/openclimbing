import { useRef } from 'react';
import React from 'react';
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useRouter } from 'next/router';
import { useBoolState } from '../../helpers';
import { changeLang, intl, t } from '../../../services/intl';
import { LANGUAGES, LANGUAGE_FLAGS } from '../../../config.mjs';

export const LangSwitcher = () => {
  const { asPath } = useRouter();
  const anchorRef = useRef();
  const [opened, open, close] = useBoolState(false);

  const getLangSetter = (lang) => (e) => {
    e.preventDefault();
    changeLang(lang);
    close();
  };

  return (
    <>
      <Menu
        id="language-switcher"
        keepMounted
        anchorEl={anchorRef.current}
        open={opened}
        onClose={close}
      >
        {Object.entries(LANGUAGES).map(([lang, name]) => (
          <MenuItem
            key={lang}
            component="a"
            href={`/${lang}${asPath}`}
            onClick={getLangSetter(lang)}
          >
            <ListItemIcon sx={{ minWidth: 32, fontSize: 18 }}>
              {LANGUAGE_FLAGS[lang]}
            </ListItemIcon>
            <ListItemText>{name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
      <MenuItem
        aria-controls="language-switcher"
        aria-haspopup="true"
        onClick={open}
        ref={anchorRef}
        title={t('map.language_title')}
      >
        <ListItemIcon sx={{ minWidth: 32, fontSize: 18 }}>
          {LANGUAGE_FLAGS[intl.lang]}
        </ListItemIcon>
        <ListItemText>{LANGUAGES[intl.lang]}</ListItemText>
      </MenuItem>
    </>
  );
};
