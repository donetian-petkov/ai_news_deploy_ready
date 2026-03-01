'use client';

import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GridViewIcon from '@mui/icons-material/GridView';
import MenuIcon from '@mui/icons-material/Menu';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import SearchIcon from '@mui/icons-material/Search';
import SummarizeIcon from '@mui/icons-material/Summarize';
import TuneIcon from '@mui/icons-material/Tune';
import { StatusPills } from './StatusPills';
import { QuickVibeSelect } from './QuickVibeSelect';
import { TopMenuActionButton } from './TopMenuActionButton';
import type { TopMenuVibe } from './topMenu.services';

type TopMenuHeaderProps = {
  labels: Record<string, string>;
  topHintAsButtons: boolean;
  isMobile: boolean;
  connected: boolean;
  status: string;
  totalTokens: number;
  menuItemsAsIcons: boolean;
  vibe: TopMenuVibe;
  searchLabel: string;
  addStreamLabel: string;
  controlsLabel: string;
  allColumnLabel: string;
  menuLabel: string;
  hideAllResearchLabel: string;
  hideAllSummariesLabel: string;
  onScrollToColumns: () => void;
  onOpenHelp: () => void;
  onToggleMenu: () => void;
  onToggleSearch: () => void;
  onToggleAddStream: () => void;
  onToggleControls: () => void;
  onToggleAllColumnControls: () => void;
  onToggleHideAllResearch: () => void;
  onToggleHideAllSummaries: () => void;
  onChangeVibe: (nextVibe: TopMenuVibe) => void;
  onPlayToggleSound: () => void;
};

export function TopMenuHeader({
  labels,
  topHintAsButtons,
  isMobile,
  connected,
  status,
  totalTokens,
  menuItemsAsIcons,
  vibe,
  searchLabel,
  addStreamLabel,
  controlsLabel,
  allColumnLabel,
  menuLabel,
  hideAllResearchLabel,
  hideAllSummariesLabel,
  onScrollToColumns,
  onOpenHelp,
  onToggleMenu,
  onToggleSearch,
  onToggleAddStream,
  onToggleControls,
  onToggleAllColumnControls,
  onToggleHideAllResearch,
  onToggleHideAllSummaries,
  onChangeVibe,
  onPlayToggleSound
}: TopMenuHeaderProps) {
  return (
    <div className="headerRow">
      <Box className="headerLeft">
        <Typography id="appTitle" className="appTitleText" component="h1">
          {labels.title}
        </Typography>
        {topHintAsButtons ? (
          <Stack className="subHintButtons" id="subHintButtons" direction="row" spacing={0.7} flexWrap="wrap">
            <Button className="subHintBtn" size="small" variant="outlined" type="button" onClick={onScrollToColumns} startIcon={<OpenWithIcon fontSize="small" />}>
              {labels.subHintDrag}
            </Button>
            <Button className="subHintBtn" size="small" variant="outlined" type="button" onClick={onOpenHelp}>
              ? {labels.subHintHelp}
            </Button>
            <Button className="subHintBtn" size="small" variant="outlined" type="button" onClick={onToggleMenu} startIcon={<MenuIcon fontSize="small" />}>
              M {labels.subHintMenu}
            </Button>
            <Button className="subHintBtn" size="small" variant="outlined" type="button" onClick={onToggleSearch} startIcon={<SearchIcon fontSize="small" />}>
              / {labels.subHintSearch}
            </Button>
          </Stack>
        ) : (
          <div className="subHint" id="subHint">
            {labels.subHint}
          </div>
        )}
      </Box>

      {isMobile ? (
        <Stack className="headerRight mobileTopActions mobileTopActionsStack" spacing={1.1}>
          <Stack className="mobileStatusRow" direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack className="mobileStatusPills" direction="row" spacing={0.8}>
              <StatusPills connected={connected} status={status} totalTokens={totalTokens} />
            </Stack>
            <IconButton
              id="menuToggle"
              className="mobileMenuToggleBtn"
              size="small"
              onClick={onToggleMenu}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      ) : (
        <Stack className="headerRight" direction="row" flexWrap="wrap" gap={1.1} alignItems="center">
          <StatusPills connected={connected} status={status} totalTokens={totalTokens} />
          <QuickVibeSelect value={vibe} labels={labels} onChange={onChangeVibe} />
          <TopMenuActionButton id="quickSearchBtn" label={searchLabel} icon={<SearchIcon fontSize="small" />} menuItemsAsIcons={menuItemsAsIcons} onClick={onToggleSearch} onBeforeClick={onPlayToggleSound} />
          <TopMenuActionButton id="quickAddStreamBtn" label={addStreamLabel} icon={<AddIcon fontSize="small" />} menuItemsAsIcons={menuItemsAsIcons} onClick={onToggleAddStream} onBeforeClick={onPlayToggleSound} />
          <TopMenuActionButton id="controlsToggle" label={controlsLabel} icon={<TuneIcon fontSize="small" />} menuItemsAsIcons={menuItemsAsIcons} onClick={onToggleControls} onBeforeClick={onPlayToggleSound} />
          <TopMenuActionButton id="allColControlsToggle" label={allColumnLabel} icon={<GridViewIcon fontSize="small" />} menuItemsAsIcons={menuItemsAsIcons} onClick={onToggleAllColumnControls} onBeforeClick={onPlayToggleSound} />
          <TopMenuActionButton id="hideAllResearchBtn" label={hideAllResearchLabel} icon={<AutoAwesomeIcon fontSize="small" />} menuItemsAsIcons={menuItemsAsIcons} onClick={onToggleHideAllResearch} onBeforeClick={onPlayToggleSound} />
          <TopMenuActionButton id="hideAllSummariesBtn" label={hideAllSummariesLabel} icon={<SummarizeIcon fontSize="small" />} menuItemsAsIcons={menuItemsAsIcons} onClick={onToggleHideAllSummaries} onBeforeClick={onPlayToggleSound} />
          <TopMenuActionButton id="menuToggle" label={menuLabel} icon={<MenuIcon fontSize="small" />} menuItemsAsIcons={menuItemsAsIcons} onClick={onToggleMenu} onBeforeClick={onPlayToggleSound} />
        </Stack>
      )}
    </div>
  );
}
