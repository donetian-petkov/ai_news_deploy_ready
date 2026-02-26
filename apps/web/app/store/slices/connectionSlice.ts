import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ConnectionStatus } from '../types';

type ConnectionState = {
  connected: boolean;
  status: ConnectionStatus;
};

const initialState: ConnectionState = {
  connected: false,
  status: 'connecting'
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.status = action.payload;
      state.connected = action.payload === 'connected';
    }
  }
});

export const { setStatus } = connectionSlice.actions;
export default connectionSlice.reducer;
