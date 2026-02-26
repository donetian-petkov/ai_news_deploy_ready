import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type AiUsageState = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

const initialState: AiUsageState = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0
};

const aiUsageSlice = createSlice({
  name: 'aiUsage',
  initialState,
  reducers: {
    setUsage(state, action: PayloadAction<AiUsageState>) {
      state.inputTokens = action.payload.inputTokens;
      state.outputTokens = action.payload.outputTokens;
      state.totalTokens = action.payload.totalTokens;
    }
  }
});

export const { setUsage } = aiUsageSlice.actions;
export default aiUsageSlice.reducer;
