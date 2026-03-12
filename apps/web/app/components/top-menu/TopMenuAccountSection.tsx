'use client';

import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useTopMenuContext } from './context/useTopMenuContext';

export function TopMenuAccountSection() {
  const {
    labels,
    controls: {
      model: { aiSettings }
    },
    account
  } = useTopMenuContext();
  const compactAuthButtonSx = {
    whiteSpace: 'nowrap',
    minWidth: { xs: 112, sm: 108 }
  } as const;

  return (
    <details className="controlSection controlSectionAccount" open>
      <summary id="accountSettingsSummary">{labels.accountSummary || labels.authAccountTitle || 'Account'}</summary>
      <div className="controlGroup controlGroupAccount">
        <Box className="topMenuCardBlock" sx={{ width: '100%', border: '1px solid var(--panel-border)', borderRadius: 2, p: 1 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
            {labels.authAccountTitle || 'Account'}
          </Typography>

          {account.user ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1 }}>
              <Typography variant="caption">{labels.authSignedInAs || 'Signed in as'}: {account.user.username}</Typography>
              <Button size="small" variant="outlined" onClick={account.signOut} disabled={account.busy}>
                {labels.authSignOut || 'Sign out'}
              </Button>
            </Stack>
          ) : (
            <Stack spacing={1} sx={{ mb: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  label={labels.authUsername || 'Username'}
                  value={account.username}
                  onChange={e => account.setUsername(e.target.value)}
                />
                <TextField
                  size="small"
                  fullWidth
                  type="password"
                  label={labels.authPassword || 'Password'}
                  value={account.password}
                  onChange={e => account.setPassword(e.target.value)}
                />
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button size="small" variant="contained" onClick={account.signIn} disabled={account.busy} sx={compactAuthButtonSx}>
                  {labels.authSignIn || 'Sign in'}
                </Button>
                <Button size="small" variant="outlined" onClick={account.register} disabled={account.busy} sx={compactAuthButtonSx}>
                  {labels.authRegister || 'Register'}
                </Button>
              </Stack>
            </Stack>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
            <TextField
              size="small"
              fullWidth
              type="password"
              label={labels.authApiKey || 'Provider API key'}
              placeholder={labels.authApiKeyPlaceholder || 'Paste API key for selected provider'}
              value={account.apiKey}
              onChange={e => account.setApiKey(e.target.value)}
              disabled={!account.user || account.busy}
            />
            <Button
              size="small"
              variant="contained"
              onClick={account.saveCurrentProviderKey}
              disabled={!account.user || account.busy || !String(account.apiKey || '').trim()}
            >
              {labels.authSaveKey || 'Save key'}
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1 }}>
            <Typography variant="caption">
              {account.hasSavedKey
                ? (labels.authKeyStoredYes || 'Saved key exists for selected provider.')
                : (labels.authKeyStoredNo || 'No saved key for selected provider.')}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => account.switchProviderWithSavedKey(aiSettings.aiProvider)}
              disabled={!account.user || !account.hasSavedKey || account.busy}
            >
              {labels.authApplyProvider || 'Apply provider'}
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ display: 'block', color: 'var(--text-muted)', mb: account.message ? 1 : 0 }}>
            {labels.accountPrefsAutosave || 'Preferences are auto-saved to your account.'}
          </Typography>

          {account.message ? (
            <Alert severity={account.message.kind} sx={{ py: 0 }}>
              {account.message.text}
            </Alert>
          ) : null}
        </Box>
      </div>
    </details>
  );
}
