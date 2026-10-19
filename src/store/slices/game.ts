import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Notice, NoticeType, RoomState } from "@/types/game";
import { JoinResponse } from "@/types/api";
import { getSeat } from "@/utils/helpers";

interface GameSliceState {
  room: RoomState | null;
  playerId: string | null;
  // Sayfa yenilendiğinde odaya otomatik geri dönülürken true
  rejoining: boolean;
  connected: boolean;
  inviteOpen: boolean;
  notices: Notice[];
}

const initialState: GameSliceState = {
  room: null,
  playerId: null,
  rejoining: !!getSeat(),
  connected: false,
  inviteOpen: false,
  notices: [],
};

let noticeId = 0;

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    joined: (state, action: PayloadAction<JoinResponse>) => {
      state.room = action.payload.state;
      state.playerId = action.payload.playerId;
      state.rejoining = false;
    },
    left: (state) => {
      state.room = null;
      state.playerId = null;
      state.rejoining = false;
      state.inviteOpen = false;
    },
    setRoom: (state, action: PayloadAction<RoomState>) => {
      state.room = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    setRejoining: (state, action: PayloadAction<boolean>) => {
      state.rejoining = action.payload;
    },
    openInvite: (state) => {
      state.inviteOpen = true;
    },
    closeInvite: (state) => {
      state.inviteOpen = false;
    },
    pushNotice: {
      reducer: (state, action: PayloadAction<Notice>) => {
        state.notices.push(action.payload);
      },
      prepare: (payload: { message: string; type?: NoticeType }) => ({
        payload: { id: ++noticeId, message: payload.message, type: payload.type ?? "info" },
      }),
    },
    dismissNotice: (state, action: PayloadAction<number>) => {
      state.notices = state.notices.filter((n) => n.id !== action.payload);
    },
  },
});

export const {
  joined,
  left,
  setRoom,
  setConnected,
  setRejoining,
  openInvite,
  closeInvite,
  pushNotice,
  dismissNotice,
} = gameSlice.actions;
export default gameSlice.reducer;
