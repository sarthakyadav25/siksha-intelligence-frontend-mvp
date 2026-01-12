import { configureStore } from '@reduxjs/toolkit'
import { appReducer } from './appSlice'
import { timetableReducer } from '@/features/academics/timetable_management/store/timetableSlice'

export const store = configureStore({
  reducer: {
    app: appReducer,
    timetable: timetableReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

