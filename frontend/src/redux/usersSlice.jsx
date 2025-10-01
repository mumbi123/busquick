import { createSlice } from '@reduxjs/toolkit';

const usersSlice = createSlice({
  name: 'users',
  initialState: { user: null },
  reducers: {
    setUser:  (state, action) => { state.user = action.payload; },
    clearUser:(state)         => { state.user = null; }
  }
});

export const { setUser, clearUser } = usersSlice.actions;
export default usersSlice.reducer;
