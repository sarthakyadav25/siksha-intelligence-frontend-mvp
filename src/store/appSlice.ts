import { createSlice } from '@reduxjs/toolkit'

export type AppState = Record<string, never>

const initialState: AppState = {}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {},
})

export const appReducer = appSlice.reducer
