import { Box, Typography } from '@mui/material';
import Router from 'next/router';
import React from 'react';
import { useMobileMode } from '../helpers';
import { ClosePanelButton } from '../utils/ClosePanelButton';
import { MobilePageDrawer } from '../utils/MobilePageDrawer';
import { GradientHeading } from '../utils/panelUi';
import {
  PanelContent,
  PanelScrollbars,
  PanelSidePadding,
} from '../utils/PanelHelpers';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Box sx={{ mt: 4 }}>
    <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
      {title}
    </Typography>
    <Typography
      variant="body1"
      sx={{ color: 'text.secondary', mt: 1.25, lineHeight: 1.7 }}
    >
      {children}
    </Typography>
  </Box>
);

export const AboutPanel = () => {
  const isMobileMode = useMobileMode();
  const body = (
    <PanelSidePadding>
      <ClosePanelButton right onClick={() => Router.push('/')} />
      <Box sx={{ mt: 4 }}>
        <GradientHeading>Für Simon und Mama</GradientHeading>
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', mt: 1.5, lineHeight: 1.7 }}
        >
          Das ist eure Klettersteig-Karte. Nicht für alle, sondern für euch
          zwei: wo der Steig liegt, wie schwer er ist, und was andere Leute
          davon erzählt haben.
        </Typography>
      </Box>
      <Section title="So öffnet ihr einen Steig">
        Tippt den Namen auf der Karte an und zieht die Karteikarte hoch. Zuerst
        kommen Schwierigkeit und Dauer, dann die Fotos, dann die Beschreibung.
        Darunter die Sterne und fünf Bewertungen. Den Rest klappt „Mehr
        anzeigen“ auf.
      </Section>
      <Section title="Woher die Texte kommen">
        Fotos, Beschreibung und Bewertungen kommen von via-ferrata.de. Die
        Seite bleibt verlinkt, damit ihr das Original immer wiederfindet. Die
        Wege und Namen auf der Karte kommen von OpenStreetMap.
      </Section>
      <Section title="Was die Knöpfe tun">
        Der Filter unten rechts wählt die Art, den Grad und das Land. Die
        Kartenlagen wechseln zwischen der normalen Karte, der topografischen
        Karte und dem Satellitenbild. Drei Striche oben rechts öffnen Listen,
        Einstellungen und diese Seite.
      </Section>
    </PanelSidePadding>
  );

  return (
    <MobilePageDrawer className="about-drawer">
      <PanelContent $grow={isMobileMode}>
        {isMobileMode ? body : <PanelScrollbars>{body}</PanelScrollbars>}
      </PanelContent>
    </MobilePageDrawer>
  );
};
