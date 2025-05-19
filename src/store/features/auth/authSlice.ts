import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;
  userID: number;
  token: string;
  adminYN: string;
  userName: string;
  compID: number;
  compCode: string;
  compName: string;
  tokenExpiry: number;
}

interface UserDetails {
  userID: number;
  token: string;
  adminYN: string;
  userName: string;
  compID: number;
  compCode: string;
  compName: string;
  tokenExpiry: number;
}

const initialState: AuthState = {
  isAuthenticated: false,
  userID: 0,
  token: "",
  adminYN: "",
  userName: "",
  compID: 0,
  compCode: "",
  compName: "",
  tokenExpiry: 0,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUserDetails: (state, action: PayloadAction<UserDetails>) => {
      state.isAuthenticated = true;
      state.userID = action.payload.userID;
      state.token = action.payload.token;
      state.adminYN = action.payload.adminYN;
      state.userName = action.payload.userName;
      state.compID = action.payload.compID;
      state.compCode = action.payload.compCode;
      state.compName = action.payload.compName;
      state.tokenExpiry = action.payload.tokenExpiry;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.userID = 0;
      state.token = "";
      state.adminYN = "";
      state.userName = "";
      state.compID = 0;
      state.compCode = "";
      state.compName = "";
      state.tokenExpiry = 0;
    },
  },
});

export const { setUserDetails, logout } = authSlice.actions;
export default authSlice.reducer;
