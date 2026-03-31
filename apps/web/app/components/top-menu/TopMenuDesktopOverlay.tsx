'use client';

import { Box, Button, Dialog, Divider, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AddStreamSection } from './AddStreamSection';
import { SearchSection } from './SearchSection';
import { TopMenuControlsPanel } from './TopMenuControlsPanel';
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuDesktopOverlay() {
  const {
    isMobile,
    showDesktopBody,
    labels,
    searchVisible,
    addStreamVisible,
    controls: {
      model: { collapsed: controlsCollapsed }
    },
    onToggleMenu
  } = useTopMenuContext();

  const handleClose = () => onToggleMenu();

  if (isMobile || !showDesktopBody) return null;

  const showControlsPanel = !controlsCollapsed && !searchVisible && !addStreamVisible;

  return (
    <Dialog
      open={showDesktopBody}
      onClose={handleClose}
      fullScreen
      PaperProps={{ className: 'desktopOverlayPaper' }}
    >
      <Box className="desktopOverlayHeader">
        <Typography className="desktopOverlayTitle" variant="h5">
          {labels.title}
        </Typography>
        <Button variant="outlined" onClick={handleClose} startIcon={<CloseIcon fontSize="small" />}>
          {labels.close}
        </Button>
      </Box>
      <Divider className="desktopOverlayDivider" />
      <Box className="desktopOverlayBody">
        {searchVisible ? (
          <Box className="desktopOverlaySection">
            <SearchSection />
          </Box>
        ) : null}
        {addStreamVisible ? (
          <Box className="desktopOverlaySection">
            <AddStreamSection />
          </Box>
        ) : null}
        {showControlsPanel ? (
          <Box className="desktopOverlaySection">
            <TopMenuControlsPanel />
          </Box>
        ) : null}
      </Box>
    </Dialog>
  );
}
